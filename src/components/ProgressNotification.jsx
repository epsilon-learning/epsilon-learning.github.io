import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Award, Zap, TrendingUp } from 'lucide-react';

export const useProgressNotifications = (userProgress, previousProgress) => {
  const hasShownRef = useRef(new Set());

  useEffect(() => {
    if (!userProgress || !previousProgress) return;

    const currentXP = userProgress.xp || 0;
    const previousXP = previousProgress.xp || 0;
    const currentLevel = Math.floor(currentXP / 500) + 1;
    const previousLevel = Math.floor(previousXP / 500) + 1;

    // Check for level up
    if (currentLevel > previousLevel && !hasShownRef.current.has(`level-${currentLevel}`)) {
      hasShownRef.current.add(`level-${currentLevel}`);
      
      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c6aef', '#a99ef7', '#f8b84e']
      });

      toast.success(
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold">Level Up!</p>
            <p className="text-sm text-slate-600">You've reached Level {currentLevel}! Keep learning!</p>
          </div>
        </div>,
        {
          duration: 5000,
          position: 'top-center',
        }
      );
    }

    // Check for new badges
    const previousBadges = calculateEarnedBadges(previousProgress);
    const currentBadges = calculateEarnedBadges(userProgress);
    
    currentBadges.forEach(badge => {
      if (!previousBadges.includes(badge) && !hasShownRef.current.has(`badge-${badge}`)) {
        hasShownRef.current.add(`badge-${badge}`);
        
        const badgeNames = {
          learner: 'Eager Learner',
          quiz_master: 'Quiz Master',
          video_watcher: 'Video Scholar',
          xp_hunter: 'XP Hunter',
          streak_master: 'On Fire',
          champion: 'Champion',
          diamond: 'Diamond Status'
        };

        // Fire confetti
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });

        toast.success(
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">Badge Unlocked!</p>
              <p className="text-sm text-slate-600">{badgeNames[badge] || badge}</p>
            </div>
          </div>,
          {
            duration: 5000,
            position: 'top-center',
          }
        );
      }
    });

    // XP gain notification (subtle)
    if (currentXP > previousXP) {
      const xpGained = currentXP - previousXP;
      toast(
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <span className="font-medium">+{xpGained} XP</span>
        </div>,
        {
          duration: 2000,
          position: 'bottom-right',
        }
      );
    }
  }, [userProgress, previousProgress]);
};

const calculateEarnedBadges = (progress) => {
  if (!progress) return ['starter'];
  
  const badges = ['starter'];
  
  if ((progress.completed_lessons?.length || 0) >= 5) badges.push('learner');
  if ((progress.completed_quizzes?.length || 0) >= 5) badges.push('quiz_master');
  if ((progress.completed_videos?.length || 0) >= 5) badges.push('video_watcher');
  if ((progress.xp || 0) >= 1000) badges.push('xp_hunter');
  if ((progress.streak_days || 0) >= 7) badges.push('streak_master');
  
  const totalCompleted = (progress.completed_lessons?.length || 0) + 
    (progress.completed_quizzes?.length || 0) + 
    (progress.completed_videos?.length || 0);
  
  if (totalCompleted >= 10) badges.push('champion');
  if ((progress.xp || 0) >= 5000) badges.push('diamond');
  
  return badges;
};