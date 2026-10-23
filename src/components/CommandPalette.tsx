import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ArrowRight,
  X,
  Compass
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '../lib/utils';

interface CommandPaletteProps {
  onOpenMathGrapher?: () => void;
}

interface DialItem {
  id: string;
  num: string;
  label: string;
  fullTitle: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glowColor: string;
  angle: number; // degrees
  action: () => void;
  keywords: string[];
}

export default function CommandPalette({ onOpenMathGrapher }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hoveredTile, setHoveredTile] = useState<DialItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Detect mobile screen for radial scaling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 8 Radial Dial Items
  const dialItems: DialItem[] = useMemo(() => [
    {
      id: 'tutor',
      num: '1',
      label: 'AI Tutor',
      fullTitle: 'AI Tutor 24/7 Chat',
      desc: 'Ask homework, syllabus, and study questions',
      icon: Bot,
      color: 'text-indigo-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(129,140,248,0.4)]',
      angle: -90, // Top / 12 o'clock
      action: () => navigate('/app/tutor'),
      keywords: ['tutor', 'ai', 'chat', 'ask', 'question', 'help', 'doubt']
    },
    {
      id: 'math',
      num: '2',
      label: 'Math Grapher',
      fullTitle: 'Interactive Math & Function Grapher',
      desc: 'Plot 2D mathematical curves with dynamic parameter sliders',
      icon: LineChart,
      color: 'text-violet-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(167,139,250,0.4)]',
      angle: -45, // Top-Right / 1:30
      action: () => {
        if (onOpenMathGrapher) {
          onOpenMathGrapher();
        } else {
          window.dispatchEvent(new CustomEvent('studyos:open-math-grapher'));
        }
      },
      keywords: ['math', 'grapher', 'graph', 'plot', 'formula', 'curve', 'sine', 'stem', 'mafs']
    },
    {
      id: 'notes',
      num: '3',
      label: 'Notes & FSRS',
      fullTitle: 'Notes & Spaced Repetition',
      desc: 'Study notes and smart FSRS flashcard reviews',
      icon: BookOpen,
      color: 'text-emerald-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(52,211,153,0.4)]',
      angle: 0, // Right / 3 o'clock
      action: () => navigate('/app/notes'),
      keywords: ['notes', 'flashcards', 'fsrs', 'review', 'deck', 'cards', 'spaced']
    },
    {
      id: 'routines',
      num: '4',
      label: 'Routines',
      fullTitle: 'Daily Routines & Habits',
      desc: 'Track consistent daily study streaks and routines',
      icon: CheckSquare,
      color: 'text-teal-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(45,212,191,0.4)]',
      angle: 45, // Bottom-Right / 4:30
      action: () => navigate('/app/routines'),
      keywords: ['routines', 'habits', 'streak', 'daily', 'checklist', 'routine']
    },
    {
      id: 'exams',
      num: '5',
      label: 'Exam Hub',
      fullTitle: 'Exams & Timetables',
      desc: 'Exam dates, countdowns, and Last-Minute Mode',
      icon: Target,
      color: 'text-amber-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(251,191,36,0.4)]',
      angle: 90, // Bottom / 6 o'clock
      action: () => navigate('/app/exams'),
      keywords: ['exam', 'exams', 'hub', 'countdown', 'test', 'last-minute', 'schedule']
    },
    {
      id: 'planner',
      num: '6',
      label: 'Planner',
      fullTitle: 'Weekly Study Planner',
      desc: 'Schedule study blocks and track homework assignments',
      icon: Calendar,
      color: 'text-sky-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(56,189,248,0.4)]',
      angle: 135, // Bottom-Left / 7:30
      action: () => navigate('/app/planner'),
      keywords: ['planner', 'calendar', 'homework', 'timetable', 'week', 'schedule']
    },
    {
      id: 'workspace',
      num: '7',
      label: 'Workspace',
      fullTitle: 'PDF Workspace Q&A',
      desc: 'Extract knowledge and chat with uploaded textbooks and PDFs',
      icon: FolderGit2,
      color: 'text-cyan-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]',
      angle: 180, // Left / 9 o'clock
      action: () => navigate('/app/workspace'),
      keywords: ['workspace', 'pdf', 'document', 'upload', 'textbook', 'syllabus']
    },
    {
      id: 'genome',
      num: '8',
      label: 'Genome',
      fullTitle: 'Knowledge Genome & Analytics',
      desc: 'Visualize cognitive mastery, retention scores, and learning stats',
      icon: Dna,
      color: 'text-rose-400',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(251,113,133,0.4)]',
      angle: 225, // Top-Left / 10:30
      action: () => navigate('/app/genome'),
      keywords: ['genome', 'dna', 'stats', 'analytics', 'mastery', 'knowledge', 'progress']
    }
  ], [navigate, onOpenMathGrapher]);

  // Additional searchable actions
  const extraActions = useMemo(() => [
    {
      id: 'theme',
      label: 'Toggle Dark / Light Theme',
      desc: `Switch theme mode (currently ${theme})`,
      icon: SunMoon,
      color: 'text-purple-400',
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      keywords: ['theme', 'dark', 'light', 'mode', 'color']
    },
    {
      id: 'settings',
      label: 'Settings',
      desc: 'Manage account, username, and security profile',
      icon: Settings,
      color: 'text-neutral-400',
      action: () => navigate('/app/settings'),
      keywords: ['settings', 'account', 'profile', 'username', 'security', 'password']
    },
    {
      id: 'messages',
      label: 'Messages',
      desc: 'Peer messaging and academic file attachments',
      icon: MessageSquare,
      color: 'text-blue-400',
      action: () => navigate('/app/messages'),
      keywords: ['messages', 'chat', 'friends', 'dm', 'peer', 'social']
    },
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      desc: 'Main StudyOS productivity home',
      icon: LayoutDashboard,
      color: 'text-emerald-400',
      action: () => navigate('/app'),
      keywords: ['dashboard', 'home', 'overview', 'main']
    },
    {
      id: 'add-exam',
      label: 'Add Exam / Countdown',
      desc: 'Quickly create a new exam countdown',
      icon: PlusCircle,
      color: 'text-amber-400',
      action: () => navigate('/app/exams'),
      keywords: ['add', 'new', 'exam', 'create']
    }
  ], [navigate, setTheme, theme]);

  // Filtered results when typing in search
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];

    const matches: Array<{
      id: string;
      title: string;
      desc: string;
      icon: React.ComponentType<{ className?: string }>;
      color: string;
      action: () => void;
    }> = [];

    // Search dial items
    dialItems.forEach((item) => {
      if (
        item.fullTitle.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
      ) {
        matches.push({
          id: item.id,
          title: item.fullTitle,
          desc: item.desc,
          icon: item.icon,
          color: item.color,
          action: item.action
        });
      }
    });

    // Search extra actions
    extraActions.forEach((item) => {
      if (
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
      ) {
        matches.push({
          id: item.id,
          title: item.label,
          desc: item.desc,
          icon: item.icon,
          color: item.color,
          action: item.action
        });
      }
    });

    return matches;
  }, [search, dialItems, extraActions]);

  const executeAction = (action: () => void) => {
    setOpen(false);
    setSearch('');
    setHoveredTile(null);
    action();
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // 1. Close on ESC key
      if (e.key === 'Escape' || e.code === 'Escape') {
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          setSearch('');
          setHoveredTile(null);
          return;
        }
      }

      // 2. Toggle on Ctrl+K, Cmd+K, Ctrl+P, Cmd+P
      const isK = e.key === 'k' || e.key === 'K' || e.code === 'KeyK';
      const isP = e.key === 'p' || e.key === 'P' || e.code === 'KeyP';
      const isModifier = e.metaKey || e.ctrlKey;

      if (isModifier && (isK || isP)) {
        e.preventDefault();
        e.stopPropagation();
        setOpen((prev) => {
          if (!prev) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
          return !prev;
        });
        return;
      }

      // 3. Number hotkeys 1-8 when open and search input is not typing text
      if (open && !search.trim()) {
        const digit = parseInt(e.key, 10);
        if (digit >= 1 && digit <= dialItems.length) {
          e.preventDefault();
          const targetItem = dialItems[digit - 1];
          if (targetItem) {
            executeAction(targetItem.action);
          }
        }
      }
    };

    const handleCustomOpen = () => {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    const handleCustomClose = () => {
      setOpen(false);
      setSearch('');
      setHoveredTile(null);
    };

    window.addEventListener('keydown', down, { capture: true });
    window.addEventListener('studyos:open-command-palette', handleCustomOpen);
    window.addEventListener('studyos:close-command-palette', handleCustomClose);

    return () => {
      window.removeEventListener('keydown', down, { capture: true });
      window.removeEventListener('studyos:open-command-palette', handleCustomOpen);
      window.removeEventListener('studyos:close-command-palette', handleCustomClose);
    };
  }, [open, search, dialItems]);

  if (!open) return null;

  // Geometry calculations for radial layout
  // Desktop radius 175px, Mobile radius 125px
  const radius = isMobile ? 125 : 175;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-3xl animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={() => setOpen(false)}
    >
      {/* Dynamic Ambient Blur Glow behind the Dial */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/20 via-purple-600/20 to-sky-500/20 blur-[100px] rounded-full animate-pulse opacity-80" />
      </div>

      {/* Main Container */}
      <div 
        className="relative z-10 flex flex-col items-center w-full max-w-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Frosted Glass Search Bar */}
        <div className="w-full max-w-md mx-auto mb-6 flex items-center px-4 py-2.5 rounded-full border border-white/20 dark:border-white/10 bg-white/15 dark:bg-black/50 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, page, or question..."
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/60 text-foreground"
            autoFocus
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="p-1 text-muted-foreground hover:text-foreground text-xs"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setOpen(false)}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm active:scale-95"
              title="Close (Esc)"
              aria-label="Close command palette"
            >
              <span>ESC</span>
              <X className="w-3 h-3 opacity-70" />
            </button>
          )}
        </div>

        {/* VIEW 1: SEARCH RESULTS (When query is active) */}
        {search.trim().length > 0 ? (
          <div className="w-full max-w-lg bg-white/10 dark:bg-black/60 border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-3xl p-2 max-h-[380px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {filteredItems.length > 0 ? (
              <div className="space-y-1">
                {filteredItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => executeAction(item.action)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "w-full flex items-center px-4 py-3 rounded-xl text-left transition-all cursor-pointer",
                        isSelected 
                          ? "bg-white/20 dark:bg-white/10 border border-white/25 shadow-md scale-[1.01]" 
                          : "hover:bg-white/10 border border-transparent text-muted-foreground"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg bg-black/20 mr-3.5", item.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground ml-2 opacity-50" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center px-4">
                <p className="text-sm text-muted-foreground mb-3">No direct matching commands found.</p>
                <button
                  onClick={() => executeAction(() => navigate(`/app/tutor?prompt=${encodeURIComponent(search)}`))}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-medium transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask AI Tutor: "{search}"</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: RADIAL COMMAND WHEEL HUD (When search is empty) */
          <div className="relative flex items-center justify-center w-[340px] h-[340px] sm:w-[460px] sm:h-[460px]">
            {/* Ambient Concentric Dial Guide Rings */}
            <div className="absolute inset-0 m-auto w-[290px] h-[290px] sm:w-[410px] sm:h-[410px] rounded-full border border-white/10 dark:border-white/5 pointer-events-none" />
            <div className="absolute inset-0 m-auto w-[180px] h-[180px] sm:w-[250px] sm:h-[250px] rounded-full border border-white/10 dark:border-white/5 border-dashed pointer-events-none animate-spin-slow" />

            {/* Glowing Crosshair Reticle (Cross in between) */}
            <div className="absolute w-[1px] h-[310px] sm:h-[420px] bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none" />
            <div className="absolute h-[1px] w-[310px] sm:w-[420px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Central Circular Cross Hub (Click to Close / Hover Inspector) */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute z-20 w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-white/30 dark:border-white/20 bg-white/15 dark:bg-black/60 backdrop-blur-2xl shadow-[0_0_35px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center cursor-pointer group hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 active:scale-95"
              title="Click or press ESC to close"
              aria-label="Exit Command Dial"
            >
              {hoveredTile ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in-75 duration-150 px-1">
                  <hoveredTile.icon className={cn("w-6 h-6 sm:w-7 sm:h-7 mb-0.5", hoveredTile.color)} />
                  <span className="text-[10px] font-mono font-bold tracking-tight text-foreground truncate max-w-[70px]">
                    [{hoveredTile.num}] RUN
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center group-hover:scale-110 transition-transform duration-200">
                  <X className="w-6 h-6 text-foreground group-hover:text-red-400 group-hover:rotate-90 transition-all duration-300" />
                  <span className="text-[9px] font-mono tracking-widest text-muted-foreground group-hover:text-red-400 uppercase mt-0.5 font-semibold">
                    ESC
                  </span>
                </div>
              )}
            </button>

            {/* 8 Radial Frosted Glass Tiles */}
            {dialItems.map((tile) => {
              const angleRad = (tile.angle * Math.PI) / 180;
              const x = Math.round(Math.cos(angleRad) * radius);
              const y = Math.round(Math.sin(angleRad) * radius);
              const Icon = tile.icon;
              const isHovered = hoveredTile?.id === tile.id;

              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => executeAction(tile.action)}
                  onMouseEnter={() => setHoveredTile(tile)}
                  onMouseLeave={() => setHoveredTile(null)}
                  style={{
                    transform: `translate(${x}px, ${y}px)`
                  }}
                  className={cn(
                    "absolute z-10 flex flex-col items-center justify-center",
                    "w-16 h-16 sm:w-24 sm:h-24 p-1.5 sm:p-2 rounded-2xl",
                    "border border-white/20 dark:border-white/10",
                    "bg-white/10 dark:bg-white/5 backdrop-blur-xl",
                    "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
                    "hover:bg-white/20 dark:hover:bg-white/15 hover:border-white/40",
                    "transition-all duration-200 cursor-pointer group",
                    tile.glowColor,
                    isHovered ? "scale-110 border-primary/60 bg-white/25 dark:bg-white/20 z-30 shadow-2xl" : "hover:scale-105"
                  )}
                  title={`${tile.fullTitle} (Press ${tile.num})`}
                >
                  {/* Number hotkey pill */}
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 rounded-full bg-black/40 text-[9px] font-mono text-muted-foreground flex items-center justify-center border border-white/10 group-hover:text-foreground group-hover:border-white/30">
                    {tile.num}
                  </span>

                  {/* Icon */}
                  <Icon className={cn("w-5 h-5 sm:w-7 sm:h-7 transition-transform group-hover:scale-110", tile.color)} />

                  {/* Tile Label */}
                  <span className="text-[9px] sm:text-[11px] font-medium text-foreground text-center mt-1 truncate max-w-full px-0.5 leading-tight">
                    {tile.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Inspector Subtext (Shows details of hovered tile or instructions) */}
        <div className="mt-4 text-center min-h-[32px] px-4 py-1.5 rounded-full border border-white/10 bg-white/5 dark:bg-black/30 backdrop-blur-xl text-xs text-muted-foreground">
          {hoveredTile ? (
            <p className="text-foreground animate-in fade-in duration-100">
              <span className="font-semibold text-primary">[{hoveredTile.num}] {hoveredTile.fullTitle}:</span>{' '}
              <span className="text-muted-foreground">{hoveredTile.desc}</span>
            </p>
          ) : (
            <p className="space-x-3 text-[11px] font-mono">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/10 text-foreground">1-8</kbd> to jump</span>
              <span>•</span>
              <span>Click <kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/10 text-foreground">ESC</kbd> to exit</span>
              <span>•</span>
              <span>Type to search</span>
            </p>
          )}
        </div>

        {/* Quick Action Pills Bottom Strip */}
        <div className="mt-3 flex items-center space-x-2">
          {extraActions.slice(0, 3).map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => executeAction(act.action)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 border border-white/15 text-xs text-muted-foreground hover:text-foreground transition-all backdrop-blur-lg cursor-pointer active:scale-95 shadow-sm"
              >
                <Icon className={cn("w-3.5 h-3.5", act.color)} />
                <span className="hidden sm:inline">{act.label}</span>
              </button>
            );
          })}
        </div>
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

/**
 * Programmatic helper to close command palette
 */
export function closeCommandPalette() {
  window.dispatchEvent(new CustomEvent('studyos:close-command-palette'));
}
