import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import StudyTimer from './StudyTimer';
import { useHotkeys } from 'react-hotkeys-hook';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
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
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative selection:bg-primary/30">
      {/* Productivity Workspace Background - Faint Dot Grid */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-[0.03] blur-[100px]"></div>
      </div>

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col relative">
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
        
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-1 flex flex-col w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <StudyTimer />
    </div>
  );
}
