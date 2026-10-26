import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, type Variants } from 'motion/react';
import { 
  Brain, 
  ArrowLeft, 
  Home, 
  BookOpen, 
  Calendar, 
  Bot, 
  GraduationCap, 
  ArrowUpRight 
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const homeDestination = user ? '/app' : '/';

  // Keyboard navigation shortcuts (ESC/Backspace to go back, H to go home)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate(homeDestination);
        }
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        navigate(homeDestination);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, homeDestination]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
  };

  const quickLinks = [
    {
      label: 'Dashboard',
      path: '/app',
      desc: 'Overview & metrics',
      icon: Home,
    },
    {
      label: 'Notes',
      path: '/app/notes',
      desc: 'Notebooks & summaries',
      icon: BookOpen,
    },
    {
      label: 'AI Tutor',
      path: '/app/tutor',
      desc: '24/7 concept breakdown',
      icon: Bot,
    },
    {
      label: 'Planner',
      path: '/app/planner',
      desc: 'Schedule & deadlines',
      icon: Calendar,
    },
    {
      label: 'Exam Hub',
      path: '/app/exams',
      desc: 'Revisions & practice',
      icon: GraduationCap,
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-white/20 relative overflow-hidden">
      <Helmet>
        <title>404 — Page Not Found | StudyOS</title>
        <meta name="description" content="The requested page could not be found." />
      </Helmet>

      {/* Atmospheric ambient lighting so liquid glass cards refract naturally */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[650px] h-[350px] bg-gradient-to-r from-blue-600/15 via-teal-500/10 to-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[#09090b]/60" />
      </div>

      {/* Top Header */}
      <header className="w-full border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md px-6 py-4 relative z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to={homeDestination} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-lg flex items-center justify-center group-hover:border-white/20 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <Brain className="w-4 h-4 text-zinc-200" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              Study<span className="text-zinc-500">OS</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl text-[11px] font-mono text-zinc-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              STATUS 404
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 relative z-10">
        <motion.div
          className="w-full max-w-xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Stark 404 Display */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="inline-block">
              <span className="font-mono text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-white drop-shadow-sm select-none block">
                404
              </span>
            </div>
          </motion.div>

          {/* Requested Path Badge with Liquid Glass Refraction */}
          <motion.div variants={itemVariants} className="mb-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/15 backdrop-blur-xl text-xs font-mono text-zinc-300 max-w-full truncate shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),0_4px_16px_rgba(0,0,0,0.3)]">
              <span className="text-zinc-400">GET</span>
              <span className="text-white truncate font-medium">{location.pathname}</span>
              <span className="text-red-400 font-medium">-&gt; 404 NOT_FOUND</span>
            </div>
          </motion.div>

          {/* Title & Description */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Page does not exist
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
              The path you requested could not be resolved or may have been relocated in your workspace.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {/* Prominent Action Button */}
            <Link
              to={homeDestination}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-sm font-medium active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(255,255,255,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)]"
            >
              <Home className="w-4 h-4" />
              {user ? 'Return to Dashboard' : 'Return Home'}
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-zinc-200 text-zinc-800 rounded font-mono">
                H
              </kbd>
            </Link>

            {/* Liquid Glass Secondary Button */}
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(homeDestination);
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-zinc-200 hover:text-white border border-white/10 hover:border-white/20 backdrop-blur-xl text-sm font-medium active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-white/10 border border-white/10 text-zinc-300 rounded font-mono">
                ESC
              </kbd>
            </button>
          </motion.div>

          {/* Fast Route Directory with Liquid Glass Cards */}
          <motion.div variants={itemVariants} className="border-t border-white/10 pt-8 text-left">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Direct Routes
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                WORKSPACE SHORTCUTS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 backdrop-blur-xl flex items-center justify-between group transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.25)] hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-zinc-200 group-hover:scale-105 transition-transform shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-zinc-100 group-hover:text-white transition-colors">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-xs font-mono text-zinc-500 relative z-10">
        StudyOS &copy; {new Date().getFullYear()} &middot; System Route Resolver
      </footer>
    </div>
  );
}
