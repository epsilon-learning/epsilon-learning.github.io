import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { Star, Users, BookOpen, Award, ArrowRight, Play, CheckCircle, TrendingUp, Quote, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import CountingNumber from '../components/CountingNumber';

export default function Home() {
  const [user, setUser] = useState(null);

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

  const { data: allProgress = [] } = useQuery({
    queryKey: ['allUserProgress'],
    queryFn: async () => {
      return await base44.entities.UserProgress.list();
    },
  });

  const { data: userProgress } = useQuery({
    queryKey: ['userProgress', user?.email],
    queryFn: async () => {
      const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
      return progress[0];
    },
    enabled: !!user,
  });

  // Calculate total XP from all users
  const totalXP = allProgress.reduce((sum, p) => sum + (p.xp || 0), 0);
  const displayXP = 21000 + totalXP;

  // Calculate total users who completed at least 1 lesson
  const usersWithLessons = allProgress.filter(p => (p.completed_lessons?.length || 0) >= 1).length;

  // Calculate number of users who completed 2+ lessons
  const totalUsers = allProgress.filter(p => (p.completed_lessons?.length || 0) >= 2).length;

  const stats = [
    { value: displayXP, label: 'Total XP Earned', icon: Zap, isNumber: true },
    { value: totalUsers, label: 'Total Users', icon: Users, isNumber: true, subtitle: `${usersWithLessons} completed 1+ lesson` },
  ];

  const features = [
    {
      title: 'Interactive Lessons',
      description: 'Engaging content designed by business professionals and educators.',
      icon: '📚',
    },
    {
      title: 'Video Tutorials',
      description: 'Watch and learn from real-world business case studies.',
      icon: '🎬',
    },
    {
      title: 'Practice Quizzes',
      description: 'Test your knowledge and track your progress.',
      icon: '✍️',
    },
    {
      title: 'Earn Rewards',
      description: 'Collect XP points and unlock exclusive badges.',
      icon: '🏆',
    },
  ];

  const reviews = [
    {
      name: 'Sarah Chen',
      role: 'Business Student',
      school: 'Lincoln High School',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      rating: 5,
      text: 'Epsilon helped me understand business concepts like nothing else. The interactive lessons and quizzes made complex topics easy to understand. I went from struggling with marketing basics to acing my exams!',
    },
    {
      name: 'Marcus Johnson',
      role: 'Business Club President',
      school: 'Westview Academy',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      rating: 5,
      text: 'Our entire business club uses Epsilon now. The gamification aspect keeps everyone motivated, and the progress tracking helps us identify areas where we need more practice. Highly recommend!',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Junior, Aspiring Entrepreneur',
      school: 'Oakwood High School',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      rating: 5,
      text: 'I started my first small business after completing the Entrepreneurship module. The real-world examples and downloadable resources gave me the confidence to take the leap. Thank you Epsilon!',
    },
    {
      name: 'David Park',
      role: 'Finance Enthusiast',
      school: 'Sunrise High School',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      rating: 5,
      text: 'The finance lessons are incredibly detailed. I finally understand concepts like cash flow and balance sheets. The video explanations are clear and the quizzes really help reinforce what you learn.',
    },
  ];

  const quotes = [
    {
      quote: 'The best investment you can make is in yourself.',
      author: 'Warren Buffett',
    },
    {
      quote: "Your most unhappy customers are your greatest source of learning.",
      author: 'Bill Gates',
    },
    {
      quote: 'The way to get started is to quit talking and begin doing.',
      author: 'Walt Disney',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-purple-50 py-20 lg:py-32">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
                Master <span className="text-gradient">Business</span><br />
                Build Your Future
              </h1>
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                Epsilon is your gateway to business excellence. Interactive lessons, engaging quizzes, and real-world knowledge—all designed to help students succeed.
              </p>
              <div className="flex justify-center">
                <Link to={createPageUrl('Resources')}>
                  <Button size="lg" className="bg-[#7c6aef] hover:bg-[#5b4acf] text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-purple-300/50">
                    Start Learning
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white py-8 border-y border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon className="w-5 h-5 text-[#7c6aef]" />
                  <span className="text-3xl font-bold text-slate-900">
                    {stat.isNumber ? <CountingNumber end={stat.value} /> : stat.value}
                  </span>
                </div>
                <span className="text-slate-500 text-sm">{stat.label}</span>
                {stat.subtitle && <p className="text-xs text-slate-400 mt-1">{stat.subtitle}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              About <span className="text-gradient">Us</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Epsilon was created by students, for students. We understand the challenges of learning business concepts and have built the perfect solution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-slate-50">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Our <span className="text-gradient">Mission</span>
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                At Epsilon, we believe every student deserves access to quality business education. Our mission is to democratize business learning by providing free, engaging, and comprehensive resources that prepare students for competitions, careers, and entrepreneurship.
              </p>
              <ul className="space-y-4">
                {[
                  'Created by experienced business educators',
                  'Constantly updated with new content',
                  'Accessible on any device, anytime',
                  'Track your progress and earn rewards',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
                <div className="space-y-6">
                  {quotes.map((q, index) => (
                    <div key={index} className="flex gap-4">
                      <Quote className="w-8 h-8 text-[#7c6aef] flex-shrink-0" />
                      <div>
                        <p className="text-slate-700 italic mb-2">"{q.quote}"</p>
                        <p className="text-sm text-slate-500 font-medium">— {q.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              What Students <span className="text-gradient">Say</span>
            </h2>
            <p className="text-xl text-slate-600">
              Join thousands of students who've transformed their business knowledge
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map((review, index) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-100"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{review.name}</h4>
                        <p className="text-sm text-[#7c6aef] font-medium">{review.role}</p>
                        <p className="text-sm text-slate-500">{review.school}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{review.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-header">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Excel in Business?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Start your journey today and join the Epsilon community of future business leaders.
            </p>
            <Link to={createPageUrl('Resources')}>
              <Button size="lg" className="bg-white text-[#7c6aef] hover:bg-slate-100 px-8 py-6 text-lg rounded-xl shadow-lg">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}