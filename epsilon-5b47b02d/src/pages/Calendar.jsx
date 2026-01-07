import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Video, Clock, User, CheckCircle, ExternalLink, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CreateMeetingDialog from '../components/CreateMeetingDialog';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [user, setUser] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
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

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => base44.entities.Meeting.list(),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations', user?.email],
    queryFn: () => base44.entities.MeetingRegistration.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const registerMutation = useMutation({
    mutationFn: async (meetingId) => {
      await base44.entities.MeetingRegistration.create({
        user_email: user.email,
        meeting_id: meetingId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['registrations']);
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async (meetingId) => {
      const reg = registrations.find(r => r.meeting_id === meetingId);
      if (reg) {
        await base44.entities.MeetingRegistration.delete(reg.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['registrations']);
    },
  });

  const registeredMeetingIds = registrations.map(r => r.meeting_id);

  // Filter meetings
  const filteredMeetings = meetings.filter(m => {
    const categoryMatch = filterCategory === 'all' || m.category === filterCategory;
    const typeMatch = filterType === 'all' || m.meeting_type === filterType;
    return categoryMatch && typeMatch;
  });

  // Get current month data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const getMeetingsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredMeetings.filter(m => m.date === dateStr);
  };

  const categoryColors = {
    fundamentals: 'bg-blue-500',
    marketing: 'bg-pink-500',
    finance: 'bg-green-500',
    entrepreneurship: 'bg-purple-500',
    leadership: 'bg-amber-500',
  };

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const selectedDateMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  // Get upcoming meetings (sorted by date)
  const upcomingMeetings = filteredMeetings
    .filter(m => new Date(m.date) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const meetingTypeLabels = {
    live_tutoring: 'Live Tutoring',
    group_study: 'Group Study'
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#7c6aef] flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Meeting Calendar</h1>
              <p className="text-slate-600">Join live sessions with expert instructors</p>
            </div>
          </div>
          <CreateMeetingDialog />
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-slate-400" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Meeting Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="live_tutoring">Live Tutoring</SelectItem>
                  <SelectItem value="group_study">Group Study</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="fundamentals">Fundamentals</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-xl">
                  {monthNames[month]} {year}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const dayMeetings = day ? getMeetingsForDate(day) : [];
                  const isSelected = selectedDate === day;
                  
                  return (
                    <motion.div
                      key={index}
                      whileHover={day ? { scale: 1.05 } : {}}
                      onClick={() => day && setSelectedDate(day === selectedDate ? null : day)}
                      className={`
                        aspect-square p-1 rounded-xl cursor-pointer transition-colors
                        ${day ? 'hover:bg-slate-100' : ''}
                        ${isSelected ? 'bg-[#7c6aef] text-white' : ''}
                        ${isToday(day) && !isSelected ? 'bg-purple-100' : ''}
                      `}
                    >
                      {day && (
                        <div className="h-full flex flex-col">
                          <span className={`text-sm font-medium ${isSelected ? 'text-white' : isToday(day) ? 'text-[#7c6aef]' : ''}`}>
                            {day}
                          </span>
                          {dayMeetings.length > 0 && (
                            <div className="flex gap-0.5 mt-1 flex-wrap">
                              {dayMeetings.slice(0, 3).map((meeting, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : categoryColors[meeting.category] || 'bg-slate-400'}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-6 pt-4 border-t justify-center flex-wrap">
                {Object.entries(categoryColors).map(([cat, color]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-sm text-slate-600 capitalize">{cat}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Meetings */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate 
                    ? `${monthNames[month]} ${selectedDate}, ${year}`
                    : 'Select a Date'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  selectedDateMeetings.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDateMeetings.map((meeting, index) => {
                        const isRegistered = registeredMeetingIds.includes(meeting.id);
                        return (
                          <motion.div
                            key={meeting.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-slate-50 rounded-xl"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <div className={`w-10 h-10 rounded-lg ${categoryColors[meeting.category]} flex items-center justify-center`}>
                                <Video className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900">{meeting.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  {meeting.time} ({meeting.duration_minutes} min)
                                </div>
                                <Badge variant="outline" className="mt-2 text-xs">
                                  {meetingTypeLabels[meeting.meeting_type]}
                                </Badge>
                                {meeting.recurring !== 'none' && (
                                  <Badge variant="outline" className="mt-2 ml-2 text-xs">
                                    {meeting.recurring}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3 text-sm">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-700">{meeting.teacher_name}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500">{meeting.teacher_title}</span>
                            </div>

                            <p className="text-sm text-slate-600 mb-4">{meeting.description}</p>

                            <div className="flex gap-2">
                              {isRegistered ? (
                                <>
                                  <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      Join Meeting
                                    </Button>
                                  </a>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => unregisterMutation.mutate(meeting.id)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  className="w-full bg-[#7c6aef] hover:bg-[#5b4acf]" 
                                  size="sm"
                                  onClick={() => user ? registerMutation.mutate(meeting.id) : base44.auth.redirectToLogin()}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Register
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-4">No meetings on this date</p>
                  )
                ) : (
                  <p className="text-slate-500 text-center py-4">Click on a date to view meetings</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting, index) => {
                    const meetingDate = new Date(meeting.date);
                    const isRegistered = registeredMeetingIds.includes(meeting.id);
                    return (
                      <div key={meeting.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                        <div className={`w-10 h-10 rounded-lg ${categoryColors[meeting.category]} flex items-center justify-center`}>
                          <Video className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{meeting.title}</p>
                          <p className="text-xs text-slate-500">
                            {meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {meeting.time}
                          </p>
                        </div>
                        {isRegistered && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Registered</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}