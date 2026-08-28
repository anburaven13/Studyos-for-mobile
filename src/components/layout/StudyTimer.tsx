import React, { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function StudyTimer() {
  const [isRunning, setIsRunning] = useState(() => {
    return localStorage.getItem('study_timer_running') === 'true';
  });
  const [seconds, setSeconds] = useState(() => {
    const savedStartTime = localStorage.getItem('study_timer_start_time');
    if (savedStartTime && localStorage.getItem('study_timer_running') === 'true') {
      return Math.floor((Date.now() - parseInt(savedStartTime, 10)) / 1000);
    }
    return 0;
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(() => {
          const savedStartTime = localStorage.getItem('study_timer_start_time');
          if (savedStartTime) {
            return Math.floor((Date.now() - parseInt(savedStartTime, 10)) / 1000);
          }
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleTimer = async () => {
    if (isRunning) {
      // Stop and save
      setIsRunning(false);
      localStorage.removeItem('study_timer_running');
      localStorage.removeItem('study_timer_start_time');
      const minutes = Math.floor(seconds / 60);
      
      // Reset immediately
      setSeconds(0);
      
      if (minutes > 0) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const today = new Date().toISOString().split('T')[0];
            await fetch('/api/study_sessions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ duration_minutes: minutes, date: today })
            });
            // We could show a toast here in the future
          } catch (e) {
            console.error('Failed to save study session', e);
          }
        }
      }
    } else {
      // Start
      setIsRunning(true);
      localStorage.setItem('study_timer_running', 'true');
      localStorage.setItem('study_timer_start_time', Date.now().toString());
    }
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-card border shadow-xl rounded-full px-4 py-2 transition-all duration-300",
      isRunning ? "border-primary/50 shadow-primary/20" : ""
    )}>
      <div className={cn(
        "font-mono font-medium text-lg w-16 text-center tabular-nums transition-colors",
        isRunning ? "text-primary" : "text-muted-foreground"
      )}>
        {formatTime(seconds)}
      </div>
      <div className="w-px h-6 bg-border mx-1" />
      <button 
        onClick={toggleTimer}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
          isRunning ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-1" />}
      </button>
    </div>
  );
}
