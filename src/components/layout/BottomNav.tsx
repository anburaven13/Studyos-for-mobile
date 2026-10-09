import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, GraduationCap, ClipboardList, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

const mobileNavItems = [
  { icon: LayoutDashboard, label: 'Home', to: '/app', end: true },
  { icon: Calendar, label: 'Planner', to: '/app/planner' },
  { icon: GraduationCap, label: 'Tutor', to: '/app/tutor' },
  { icon: ClipboardList, label: 'Exams', to: '/app/exams' }
];

type BottomNavProps = {
  onMoreClick: () => void;
};

export default function BottomNav({ onMoreClick }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-3xl border-t border-white/10 z-40 flex items-center justify-around px-2 pb-safe">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
      <button 
        onClick={onMoreClick}
        className="flex flex-col items-center justify-center w-16 h-full space-y-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] font-medium">More</span>
      </button>
    </div>
  );
}
