import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, CheckSquare, BrainCircuit, Settings, ListTodo, GraduationCap, FileText, ClipboardList, X, Dna } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: BookOpen, label: 'Notes', to: '/notes' },
  { icon: Dna, label: 'Knowledge DNA', to: '/genome' },
  { icon: CheckSquare, label: 'Homework', to: '/homework' },
  { icon: Calendar, label: 'Planner', to: '/planner' },
  { icon: ListTodo, label: 'Routines', to: '/routines' },
  { icon: GraduationCap, label: 'AI Tutor', to: '/tutor' },
  { icon: FileText, label: 'Workspace', to: '/workspace' },
  { icon: ClipboardList, label: 'Exam Hub', to: '/exams' },
];

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
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
        "w-64 glass-panel h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out",
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
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t relative">
        {showSettings && (
          <div className="absolute bottom-full left-4 mb-2 w-56 bg-card border shadow-lg rounded-xl overflow-hidden">
            <div className="p-3 border-b bg-muted/30">
              <p className="text-sm font-medium">My Account</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button 
              onClick={() => {
                setShowSettings(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center justify-between px-3 py-2 w-full rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
          {user?.class_level && (
            <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {user.class_level}
            </span>
          )}
        </button>
      </div>
      </div>
    </>
  );
}
