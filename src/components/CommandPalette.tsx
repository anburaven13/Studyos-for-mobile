import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  LayoutDashboard, 
  BookOpen, 
  Bot, 
  Target, 
  Calendar, 
  CheckSquare, 
  FolderGit2, 
  MessageSquare, 
  Dna, 
  Settings, 
  PlusCircle, 
  Sparkles, 
  SunMoon, 
  LineChart,
  ArrowRight
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface CommandPaletteProps {
  onOpenMathGrapher?: () => void;
}

export default function CommandPalette({ onOpenMathGrapher }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Global Ctrl+K / Cmd+K listener & custom event
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    document.addEventListener('keydown', down);
    window.addEventListener('studyos:open-command-palette', handleCustomOpen);

    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('studyos:open-command-palette', handleCustomOpen);
    };
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    setSearch('');
    command();
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setOpen(false)}
    >
      <div 
        className="w-full max-w-xl bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="StudyOS Command Menu" className="w-full flex flex-col">
          {/* Input Header */}
          <div className="flex items-center px-4 border-b border-border bg-muted/20">
            <Search className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command, page, or question..."
              className="w-full py-4 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
              autoFocus
            />
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-[360px] overflow-y-auto p-2 scroll-py-2 outline-none">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {search.trim() ? (
                <div className="space-y-2">
                  <p>No matching commands found.</p>
                  <button
                    onClick={() => runCommand(() => navigate(`/app/tutor?prompt=${encodeURIComponent(search)}`))}
                    className="inline-flex items-center space-x-1.5 text-xs text-primary font-medium hover:underline"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask AI Tutor about "{search}"</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                'Type to search StudyOS...'
              )}
            </Command.Empty>

            {/* AI Prompt Direct Action */}
            {search.trim().length > 1 && (
              <Command.Group heading="AI Tutor">
                <Command.Item
                  onSelect={() => runCommand(() => navigate(`/app/tutor?prompt=${encodeURIComponent(search)}`))}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm cursor-pointer select-none text-primary hover:bg-primary/10 transition-colors"
                >
                  <Sparkles className="w-4 h-4 mr-3 text-primary" />
                  <span className="flex-1 font-medium">Ask AI Tutor: "{search}"</span>
                  <kbd className="text-[10px] bg-primary/20 px-1.5 py-0.5 rounded text-primary font-mono">Enter</kbd>
                </Command.Item>
              </Command.Group>
            )}

            {/* Interactive Tools */}
            <Command.Group heading="STEM & Interactive Tools" className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => onOpenMathGrapher?.())}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <LineChart className="w-4 h-4 mr-3 text-indigo-400" />
                <span className="flex-1 font-medium">Interactive Math & Function Grapher</span>
                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">Mafs</span>
              </Command.Item>
            </Command.Group>

            {/* Quick Actions */}
            <Command.Group heading="Quick Actions" className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1.5 mt-2">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/exams'))}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <PlusCircle className="w-4 h-4 mr-3 text-amber-400" />
                <span className="flex-1">Add Exam / Countdown</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/notes'))}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <BookOpen className="w-4 h-4 mr-3 text-emerald-400" />
                <span className="flex-1">Create Note / Flashcards</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <SunMoon className="w-4 h-4 mr-3 text-purple-400" />
                <span className="flex-1">Toggle Dark / Light Theme</span>
                <span className="text-[11px] text-muted-foreground font-mono">{theme === 'dark' ? 'Dark' : 'Light'}</span>
              </Command.Item>
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigation" className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1.5 mt-2">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app'))}
                className="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <LayoutDashboard className="w-4 h-4 mr-3 text-muted-foreground" />
                <span>Dashboard Overview</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/tutor'))}
                className="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <Bot className="w-4 h-4 mr-3 text-muted-foreground" />
                <span>AI Tutor Chat</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/notes'))}
                className="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <BookOpen className="w-4 h-4 mr-3 text-muted-foreground" />
                <span>Notes & Study Docs</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/exams'))}
                className="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <Target className="w-4 h-4 mr-3 text-muted-foreground" />
                <span>Exam Hub & Confidence</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/planner'))}
                className="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <Calendar className="w-4 h-4 mr-3 text-muted-foreground" />
                <span>Planner & Timetable</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/routines'))}
                className="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <CheckSquare className="w-4 h-4 mr-3 text-muted-foreground" />
                <span>Daily Routines</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/workspace'))}
                className="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <FolderGit2 className="w-4 h-4 mr-3 text-muted-foreground" />
                <span>Workspace & PDF Q&A</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/messages'))}
                className="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <MessageSquare className="w-4 h-4 mr-3 text-muted-foreground" />
                <span>Peer Messages</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/genome'))}
                className="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <Dna className="w-4 h-4 mr-3 text-muted-foreground" />
                <span>Knowledge Genome</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/settings'))}
                className="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer select-none hover:bg-muted/50 transition-colors text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer Bar */}
          <div className="px-4 py-2.5 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center space-x-1.5">
              <span>Navigation:</span>
              <kbd className="px-1 bg-muted border border-border rounded text-[10px]">↑</kbd>
              <kbd className="px-1 bg-muted border border-border rounded text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span>StudyOS Spotlight</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

/**
 * Programmatic helper to open command palette from any button
 */
export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent('studyos:open-command-palette'));
}
