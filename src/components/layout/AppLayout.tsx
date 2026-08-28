import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import StudyTimer from './StudyTimer';
import { useHotkeys } from 'react-hotkeys-hook';
import { Menu } from 'lucide-react';

export default function AppLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useHotkeys('ctrl+n, meta+n', (e) => {
    e.preventDefault();
    navigate('/app/notes');
  });

  useHotkeys('ctrl+k, meta+k', (e) => {
    e.preventDefault();
    navigate('/app/tutor');
  });

  return (
    <div className="min-h-screen bg-transparent text-foreground flex flex-col md:flex-row relative">
      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/10 mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-pulse" style={{ animationDuration: '14s', animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-purple-500/10 mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-pulse" style={{ animationDuration: '18s', animationDelay: '4s' }} />
      </div>

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden h-16 border-b border-border/50 flex items-center px-4 justify-between bg-white/70 dark:bg-black/70 backdrop-blur-xl backdrop-saturate-150 z-30 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
          <span className="font-bold tracking-tight flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">S</div>
            <span>StudyOS</span>
          </span>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -mr-2">
            <Menu className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>
        
        <Outlet />
      </main>
      <StudyTimer />
    </div>
  );
}
