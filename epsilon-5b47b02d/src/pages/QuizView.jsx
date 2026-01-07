import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, FileText, Clock, Zap, CheckCircle, XCircle,
  ChevronRight, Trophy, RefreshCw, Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Toaster } from 'sonner';

export default function QuizView() {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (e) {
      // Not logged in
    }
  };

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const resources = await base44.entities.Resource.filter({ id: quizId });
      return resources[0];
    },
    enabled: !!quizId,
  });

  const { data: userProgress } = useQuery({
    queryKey: ['userProgress', user?.email],
    queryFn: async () => {
      const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
      return progress[0];
    },
    enabled: !!user,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (finalScore) => {
      // Save quiz attempt
      await base44.entities.QuizAttempt.create({
        user_email: user.email,
        quiz_id: quizId,
        score: finalScore,
        total_questions: questions.length,
        answers: Object.entries(selectedAnswers).map(([idx, answer]) => ({
          question_index: parseInt(idx),
          selected_answer: answer,
          correct: answer === questions[parseInt(idx)].correct_answer,
        })),
        completed_at: new Date().toISOString(),
      });

      // Update user progress
      if (userProgress) {
        const newCompletedQuizzes = userProgress.completed_quizzes || [];
        if (!newCompletedQuizzes.includes(quizId)) {
          newCompletedQuizzes.push(quizId);
          await base44.entities.UserProgress.update(userProgress.id, {
            completed_quizzes: newCompletedQuizzes,
            xp: (userProgress.xp || 0) + (quiz.xp_reward || 100),
          });
        }
      } else {
        await base44.entities.UserProgress.create({
          user_email: user.email,
          xp: quiz.xp_reward || 100,
          completed_lessons: [],
          completed_quizzes: [quizId],
          completed_videos: [],
          downloaded_resources: [],
          badges: ['starter'],
          streak_days: 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProgress']);
    },
  });

  const questions = quiz?.quiz_questions || [];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answerIndex,
    });
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResults(true);
    if (user) {
      submitQuizMutation.mutate(correctCount);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#7c6aef] border-t-transparent" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Quiz not found</h2>
          <Link to={createPageUrl('Resources')}>
            <Button>Back to Resources</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <Toaster />
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className={`p-8 text-center ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {passed ? 'Congratulations!' : 'Good Effort!'}
                </h2>
                <p className="text-white/80 text-lg">
                  {passed ? 'You passed the quiz!' : 'Keep practicing to improve!'}
                </p>
              </div>
              
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-slate-900 mb-2">{percentage}%</div>
                  <p className="text-slate-600">
                    You got {score} out of {questions.length} questions correct
                  </p>
                  {passed && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
                      <Zap className="w-5 h-5" />
                      <span className="font-semibold">+{quiz.xp_reward || 100} XP earned!</span>
                    </div>
                  )}
                </div>

                {/* Question Review */}
                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-slate-900">Review Your Answers:</h3>
                  {questions.map((q, idx) => {
                    const isCorrect = selectedAnswers[idx] === q.correct_answer;
                    return (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 text-sm">{q.question}</p>
                            {!isCorrect && (
                              <p className="text-sm text-slate-600 mt-2">
                                <span className="text-red-600">Your answer:</span> {q.options[selectedAnswers[idx]]}
                                <br />
                                <span className="text-green-600">Correct answer:</span> {q.options[q.correct_answer]}
                              </p>
                            )}
                            <p className="text-sm text-slate-500 mt-2 italic">{q.explanation}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleRetry}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Link to={createPageUrl('Resources')} className="flex-1">
                    <Button className="w-full bg-[#7c6aef] hover:bg-[#5b4acf]">
                      <Home className="w-4 h-4 mr-2" />
                      Back to Resources
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('Resources')} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
              <FileText className="w-7 h-7 text-green-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{quiz.title}</h1>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {quiz.duration_minutes} min
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 text-amber-600">
                  <Zap className="w-3 h-3" />
                  +{quiz.xp_reward || 100} XP
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-[#7c6aef]">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg mb-6">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">
                  {currentQ?.question}
                </h2>
                
                <div className="space-y-3">
                  {currentQ?.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                        selectedAnswers[currentQuestion] === idx
                          ? 'border-[#7c6aef] bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          selectedAnswers[currentQuestion] === idx
                            ? 'bg-[#7c6aef] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-slate-700">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  currentQuestion === idx
                    ? 'bg-[#7c6aef] text-white'
                    : selectedAnswers[idx] !== undefined
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          
          {currentQuestion < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={selectedAnswers[currentQuestion] === undefined}
              className="bg-[#7c6aef] hover:bg-[#5b4acf]"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(selectedAnswers).length < questions.length}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit Quiz
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}