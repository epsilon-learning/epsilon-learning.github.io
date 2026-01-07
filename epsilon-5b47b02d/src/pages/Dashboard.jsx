import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { 
  Home, BookOpen, CheckCircle, Play, Download, Award, 
  Calendar, Flame, ChevronRight, Zap, Video, Clock, User, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProgressNotifications } from '../components/ProgressNotification';
import { Toaster } from 'sonner';
import CountingNumber from '../components/CountingNumber';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const previousProgress = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (e) {
      base44.auth.redirectToLogin();
    }
  };

  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['userProgress', user?.email],
    queryFn: async () => {
      const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
      if (progress.length === 0) {
        const newProgress = await base44.entities.UserProgress.create({
          user_email: user.email,
          xp: 0,
          completed_lessons: [],
          completed_quizzes: [],
          completed_videos: [],
          downloaded_resources: [],
          badges: [],
          streak_days: 0,
        });
        return newProgress;
      }
      return progress[0];
    },
    enabled: !!user,
    onSuccess: (newProgress) => {
      if (previousProgress.current) {
        // This will trigger notifications if there's a change
      }
      previousProgress.current = newProgress;
    },
  });

  // Use progress notifications hook
  useProgressNotifications(userProgress, previousProgress.current);

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list(),
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => base44.entities.Meeting.list(),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations', user?.email],
    queryFn: () => base44.entities.MeetingRegistration.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const registeredMeetingIds = registrations.map(r => r.meeting_id);
  
  // Get registered upcoming meetings
  const today = new Date();
  const upcomingRegisteredMeetings = meetings
    .filter(m => registeredMeetingIds.includes(m.id) && new Date(m.date) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const recentResources = resources.slice(0, 6);
  
  const completedCount = (userProgress?.completed_lessons?.length || 0) + 
    (userProgress?.completed_quizzes?.length || 0) + 
    (userProgress?.completed_videos?.length || 0);
  
  const totalResources = resources.length || 20;
  const progressPercent = Math.round((completedCount / totalResources) * 100);

  const activityData = [
    { day: 'Mon', completed: 3 },
    { day: 'Tue', completed: 5 },
    { day: 'Wed', completed: 2 },
    { day: 'Thu', completed: 7 },
    { day: 'Fri', completed: 4 },
    { day: 'Sat', completed: 1 },
    { day: 'Sun', completed: 6 },
  ];

  const categoryColors = {
    fundamentals: 'bg-blue-500',
    marketing: 'bg-pink-500',
    finance: 'bg-green-500',
    entrepreneurship: 'bg-purple-500',
    leadership: 'bg-amber-500',
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#7c6aef] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Toaster />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#7c6aef] flex items-center justify-center">
              <Home className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600">Welcome back, {user.full_name || 'Learner'}!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-100">
            <Zap className="w-6 h-6 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-slate-900">
                <CountingNumber end={userProgress?.xp || 0} />
              </p>
              <p className="text-sm text-slate-500">Total XP</p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Main Progress Card */}
          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#7c6aef]" />
                Recently Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      className="stroke-slate-100"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      className="stroke-[#7c6aef]"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${progressPercent * 3.52} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900">{progressPercent}%</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Lessons Completed</span>
                    <span className="font-semibold">
                      <CountingNumber end={userProgress?.completed_lessons?.length || 0} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Quizzes Passed</span>
                    <span className="font-semibold">
                      <CountingNumber end={userProgress?.completed_quizzes?.length || 0} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Videos Watched</span>
                    <span className="font-semibold">
                      <CountingNumber end={userProgress?.completed_videos?.length || 0} />
                    </span>
                  </div>
                </div>
              </div>

              <Link to={createPageUrl('Resources')}>
                <Button className="w-full bg-[#7c6aef] hover:bg-[#5b4acf]">
                  Continue Learning
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Last Worked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl font-bold text-white">{userProgress?.streak_days || 0}</span>
                </div>
                <p className="text-slate-600">Day Streak</p>
              </div>

              {/* Weekly Activity */}
              <div className="flex justify-between gap-1">
                {activityData.map((day, i) => (
                  <div key={day.day} className="flex flex-col items-center gap-1">
                    <div 
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                        day.completed > 0 ? 'bg-[#7c6aef] text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {day.completed}
                    </div>
                    <span className="text-xs text-slate-500">{day.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Meetings Section */}
        {upcomingRegisteredMeetings.length > 0 && (
          <Card className="border-0 shadow-md mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#7c6aef]" />
                Your Upcoming Meetings
              </CardTitle>
              <Link to={createPageUrl('Calendar')}>
                <Button variant="ghost" size="sm">
                  View Calendar
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingRegisteredMeetings.slice(0, 3).map((meeting, index) => {
                  const meetingDate = new Date(meeting.date);
                  return (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-lg ${categoryColors[meeting.category]} flex items-center justify-center`}>
                          <Video className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{meeting.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <Clock className="w-3 h-3" />
                            {meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {meeting.time}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700 truncate">{meeting.teacher_name}</span>
                      </div>

                      <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Join Meeting
                        </Button>
                      </a>
                    </motion.div>
                  );
                })}
              </div>
              
              {upcomingRegisteredMeetings.length > 3 && (
                <div className="mt-4 text-center">
                  <Link to={createPageUrl('Calendar')}>
                    <Button variant="outline">
                      View All {upcomingRegisteredMeetings.length} Meetings
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Lessons', value: userProgress?.completed_lessons?.length || 0, icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
            { label: 'Quizzes', value: userProgress?.completed_quizzes?.length || 0, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
            { label: 'Videos', value: userProgress?.completed_videos?.length || 0, icon: Play, color: 'bg-red-100 text-red-600' },
            { label: 'Downloads', value: userProgress?.downloaded_resources?.length || 0, icon: Download, color: 'bg-purple-100 text-purple-600' },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    <CountingNumber end={stat.value} />
                  </p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Resources */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Continue Where You Left Off</CardTitle>
            <Link to={createPageUrl('Resources')}>
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentResources.map((resource, index) => {
                const icons = { lesson: BookOpen, quiz: CheckCircle, video: Play, download: Download };
                const Icon = icons[resource.type] || BookOpen;
                const colors = {
                  lesson: 'bg-blue-100 text-blue-600',
                  quiz: 'bg-green-100 text-green-600',
                  video: 'bg-red-100 text-red-600',
                  download: 'bg-purple-100 text-purple-600',
                };

                // Check if resource is completed
                let isCompleted = false;
                if (resource.type === 'lesson') {
                  isCompleted = userProgress?.completed_lessons?.includes(resource.id);
                } else if (resource.type === 'quiz') {
                  isCompleted = userProgress?.completed_quizzes?.includes(resource.id);
                } else if (resource.type === 'video') {
                  isCompleted = userProgress?.completed_videos?.includes(resource.id);
                } else if (resource.type === 'download') {
                  isCompleted = userProgress?.downloaded_resources?.includes(resource.id);
                }

                const handleClick = () => {
                  if (resource.type === 'lesson') {
                    window.location.href = createPageUrl(`LessonView?id=${resource.id}`);
                  } else if (resource.type === 'quiz') {
                    window.location.href = createPageUrl(`QuizView?id=${resource.id}`);
                  } else if (resource.type === 'video') {
                    window.location.href = createPageUrl(`VideoView?id=${resource.id}`);
                  } else if (resource.type === 'download' && resource.download_url) {
                    window.open(resource.download_url, '_blank');
                  }
                };
                
                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={handleClick}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-lg ${colors[resource.type]} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">{resource.title}</p>
                        {isCompleted && (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500 capitalize">{resource.type}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#7c6aef] group-hover:translate-x-1 transition-all" />
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}