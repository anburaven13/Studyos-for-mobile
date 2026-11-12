import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, X, Trash, Calendar, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { PlannerSkeleton } from '../components/skeletons/PageSkeletons';

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Planner() {
  const todayStr = getLocalDateStr();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newEventName, setNewEventName] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [newEventDate, setNewEventDate] = useState(todayStr);
  const [isOneTime, setIsOneTime] = useState(true);

  const fetchEvents = async (date = selectedDate) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/planner/merged?date=${date}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        setEvents(data);
      }
    } catch (e) {
      console.error('Failed to fetch events:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    let interval: number | undefined;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
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

  const changeDate = (daysOffset: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + daysOffset);
    setSelectedDate(getLocalDateStr(dateObj));
  };

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const formatted = dateObj.toLocaleDateString(undefined, options);

    if (dateStr === todayStr) {
      return `Today (${formatted})`;
    }

    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    if (dateStr === getLocalDateStr(tom)) {
      return `Tomorrow (${formatted})`;
    }

    return formatted;
  };

  const handleOpenModal = () => {
    setNewEventDate(selectedDate);
    setIsOneTime(true);
    setIsModalOpen(true);
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
        body: JSON.stringify({ 
          name: newEventName, 
          start_time: newEventStart, 
          end_time: newEventEnd,
          date: isOneTime ? newEventDate : null,
          is_recurring: !isOneTime
        })
      });
      if (res.ok) {
        setNewEventName('');
        setNewEventStart('');
        setNewEventEnd('');
        setIsModalOpen(false);
        // If the newly created event is for the currently viewed date, or it's recurring, refresh
        if (newEventDate === selectedDate || !isOneTime) {
          fetchEvents(selectedDate);
        } else {
          // Switch view to the date of the event so student immediately sees their scheduled class
          setSelectedDate(newEventDate);
        }
      }
    } catch (e) {
      console.error('Failed to add planner event:', e);
    }
  };

  const deleteEvent = async (id: string | number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`/api/planner/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEvents(events.filter(ev => String(ev.id) !== String(id)));
    } catch (e) {
      console.error('Failed to delete event:', e);
    }
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  if (isLoading && events.length === 0) {
    return <PlannerSkeleton />;
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full relative">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Study Planner</h1>
          <p className="text-muted-foreground mt-1">Focus blocks, weekly routines, and one-time scheduled classes.</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium text-sm flex items-center space-x-2 shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Pomodoro Timer */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border rounded-2xl bg-card shadow-sm p-8 text-center flex flex-col items-center">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">Focus Session</h2>
            
            <div className="text-6xl font-bold tracking-tighter tabular-nums mb-8">
              {minutes}:{seconds}
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleTimer}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
                aria-label={isRunning ? "Pause timer" : "Start timer"}
              >
                {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
              <button 
                onClick={resetTimer}
                className="w-14 h-14 rounded-full border bg-background text-foreground flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                aria-label="Reset timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="border rounded-2xl bg-card shadow-sm p-6">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h2>
               <Sparkles className="w-4 h-4 text-primary" />
             </div>
             <p className="text-xs text-muted-foreground leading-relaxed">
               Need a tuition or special class only once? Choose <strong>One-time class</strong> when adding it. It will only show up on that date's schedule and won't repeat!
             </p>
          </div>
        </div>

        {/* Timetable */}
        <div className="lg:col-span-2">
          <div className="border rounded-2xl bg-card shadow-sm p-6 h-full flex flex-col">
            
            {/* Date Navigator Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Schedule For</span>
                <h2 className="text-lg font-bold text-foreground mt-0.5">{formatDisplayDate(selectedDate)}</h2>
              </div>
              
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/50 text-xs font-medium">
                <button 
                  onClick={() => changeDate(-1)}
                  title="Previous Day"
                  className="p-1.5 rounded-lg hover:bg-background hover:shadow-xs transition-all text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {selectedDate !== todayStr && (
                  <button 
                    onClick={() => setSelectedDate(todayStr)}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold cursor-pointer"
                  >
                    Today
                  </button>
                )}
                <div className="flex items-center gap-1 px-1.5 py-0.5 text-foreground">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={e => e.target.value && setSelectedDate(e.target.value)}
                    className="bg-transparent border-none text-xs font-medium focus:outline-none cursor-pointer"
                  />
                </div>
                <button 
                  onClick={() => changeDate(1)}
                  title="Next Day"
                  className="p-1.5 rounded-lg hover:bg-background hover:shadow-xs transition-all text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="relative flex-1">
              <div className="space-y-3 relative z-10">
                {events.length === 0 ? (
                  <div className="text-muted-foreground text-sm p-8 text-center border border-dashed rounded-xl flex flex-col items-center justify-center">
                    <Clock className="w-8 h-8 text-muted-foreground/40 mb-2" />
                    <p className="font-medium text-foreground">No classes scheduled for {formatDisplayDate(selectedDate)}.</p>
                    <p className="text-xs text-muted-foreground mt-1">Click "Add Class" above to add a one-off tuition or class.</p>
                  </div>
                ) : (
                  events.map(ev => {
                    const isRoutine = ev.source === 'routine';
                    const isDateSpecific = Boolean(ev.date);
                    
                    const typeColor = isRoutine ? (
                      ev.routine_type === 'school' ? 'border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20' :
                      ev.routine_type === 'study' ? 'border-l-purple-500 bg-purple-50/40 dark:bg-purple-950/20' :
                      ev.routine_type === 'class' ? 'border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20' :
                      ev.routine_type === 'break' ? 'border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' :
                      ev.routine_type === 'sleep' ? 'border-l-slate-500 bg-slate-50/40 dark:bg-slate-950/20' :
                      'border-l-gray-300'
                    ) : isDateSpecific ? (
                      'border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10'
                    ) : (
                      'border-l-primary bg-primary/5'
                    );

                    const typeBadgeColor = isRoutine ? (
                      ev.routine_type === 'school' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                      ev.routine_type === 'study' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                      ev.routine_type === 'class' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                      ev.routine_type === 'break' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                      'bg-gray-100 text-gray-700'
                    ) : '';

                    return (
                      <div key={ev.id} className={`flex flex-col sm:flex-row items-start sm:items-center p-4 rounded-xl border border-l-4 ${typeColor} transition-all group gap-2 sm:gap-0 hover:shadow-xs`}>
                        <div className="w-auto sm:w-28 shrink-0 text-sm font-semibold tabular-nums text-foreground/80">
                          {ev.start_time} - {ev.end_time}
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-border mx-4"></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{ev.name}</p>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            {isRoutine && (
                              <>
                                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${typeBadgeColor}`}>
                                  {ev.routine_type}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  From Routine
                                </span>
                              </>
                            )}
                            {isDateSpecific && (
                              <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                One-time • {ev.date === todayStr ? 'Today only' : ev.date}
                              </span>
                            )}
                            {!isRoutine && !isDateSpecific && ev.is_recurring && (
                              <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                                Repeats Weekly
                              </span>
                            )}
                            {!isRoutine && !isDateSpecific && !ev.is_recurring && (
                              <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                                Manual Class
                              </span>
                            )}
                          </div>
                        </div>
                        {!isRoutine && (
                          <button 
                            onClick={() => deleteEvent(ev.id)} 
                            title="Remove class"
                            className="text-muted-foreground hover:text-destructive opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 cursor-pointer"
                          >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-md border space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">Add Class / Event</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Schedule a one-off tuition or repeating class.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Class / Event Name
                </label>
                <input 
                  type="text" 
                  required
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="e.g. Physics Tuition, Math Extra Class"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Start Time
                  </label>
                  <input 
                    type="time" 
                    required
                    value={newEventStart}
                    onChange={e => setNewEventStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    End Time
                  </label>
                  <input 
                    type="time" 
                    required
                    value={newEventEnd}
                    onChange={e => setNewEventEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Event Type / Repeat Selector */}
              <div className="pt-2 border-t space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Schedule Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOneTime(true)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                      isOneTime 
                        ? 'border-primary bg-primary/10 text-primary shadow-xs' 
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span>One-time Class</span>
                    <span className="text-[10px] font-normal opacity-80">This date only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOneTime(false)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                      !isOneTime 
                        ? 'border-primary bg-primary/10 text-primary shadow-xs' 
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span>Weekly Recurring</span>
                    <span className="text-[10px] font-normal opacity-80">Repeats every week</span>
                  </button>
                </div>
              </div>

              {isOneTime && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Class Date
                  </label>
                  <input 
                    type="date"
                    required
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This class will appear on this specific date's timetable and never repeat again.
                  </p>
                </div>
              )}

              <div className="pt-3">
                <button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
