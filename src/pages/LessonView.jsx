import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, BookOpen, Clock, Zap, CheckCircle, ChevronRight, 
  ChevronLeft, ExternalLink, BookMarked
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Toaster } from 'sonner';

export default function LessonView() {
  const urlParams = new URLSearchParams(window.location.search);
  const lessonId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [completed, setCompleted] = useState(false);
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

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const resources = await base44.entities.Resource.filter({ id: lessonId });
      return resources[0];
    },
    enabled: !!lessonId,
  });

  const { data: userProgress } = useQuery({
    queryKey: ['userProgress', user?.email],
    queryFn: async () => {
      const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
      return progress[0];
    },
    enabled: !!user,
  });

  const completeLessonMutation = useMutation({
    mutationFn: async () => {
      if (!userProgress) {
        await base44.entities.UserProgress.create({
          user_email: user.email,
          xp: lesson.xp_reward || 150,
          completed_lessons: [lessonId],
          completed_quizzes: [],
          completed_videos: [],
          downloaded_resources: [],
          badges: ['starter'],
          streak_days: 1,
        });
      } else {
        const newCompletedLessons = userProgress.completed_lessons || [];
        if (!newCompletedLessons.includes(lessonId)) {
          newCompletedLessons.push(lessonId);
          await base44.entities.UserProgress.update(userProgress.id, {
            completed_lessons: newCompletedLessons,
            xp: (userProgress.xp || 0) + (lesson.xp_reward || 150),
          });
        }
      }
    },
    onSuccess: () => {
      setCompleted(true);
      queryClient.invalidateQueries(['userProgress']);
    },
  });

  const sections = lesson?.lesson_content?.sections || [];
  const sources = lesson?.lesson_content?.sources || [];
  const progress = sections.length > 0 ? ((currentSection + 1) / sections.length) * 100 : 0;

  const isAlreadyCompleted = userProgress?.completed_lessons?.includes(lessonId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#7c6aef] border-t-transparent" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Lesson not found</h2>
          <Link to={createPageUrl('Resources')}>
            <Button>Back to Resources</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Toaster />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('Resources')} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{lesson.title}</h1>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lesson.duration_minutes} min
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 text-amber-600">
                  <Zap className="w-3 h-3" />
                  +{lesson.xp_reward || 150} XP
                </Badge>
                <Badge className="bg-blue-100 text-blue-700">
                  {lesson.category}
                </Badge>
                {(isAlreadyCompleted || completed) && (
                  <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Section {currentSection + 1} of {sections.length}
              </span>
              <span className="text-sm font-medium text-[#7c6aef]">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Content */}
        {sections.length > 0 && (
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg mb-6">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  {sections[currentSection].title}
                </h2>
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-slate-700 leading-relaxed mb-4">{children}</p>,
                      strong: ({ children }) => <strong className="text-slate-900 font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4">{children}</ul>,
                      li: ({ children }) => <li className="text-slate-700">{children}</li>,
                      h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">{children}</h3>,
                    }}
                  >
                    {sections[currentSection].content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentSection < sections.length - 1 ? (
            <Button
              onClick={() => setCurrentSection(currentSection + 1)}
              className="bg-[#7c6aef] hover:bg-[#5b4acf]"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => completeLessonMutation.mutate()}
              disabled={isAlreadyCompleted || completed || !user}
              className="bg-green-600 hover:bg-green-700"
            >
              {isAlreadyCompleted || completed ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  Complete Lesson
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-[#7c6aef]" />
                Sources & References
              </h3>
              <div className="space-y-3">
                {sources.map((source, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-xs flex-shrink-0">
                      {source.number}
                    </span>
                    <div>
                      <p className="text-slate-700">{source.citation}</p>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7c6aef] hover:underline flex items-center gap-1 mt-1"
                        >
                          View Source
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}