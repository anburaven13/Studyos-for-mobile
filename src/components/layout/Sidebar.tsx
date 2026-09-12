import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, CheckSquare, BrainCircuit, Settings, ListTodo, GraduationCap, FileText, ClipboardList, X, Dna, HelpCircle, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/app' },
  { icon: BookOpen, label: 'Notes', to: '/app/notes' },
  { icon: Dna, label: 'Knowledge DNA', to: '/app/genome' },
  { icon: CheckSquare, label: 'Homework', to: '/app/homework' },
  { icon: Calendar, label: 'Planner', to: '/app/planner' },
  { icon: ListTodo, label: 'Routines', to: '/app/routines' },
  { icon: GraduationCap, label: 'AI Tutor', to: '/app/tutor' },
  { icon: FileText, label: 'Workspace', to: '/app/workspace' },
  { icon: ClipboardList, label: 'Exam Hub', to: '/app/exams' },
];

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user } = useAuth();
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" 
          onClick={onClose}
        />
      )}
      <div className={cn(
        "w-64 border-r border-border/50 bg-background/80 backdrop-blur-2xl backdrop-saturate-150 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-16 flex items-center px-6 border-b relative">
          <span className="font-bold text-lg tracking-tight flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">S</div>
            <span>StudyOS</span>
          </span>
          {isOpen && onClose && (
            <button onClick={onClose} className="absolute right-4 md:hidden text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          )}
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app'}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))]" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )
            }
          >
            <item.icon className={cn("w-4 h-4", "transition-colors duration-200")} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-3">Help & Support</p>
        <NavLink
          to="/faq"
          className={({ isActive }) =>
            cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-primary/10 text-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))]" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )
          }
        >
          <MessageCircle className="w-4 h-4" />
          <span>FAQ</span>
        </NavLink>
        <NavLink
          to="/support"
          className={({ isActive }) =>
            cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-primary/10 text-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))]" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )
          }
        >
          <HelpCircle className="w-4 h-4" />
          <span>Support</span>
        </NavLink>
      </div>

      <div className="p-4 border-t relative">
        <NavLink 
          to="/app/settings"
          className={({ isActive }) => cn(
            "flex items-center justify-between px-3 py-2 w-full rounded-md text-sm font-medium transition-colors",
            isActive 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <div className="flex items-center space-x-3">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
          {user?.class_level && (
            <span className={cn(
              "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full",
              // We need to check if isActive somehow, but NavLink's children can take a function
            )}>
              {user.class_level}
            </span>
          )}
        </NavLink>
      </div>
      </div>
    </>
  );
}
