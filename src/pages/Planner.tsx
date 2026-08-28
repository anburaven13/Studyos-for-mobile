import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, X, Trash, RefreshCw } from 'lucide-react';

export default function Planner() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newEventName, setNewEventName] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');

  const fetchEvents = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/planner/merged', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newEventName, start_time: newEventStart, end_time: newEventEnd })
      });
      if (res.ok) {
        setNewEventName('');
        setNewEventStart('');
        setNewEventEnd('');
        setIsModalOpen(false);
        fetchEvents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteEvent = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`/api/planner/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEvents(events.filter(ev => ev.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full relative">
      <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Study Planner</h1>
          <p className="text-muted-foreground mt-1">Focus blocks and daily timetable.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center space-x-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Pomodoro Timer */}
        <div className="lg:col-span-1">
          <div className="border rounded-2xl bg-card shadow-sm p-8 text-center flex flex-col items-center">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">Focus Session</h2>
            
            <div className="text-6xl font-bold tracking-tighter tabular-nums mb-8">
              {minutes}:{seconds}
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleTimer}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
              >
                {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
              <button 
                onClick={resetTimer}
                className="w-14 h-14 rounded-full border bg-background text-foreground flex items-center justify-center hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="mt-8 border rounded-2xl bg-card shadow-sm p-6">
             <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Attendance</h2>
             <div className="space-y-4">
               <div className="text-muted-foreground text-sm p-4 text-center border border-dashed rounded-xl">
                 No attendance data available.
               </div>
             </div>
          </div>
        </div>

        {/* Timetable */}
        <div className="lg:col-span-2">
          <div className="border rounded-2xl bg-card shadow-sm p-6 h-full">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">Today's Timetable</h2>
            
            <div className="relative">
            <div className="space-y-4 relative z-10">
                {events.length === 0 ? (
                  <div className="text-muted-foreground text-sm p-4 text-center border border-dashed rounded-xl">
                    Your timetable is empty.
                  </div>
                ) : (
                  events.map(ev => {
                    const isRoutine = ev.source === 'routine';
                    const typeColor = isRoutine ? (
                      ev.routine_type === 'school' ? 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' :
                      ev.routine_type === 'study' ? 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20' :
                      ev.routine_type === 'class' ? 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20' :
                      ev.routine_type === 'break' ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' :
                      ev.routine_type === 'sleep' ? 'border-l-slate-500 bg-slate-50/50 dark:bg-slate-950/20' :
                      'border-l-gray-300'
                    ) : 'border-l-primary';
                    const typeBadgeColor = isRoutine ? (
                      ev.routine_type === 'school' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                      ev.routine_type === 'study' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                      ev.routine_type === 'class' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                      ev.routine_type === 'break' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                      'bg-gray-100 text-gray-700'
                    ) : '';

                    return (
                      <div key={ev.id} className={`flex flex-col sm:flex-row items-start sm:items-center p-4 rounded-xl border border-l-4 ${typeColor} transition-colors group gap-2 sm:gap-0`}>
                        <div className="w-auto sm:w-24 shrink-0 text-sm font-medium text-muted-foreground">
                          {ev.start_time} - {ev.end_time}
                        </div>
                        <div className="hidden sm:block w-1 h-12 bg-primary/20 rounded-full mx-4"></div>
                        <div className="flex-1">
                          <p className="font-medium">{ev.name}</p>
                          {isRoutine && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${typeBadgeColor}`}>
                                {ev.routine_type}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                From Routine
                              </span>
                            </div>
                          )}
                        </div>
                        {!isRoutine && (
                          <button onClick={() => deleteEvent(ev.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-md border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <h2 className="text-xl font-semibold">Add Class / Event</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Class Name</label>
                <input 
                  type="text" 
                  required
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                  placeholder="e.g. Calculus"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input 
                    type="time" 
                    required
                    value={newEventStart}
                    onChange={e => setNewEventStart(e.target.value)}
                    className="w-full p-2 rounded-md border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input 
                    type="time" 
                    required
                    value={newEventEnd}
                    onChange={e => setNewEventEnd(e.target.value)}
                    className="w-full p-2 rounded-md border bg-background"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90">
                Save Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
