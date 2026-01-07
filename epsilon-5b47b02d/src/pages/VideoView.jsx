import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Play, Clock, Zap, CheckCircle, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toaster } from 'sonner';

export default function VideoView() {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
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

  const { data: video, isLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: async () => {
      const resources = await base44.entities.Resource.filter({ id: videoId });
      return resources[0];
    },
    enabled: !!videoId,
  });

  const { data: userProgress } = useQuery({
    queryKey: ['userProgress', user?.email],
    queryFn: async () => {
      const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
      return progress[0];
    },
    enabled: !!user,
  });

  const completeVideoMutation = useMutation({
    mutationFn: async () => {
      if (!userProgress) {
        await base44.entities.UserProgress.create({
          user_email: user.email,
          xp: video.xp_reward || 75,
          completed_lessons: [],
          completed_quizzes: [],
          completed_videos: [videoId],
          downloaded_resources: [],
          badges: ['starter'],
          streak_days: 1,
        });
      } else {
        const newCompletedVideos = userProgress.completed_videos || [];
        if (!newCompletedVideos.includes(videoId)) {
          newCompletedVideos.push(videoId);
          await base44.entities.UserProgress.update(userProgress.id, {
            completed_videos: newCompletedVideos,
            xp: (userProgress.xp || 0) + (video.xp_reward || 75),
          });
        }
      }
    },
    onSuccess: () => {
      setCompleted(true);
      queryClient.invalidateQueries(['userProgress']);
    },
  });

  // Extract YouTube video ID from URL
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = getYouTubeId(video?.video_url);
  const isAlreadyCompleted = userProgress?.completed_videos?.includes(videoId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#7c6aef] border-t-transparent" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Video not found</h2>
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
            <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center">
              <Play className="w-7 h-7 text-red-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{video.title}</h1>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {video.duration_minutes} min
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 text-amber-600">
                  <Zap className="w-3 h-3" />
                  +{video.xp_reward || 75} XP
                </Badge>
                <Badge className="bg-red-100 text-red-700">
                  {video.category}
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

        {/* Video Player */}
        <Card className="border-0 shadow-lg mb-6 overflow-hidden">
          <div className="aspect-video bg-black">
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <p>Video not available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Description & Actions */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">About This Video</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {video.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => completeVideoMutation.mutate()}
                disabled={isAlreadyCompleted || completed || !user}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAlreadyCompleted || completed ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marked as Watched
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Watched (+{video.xp_reward || 75} XP)
                  </>
                )}
              </Button>
              
              {video.video_url && (
                <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open on YouTube
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}