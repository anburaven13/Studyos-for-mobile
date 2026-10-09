import React, { useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, CheckSquare, ListTodo, GraduationCap, FileText, ClipboardList, Dna, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

const mobileNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/app', end: true },
  { icon: BookOpen, label: 'Notes', to: '/app/notes' },
  { icon: Dna, label: 'DNA', to: '/app/genome' },
  { icon: CheckSquare, label: 'Homework', to: '/app/homework' },
  { icon: Calendar, label: 'Planner', to: '/app/planner' },
  { icon: ListTodo, label: 'Routines', to: '/app/routines' },
  { icon: GraduationCap, label: 'Tutor', to: '/app/tutor' },
  { icon: FileText, label: 'Workspace', to: '/app/workspace' },
  { icon: ClipboardList, label: 'Exams', to: '/app/exams' },
  { icon: MessageCircle, label: 'Messages', to: '/app/messages' }
];

export default function BottomNav() {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active item into view
  useEffect(() => {
    const activeIndex = mobileNavItems.findIndex(item => 
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
    );
    if (activeIndex >= 0 && scrollRef.current) {
      const activeEl = scrollRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        const scrollLeft = activeEl.offsetLeft - (scrollRef.current.offsetWidth / 2) + (activeEl.offsetWidth / 2);
        scrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [location.pathname]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-black/90 backdrop-blur-3xl border-t border-white/10 z-40 pb-safe">
      <div 
        ref={scrollRef}
        className="flex items-center h-full overflow-x-auto overflow-y-hidden px-4 no-scrollbar space-x-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {mobileNavItems.map((item) => {
          const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className="relative flex flex-col items-center justify-center w-[64px] min-w-[64px] h-[64px] transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="liquid-drop"
                  className="absolute -top-3 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div className="w-8 h-8 bg-primary rounded-full blur-[2px]" />
                </motion.div>
              )}
              
              <motion.div 
                animate={{ 
                  y: isActive ? -12 : 0,
                  color: isActive ? '#ffffff' : '#888888'
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="relative z-10 flex flex-col items-center"
              >
                <item.icon className="w-6 h-6 mb-1" />
              </motion.div>
              
              <motion.span 
                animate={{ 
                  opacity: isActive ? 1 : 0.6,
                  y: isActive ? 8 : 0,
                  scale: isActive ? 1 : 0.9
                }}
                className="absolute bottom-1 text-[10px] font-medium whitespace-nowrap"
                style={{ color: isActive ? '#ffffff' : '#888888' }}
              >
                {item.label}
              </motion.span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
