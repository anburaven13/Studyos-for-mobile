import React, { useState, useEffect } from 'react';
import { Play, Square, Timer, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { apiUrl } from '../../lib/api';

export default function StudyTimer() {
  const location = useLocation();
  const isMessages = location.pathname.startsWith('/app/messages');
  
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

  // Automatically minimize on mobile devices or inside messages to avoid blocking chats/inputs
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // When navigating into messages, keep minimized so chat inputs are not blocked
  useEffect(() => {
    if (isMessages && window.innerWidth < 768) {
      setIsMinimized(true);
    }
  }, [isMessages]);

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
            await fetch(apiUrl('/api/study_sessions'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ duration_minutes: minutes, date: today })
            });
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

  const formatCompactTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h`;
  };

  // Minimized Floating Pill on Mobile
  if (isMinimized) {
    return (
      <div className="fixed bottom-[80px] right-3 md:bottom-6 md:right-6 z-40 transition-all duration-300">
        <button
          onClick={() => setIsMinimized(false)}
          className={cn(
            "flex items-center space-x-1.5 px-3 py-2 rounded-full bg-card/95 border shadow-xl backdrop-blur-xl text-xs font-mono transition-all hover:scale-105 active:scale-95",
            isRunning ? "border-primary text-primary shadow-primary/20" : "border-border/80 text-muted-foreground"
          )}
          title="Open Study Timer"
        >
          <Timer className={cn("w-4 h-4", isRunning && "animate-spin text-primary")} style={{ animationDuration: '4s' }} />
          <span>{isRunning ? formatCompactTime(seconds) : 'Timer'}</span>
          {isRunning && (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </button>
      </div>
    );
  }

  // Expanded View
  return (
    <div className={cn(
      "fixed bottom-[80px] right-3 md:bottom-6 md:right-6 z-40 flex items-center space-x-2.5 bg-card/95 border shadow-2xl rounded-full px-3.5 py-2 backdrop-blur-xl transition-all duration-300",
      isRunning ? "border-primary/50 shadow-primary/20" : "border-border/80"
    )}>
      <div className={cn(
        "font-mono font-medium text-base md:text-lg w-14 md:w-16 text-center tabular-nums transition-colors",
        isRunning ? "text-primary" : "text-muted-foreground"
      )}>
        {formatTime(seconds)}
      </div>

      <div className="w-px h-5 bg-border/80 mx-0.5" />

      <button 
        onClick={toggleTimer}
        className={cn(
          "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95",
          isRunning ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        title={isRunning ? "Stop and save study session" : "Start timer"}
      >
        {isRunning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
      </button>

      {/* Collapse button on mobile/desktop */}
      <button
        onClick={() => setIsMinimized(true)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        title="Minimize timer"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}
