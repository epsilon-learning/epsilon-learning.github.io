import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Award, Zap, BookOpen, CheckCircle, Play, Download, Edit2, LogOut, Star, Trophy, Target, Flame, Crown, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Custom HTML Badge Components
const BadgeDisplay = ({ badge, earned = true }) => {
  const badgeConfigs = {
    starter: {
      gradient: 'from-slate-400 to-slate-600',
      icon: Star,
      border: 'border-slate-400',
      glow: 'shadow-slate-300/50',
      title: 'Getting Started',
      description: 'Welcome to Epsilon!',
    },
    learner: {
      gradient: 'from-blue-400 to-blue-600',
      icon: BookOpen,
      border: 'border-blue-400',
      glow: 'shadow-blue-300/50',
      title: 'Eager Learner',
      description: 'Complete 5 lessons',
    },
    quiz_master: {
      gradient: 'from-green-400 to-emerald-600',
      icon: CheckCircle,
      border: 'border-green-400',
      glow: 'shadow-green-300/50',
      title: 'Quiz Master',
      description: 'Pass 5 quizzes',
    },
    video_watcher: {
      gradient: 'from-red-400 to-rose-600',
      icon: Play,
      border: 'border-red-400',
      glow: 'shadow-red-300/50',
      title: 'Video Scholar',
      description: 'Watch 5 videos',
    },
    xp_hunter: {
      gradient: 'from-amber-400 to-orange-600',
      icon: Zap,
      border: 'border-amber-400',
      glow: 'shadow-amber-300/50',
      title: 'XP Hunter',
      description: 'Earn 1000 XP',
    },
    streak_master: {
      gradient: 'from-orange-500 to-red-600',
      icon: Flame,
      border: 'border-orange-400',
      glow: 'shadow-orange-300/50',
      title: 'On Fire',
      description: '7-day streak',
    },
    champion: {
      gradient: 'from-purple-400 to-violet-600',
      icon: Trophy,
      border: 'border-purple-400',
      glow: 'shadow-purple-300/50',
      title: 'Champion',
      description: 'Complete 10 resources',
    },
    completionist: {
      gradient: 'from-indigo-400 to-purple-600',
      icon: Target,
      border: 'border-indigo-400',
      glow: 'shadow-indigo-300/50',
      title: 'Completionist',
      description: 'Finish all categories',
    },
    legend: {
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      icon: Crown,
      border: 'border-yellow-400',
      glow: 'shadow-yellow-300/50',
      title: 'Epsilon Legend',
      description: 'Master all content',
    },
    diamond: {
      gradient: 'from-cyan-400 to-blue-500',
      icon: Gem,
      border: 'border-cyan-400',
      glow: 'shadow-cyan-300/50',
      title: 'Diamond Status',
      description: 'Earn 5000 XP',
    },
  };

  const config = badgeConfigs[badge.id] || badgeConfigs.starter;
  const IconComponent = config.icon;

  if (!earned) {
    return (
      <div className="relative group">
        <div className="w-24 h-28 rounded-xl bg-slate-200 border-2 border-slate-300 border-dashed flex flex-col items-center justify-center p-2 opacity-60">
          <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center mb-2">
            <span className="text-xl">🔒</span>
          </div>
          <span className="text-[10px] font-medium text-slate-500 text-center">???</span>
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <div className="bg-slate-900 text-white text-xs py-2 px-3 rounded-lg whitespace-nowrap shadow-lg">
            <p className="font-semibold">{config.title}</p>
            <p className="text-slate-300">{config.description}</p>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative group cursor-pointer"
    >
      {/* Badge Container */}
      <div className={`
        w-24 h-28 rounded-xl 
        bg-gradient-to-br ${config.gradient} 
        border-2 ${config.border}
        shadow-lg ${config.glow}
        flex flex-col items-center justify-center p-2
        relative overflow-hidden
      `}>
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
        
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 relative z-10">
          <IconComponent className="w-6 h-6 text-white drop-shadow-md" />
        </div>
        
        {/* Badge Name */}
        <div className="w-full bg-white/20 backdrop-blur-sm rounded py-1 px-2 relative z-10">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider block text-center truncate">
            {badge.name}
          </span>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/40" />
        <div className="absolute top-3 right-3 w-1 h-1 rounded-full bg-white/30" />
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="bg-slate-900 text-white text-xs py-2 px-3 rounded-lg whitespace-nowrap shadow-lg">
          <p className="font-semibold">{config.title}</p>
          <p className="text-slate-300">{config.description}</p>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </div>
    </motion.div>
  );
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setEditName(currentUser.full_name || '');
      setTheme(currentUser.theme || 'light');
    } catch (e) {
      base44.auth.redirectToLogin();
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      await base44.auth.updateMe({ theme: newTheme });
      // Reload page to apply theme
      window.location.reload();
    } catch (e) {
      console.error('Failed to update theme');
    }
  };

  const { data: userProgress, isLoading } = useQuery({
    queryKey: ['userProgress', user?.email],
    queryFn: async () => {
      const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
      if (progress.length === 0) {
        return {
          xp: 0,
          completed_lessons: [],
          completed_quizzes: [],
          completed_videos: [],
          downloaded_resources: [],
          badges: ['starter'],
          streak_days: 0,
        };
      }
      return progress[0];
    },
    enabled: !!user,
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ['quizAttempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ user_email: user.email }),
    enabled: !!user,
  });

  // Calculate badges based on progress
  const calculateEarnedBadges = () => {
    const badges = ['starter']; // Everyone gets starter
    
    if ((userProgress?.completed_lessons?.length || 0) >= 5) {
      badges.push('learner');
    }
    if ((userProgress?.completed_quizzes?.length || 0) >= 5) {
      badges.push('quiz_master');
    }
    if ((userProgress?.completed_videos?.length || 0) >= 5) {
      badges.push('video_watcher');
    }
    if ((userProgress?.xp || 0) >= 1000) {
      badges.push('xp_hunter');
    }
    if ((userProgress?.streak_days || 0) >= 7) {
      badges.push('streak_master');
    }
    
    const totalCompleted = (userProgress?.completed_lessons?.length || 0) + 
      (userProgress?.completed_quizzes?.length || 0) + 
      (userProgress?.completed_videos?.length || 0);
    
    if (totalCompleted >= 10) {
      badges.push('champion');
    }
    if ((userProgress?.xp || 0) >= 5000) {
      badges.push('diamond');
    }
    
    return badges;
  };

  // All possible badges
  const allBadges = [
    { id: 'starter', name: 'Starter' },
    { id: 'learner', name: 'Learner' },
    { id: 'quiz_master', name: 'Quiz Pro' },
    { id: 'video_watcher', name: 'Scholar' },
    { id: 'xp_hunter', name: 'Hunter' },
    { id: 'streak_master', name: 'On Fire' },
    { id: 'champion', name: 'Champion' },
    { id: 'completionist', name: 'Complete' },
    { id: 'legend', name: 'Legend' },
    { id: 'diamond', name: 'Diamond' },
  ];

  const earnedBadgeIds = calculateEarnedBadges();
  const earnedBadges = allBadges.filter(b => earnedBadgeIds.includes(b.id));
  const lockedBadges = allBadges.filter(b => !earnedBadgeIds.includes(b.id));

  const handleUpdateProfile = async () => {
    try {
      await base44.auth.updateMe({ full_name: editName });
      setUser({ ...user, full_name: editName });
      setEditDialogOpen(false);
    } catch (e) {
      console.error('Failed to update profile');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Calculate level based on XP
  const xp = userProgress?.xp || 0;
  const level = Math.floor(xp / 500) + 1;
  const xpToNextLevel = 500 - (xp % 500);
  const levelProgress = ((xp % 500) / 500) * 100;

  // Calculate quiz stats
  const avgScore = quizAttempts.length > 0 
    ? Math.round(quizAttempts.reduce((acc, a) => acc + (a.score / a.total_questions * 100), 0) / quizAttempts.length)
    : 0;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#7c6aef] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Profile Header */}
        <Card className="border-0 shadow-lg overflow-hidden mb-8">
          <div className="gradient-header h-32 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#7c6aef] to-[#a99ef7]" />
            {/* Level Badge */}
            <div className="absolute top-4 right-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <span className="text-2xl font-bold text-white">{level}</span>
              </div>
            </div>
          </div>
          
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 mb-6">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <User className="w-14 h-14 text-slate-400" />
                </div>
              </div>
              
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  {user.full_name || 'Epsilon Learner'}
                </h1>
                <p className="text-slate-500">{user.email}</p>
              </div>

              <div className="flex gap-2">
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                      <Button onClick={handleUpdateProfile} className="w-full bg-[#7c6aef] hover:bg-[#5b4acf]">
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* XP and Level Progress */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-slate-900">{xp} XP</span>
                </div>
                <span className="text-sm text-slate-500">Level {level}</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#7c6aef] to-[#a99ef7] rounded-full"
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">{xpToNextLevel} XP to Level {level + 1}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Lessons', value: userProgress?.completed_lessons?.length || 0, icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
            { label: 'Quizzes', value: userProgress?.completed_quizzes?.length || 0, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
            { label: 'Videos', value: userProgress?.completed_videos?.length || 0, icon: Play, color: 'bg-red-100 text-red-600' },
            { label: 'Downloads', value: userProgress?.downloaded_resources?.length || 0, icon: Download, color: 'bg-purple-100 text-purple-600' },
            { label: 'Avg Quiz', value: `${avgScore}%`, icon: Target, color: 'bg-amber-100 text-amber-600' },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Badges Section */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#7c6aef]" />
              Badges Earned ({earnedBadges.length}/{allBadges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Earned Badges */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Unlocked</h3>
              <div className="flex flex-wrap gap-4">
                {earnedBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <BadgeDisplay badge={badge} earned={true} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Locked Badges */}
            {lockedBadges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Locked</h3>
                <div className="flex flex-wrap gap-4">
                  {lockedBadges.map((badge) => (
                    <BadgeDisplay key={badge.id} badge={badge} earned={false} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-0 shadow-md mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-3 block">Theme</Label>
              <div className="flex gap-4">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === 'light' ? 'border-[#7c6aef] bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-300" />
                  <span className="text-sm font-medium text-slate-700">Light Mode</span>
                </button>

                <button
                  onClick={() => handleThemeChange('high-contrast')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === 'high-contrast' ? 'border-[#7c6aef] bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-slate-300 overflow-hidden flex">
                    <div className="w-1/2 bg-white" />
                    <div className="w-1/2 bg-slate-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">High Contrast</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}