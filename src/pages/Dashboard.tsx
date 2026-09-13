import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, FileText, CheckCircle2, BarChart2, Loader2 } from 'lucide-react';
import { TextEffect } from '@/components/motion-primitives/text-effect';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Task {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  completed: boolean;
}

interface ScheduleEvent {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
}

interface Stats {
  exams: number;
  homework: number;
  classes: number;
  study_time: string;
}

import { motion } from 'motion/react';

const StatCard = ({ icon: Icon, label, value, isLoading }: { icon: any, label: string, value: string | number, isLoading: boolean }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="border rounded-2xl p-6 shadow-sm bg-card flex items-center space-x-4 transition-colors cursor-pointer"
  >
    <div className="p-3 bg-primary/10 text-primary rounded-xl">
      <Icon className="w-6 h-6" aria-hidden="true" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
      {isLoading ? (
        <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1"></div>
      ) : (
        <p className="text-2xl font-bold truncate">{value}</p>
      )}
    </div>
  </motion.div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ exams: 0, homework: 0, classes: 0, study_time: '0h 0m' });
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studySessions, setStudySessions] = useState<{date: string, total_minutes: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const [examsRes, homeworkRes, plannerRes, analyticsRes] = await Promise.all([
          fetch('/api/exams', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/homework', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/planner', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/analytics', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const exams = examsRes.ok ? await examsRes.json() : [];
        const homework = homeworkRes.ok ? await homeworkRes.json() : [];
        const planner = plannerRes.ok ? await plannerRes.json() : [];
        const analytics = analyticsRes.ok ? await analyticsRes.json() : [];

        const activeHomework = homework.filter((h: Task) => !h.completed);

        const totalMinutes = analytics.reduce((acc: number, cur: any) => acc + parseInt(cur.total_minutes || '0'), 0);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        setStats({
          exams: exams.length,
          homework: activeHomework.length,
          classes: planner.length,
          study_time: `${hours}h ${mins}m`
        });

        setSchedule(planner.slice(0, 3)); // Top 3 schedule items
        setTasks(activeHomework.slice(0, 3)); // Top 3 tasks
        setStudySessions(analytics.reverse()); // Chronological for chart
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          <TextEffect as="span" preset="blur" per="char">Dashboard</TextEffect>
        </h1>
        <p className="text-muted-foreground mt-1">
          <TextEffect as="span" preset="fade" per="word" delay={0.3}>Welcome back. Here is your overview for today.</TextEffect>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" aria-live="polite">
        <StatCard isLoading={isLoading} icon={BookOpen} label="Classes" value={stats.classes} />
        <StatCard isLoading={isLoading} icon={FileText} label="Assignments" value={stats.homework} />
        <StatCard isLoading={isLoading} icon={Calendar} label="Exams" value={stats.exams} />
        <StatCard isLoading={isLoading} icon={Clock} label="Study Time (7d)" value={stats.study_time} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-3 border rounded-2xl p-4 md:p-6 shadow-sm bg-card">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-primary" aria-hidden="true" />
              <span>Study Analytics (Past 7 Days)</span>
            </h2>
          </div>
          <div className="h-64 w-full pt-4 relative" aria-live="polite">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10 rounded-xl">
                <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
                <span className="sr-only">Loading analytics...</span>
              </div>
            ) : null}
            {!isLoading && studySessions.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm border-b">
                No study data for the past 7 days. Start the timer to log your sessions!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={studySessions.map(s => ({
                    day: new Date(s.date).toLocaleDateString(undefined, { weekday: 'short' }),
                    fullDate: new Date(s.date).toLocaleDateString(),
                    minutes: parseInt(s.total_minutes as any) || 0
                  }))} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value} mins`, 'Study Time']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  />
                  <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorMinutes)" activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border rounded-2xl p-6 shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-6">Today’s Schedule</h2>
          <div className="space-y-4" aria-live="polite">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl"></div>)}
              </div>
            ) : schedule.length === 0 ? (
              <div className="text-muted-foreground text-sm p-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-muted/50 rounded-xl bg-muted/10">
                <Calendar className="w-8 h-8 mb-3 text-muted-foreground/50" aria-hidden="true" />
                <p>No classes scheduled for today.</p>
              </div>
            ) : (
              schedule.map(ev => (
                <div key={ev.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-4 border rounded-xl bg-background hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{ev.name}</p>
                    <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">{ev.start_time} - {ev.end_time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="border rounded-2xl p-6 shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-6">Pending Tasks</h2>
          <div className="space-y-4" aria-live="polite">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl"></div>)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-muted-foreground text-sm p-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-muted/50 rounded-xl bg-muted/10">
                <CheckCircle2 className="w-8 h-8 mb-3 text-muted-foreground/50" aria-hidden="true" />
                <p>No pending tasks.</p>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-4 border rounded-xl bg-background hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs font-medium text-primary/80 px-2.5 py-1 rounded-md bg-primary/10 truncate max-w-[120px]">{task.subject}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{task.due_date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
