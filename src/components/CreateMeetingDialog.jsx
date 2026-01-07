import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, User, Calendar, Clock, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const teacherNames = [
  { name: 'Dr. Sarah Mitchell', title: 'MBA, Business Strategy Consultant' },
  { name: 'Prof. Michael Chen', title: 'PhD Economics, Financial Advisor' },
  { name: 'Jennifer Thompson', title: 'Marketing Director, Former CMO' },
  { name: 'David Rodriguez', title: 'Entrepreneur, 3x Startup Founder' },
  { name: 'Dr. Emily Watson', title: 'Leadership Coach, Harvard MBA' },
  { name: 'James Anderson', title: 'CFO, Investment Banking Expert' },
  { name: 'Dr. Lisa Park', title: 'Organizational Psychology, PhD' },
  { name: 'Robert Johnson', title: 'Digital Marketing Strategist' },
];

export default function CreateMeetingDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teacher_name: '',
    teacher_title: '',
    date: '',
    time: '',
    duration_minutes: 60,
    meeting_link: '',
    category: 'fundamentals',
    meeting_type: 'live_tutoring',
    recurring: 'none',
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Meeting.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['meetings']);
      toast.success('Meeting created successfully!');
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        teacher_name: '',
        teacher_title: '',
        date: '',
        time: '',
        duration_minutes: 60,
        meeting_link: '',
        category: 'fundamentals',
        meeting_type: 'live_tutoring',
        recurring: 'none',
      });
    },
  });

  const handleTeacherSelect = (teacher) => {
    setFormData({
      ...formData,
      teacher_name: teacher.name,
      teacher_title: teacher.title,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.meeting_link.startsWith('http')) {
      formData.meeting_link = 'https://' + formData.meeting_link;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#7c6aef] hover:bg-[#5b4acf]">
          <Plus className="w-4 h-4 mr-2" />
          Create Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Meeting</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Meeting Title *</Label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Introduction to Financial Planning"
            />
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What will be covered in this meeting?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Meeting Type *</Label>
              <Select
                value={formData.meeting_type}
                onValueChange={(value) => setFormData({ ...formData, meeting_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live_tutoring">Live Tutoring Session</SelectItem>
                  <SelectItem value="group_study">Group Study Opportunity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fundamentals">Business Fundamentals</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Select Teacher *</Label>
            <Select
              value={formData.teacher_name}
              onValueChange={(value) => {
                const teacher = teacherNames.find(t => t.name === value);
                if (teacher) handleTeacherSelect(teacher);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teacherNames.map((teacher) => (
                  <SelectItem key={teacher.name} value={teacher.name}>
                    <div className="flex flex-col">
                      <span className="font-medium">{teacher.name}</span>
                      <span className="text-xs text-slate-500">{teacher.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Date *</Label>
              <Input
                required
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label>Time *</Label>
              <Input
                required
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <div>
              <Label>Duration (min) *</Label>
              <Input
                required
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                min="15"
                step="15"
              />
            </div>
          </div>

          <div>
            <Label>Recurring *</Label>
            <Select
              value={formData.recurring}
              onValueChange={(value) => setFormData({ ...formData, recurring: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-time Meeting</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Meeting Link *</Label>
            <Input
              required
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              placeholder="zoom.us/j/123456789 or meet.google.com/abc-defg-hij"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-[#7c6aef] hover:bg-[#5b4acf]">
              Create Meeting
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}