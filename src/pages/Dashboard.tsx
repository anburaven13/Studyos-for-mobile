import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, FileText, CheckCircle2, BarChart2, Loader2 } from 'lucide-react';
import { TextEffect } from '@/components/motion-primitives/text-effect';

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
          <div className="h-48 flex items-end justify-between space-x-2 px-2 pt-4 border-b relative" aria-live="polite">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
                <span className="sr-only">Loading analytics…</span>
              </div>
            ) : null}
            {!isLoading && studySessions.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No study data for the past 7 days. Start the timer to log your sessions!
              </div>
            ) : (
              studySessions.map((session, i) => {
                const maxMins = Math.max(...studySessions.map(s => parseInt(s.total_minutes as any) || 0));
                const heightPercent = maxMins > 0 ? ((parseInt(session.total_minutes as any) || 0) / maxMins) * 100 : 0;
                
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div 
                      className="w-full bg-primary/20 hover:bg-primary/40 focus-visible:bg-primary/40 focus-visible:ring-2 focus-visible:ring-primary rounded-t-sm relative transition-[background-color,shadow] duration-300 group-hover:shadow-md outline-none cursor-default" 
                      style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                      tabIndex={0}
                      aria-label={`${session.total_minutes} minutes studied on ${new Date(session.date).toLocaleDateString()}`}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap z-10 pointer-events-none">
                        {session.total_minutes}&nbsp;mins
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-2 truncate w-full text-center">
                      {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                  </div>
                );
              })
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
