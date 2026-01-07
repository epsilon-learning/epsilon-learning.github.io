import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Play, FileText, Download, Clock, Zap, ChevronRight, X, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateBusinessPDF } from '../components/PDFGenerator';
import { toast, Toaster } from 'sonner';

export default function Resources() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialType = urlParams.get('type') || 'all';
  const initialSearch = urlParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeType, setActiveType] = useState(initialType);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [user, setUser] = useState(null);
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

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list(),
  });

  const { data: userProgress } = useQuery({
    queryKey: ['userProgress', user?.email],
    queryFn: async () => {
      const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
      return progress[0];
    },
    enabled: !!user,
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ['quizAttempts', user?.email],
    queryFn: async () => {
      return await base44.entities.QuizAttempt.filter({ user_email: user.email });
    },
    enabled: !!user,
  });

  const trackDownloadMutation = useMutation({
    mutationFn: async (resourceId) => {
      if (!userProgress) {
        await base44.entities.UserProgress.create({
          user_email: user.email,
          xp: 50,
          completed_lessons: [],
          completed_quizzes: [],
          completed_videos: [],
          downloaded_resources: [resourceId],
          badges: ['starter'],
          streak_days: 1,
        });
      } else {
        const downloads = userProgress.downloaded_resources || [];
        if (!downloads.includes(resourceId)) {
          downloads.push(resourceId);
          await base44.entities.UserProgress.update(userProgress.id, {
            downloaded_resources: downloads,
            xp: (userProgress.xp || 0) + 50,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProgress']);
    },
  });

  const typeIcons = {
    lesson: BookOpen,
    quiz: FileText,
    video: Play,
    download: Download,
  };

  const typeColors = {
    lesson: 'bg-blue-100 text-blue-700',
    quiz: 'bg-green-100 text-green-700',
    video: 'bg-red-100 text-red-700',
    download: 'bg-purple-100 text-purple-700',
  };

  const difficultyColors = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-rose-100 text-rose-700',
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeType === 'all' || resource.type === activeType;
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || resource.difficulty === selectedDifficulty;
    return matchesSearch && matchesType && matchesCategory && matchesDifficulty;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'fundamentals', label: 'Business Fundamentals' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'entrepreneurship', label: 'Entrepreneurship' },
    { value: 'leadership', label: 'Leadership' },
  ];

  const handleResourceClick = (resource) => {
    if (resource.type === 'lesson') {
      window.location.href = createPageUrl(`LessonView?id=${resource.id}`);
    } else if (resource.type === 'quiz') {
      window.location.href = createPageUrl(`QuizView?id=${resource.id}`);
    } else if (resource.type === 'video') {
      window.location.href = createPageUrl(`VideoView?id=${resource.id}`);
    } else if (resource.type === 'download') {
      // Generate and download PDF
      if (user) {
        trackDownloadMutation.mutate(resource.id);
      }
      toast.success('Generating PDF...');
      setTimeout(() => {
        generateBusinessPDF(resource);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Toaster />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[#7c6aef] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Resources</h1>
          </div>
          <p className="text-slate-600">Explore our library of lessons, quizzes, videos, and downloadable content</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search lessons, quizzes, videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg border-slate-200 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Type Tabs */}
          <div className="mb-6">
            <Tabs value={activeType} onValueChange={setActiveType}>
              <TabsList className="bg-slate-100 p-1 h-auto flex-wrap">
                <TabsTrigger value="all" className="data-[state=active]:bg-white px-6 py-2">
                  All
                </TabsTrigger>
                <TabsTrigger value="lesson" className="data-[state=active]:bg-white px-6 py-2">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Lessons
                </TabsTrigger>
                <TabsTrigger value="quiz" className="data-[state=active]:bg-white px-6 py-2">
                  <FileText className="w-4 h-4 mr-2" />
                  Quizzes
                </TabsTrigger>
                <TabsTrigger value="video" className="data-[state=active]:bg-white px-6 py-2">
                  <Play className="w-4 h-4 mr-2" />
                  Videos
                </TabsTrigger>
                <TabsTrigger value="download" className="data-[state=active]:bg-white px-6 py-2">
                  <Download className="w-4 h-4 mr-2" />
                  Downloads
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredResources.length}</span> resources
          </p>
        </div>

        {/* Resource Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-slate-200 rounded-xl mb-4" />
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-full mb-4" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-slate-200 rounded-full" />
                    <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No resources found</h3>
            <p className="text-slate-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredResources.map((resource, index) => {
                const TypeIcon = typeIcons[resource.type] || BookOpen;
                
                // Check completion status
                let isCompleted = false;
                let quizScore = null;
                
                if (userProgress) {
                  if (resource.type === 'lesson') {
                    isCompleted = userProgress.completed_lessons?.includes(resource.id);
                  } else if (resource.type === 'quiz') {
                    isCompleted = userProgress.completed_quizzes?.includes(resource.id);
                    const attempt = quizAttempts.find(a => a.quiz_id === resource.id);
                    if (attempt) {
                      quizScore = `${attempt.score}/${attempt.total_questions}`;
                    }
                  } else if (resource.type === 'video') {
                    isCompleted = userProgress.completed_videos?.includes(resource.id);
                  } else if (resource.type === 'download') {
                    isCompleted = userProgress.downloaded_resources?.includes(resource.id);
                  }
                }

                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Card
                      className="h-full border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group bg-white"
                      onClick={() => handleResourceClick(resource)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl ${typeColors[resource.type]} flex items-center justify-center`}>
                            <TypeIcon className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className={difficultyColors[resource.difficulty]}>
                              {resource.difficulty}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                              {isCompleted ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-xs text-green-600 font-medium">
                                    {quizScore ? `Complete (${quizScore})` : 'Complete'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs text-slate-500">Incomplete</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[#7c6aef] transition-colors">
                          {resource.title}
                        </h3>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                          {resource.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            {resource.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {resource.duration_minutes} min
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <Zap className="w-4 h-4" />
                              +{resource.xp_reward || 100} XP
                            </span>
                          </div>
                          {resource.type === 'download' ? (
                            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-[#7c6aef] transition-colors" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#7c6aef] group-hover:translate-x-1 transition-all" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}