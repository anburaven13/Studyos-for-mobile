import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import StudyTimer from './StudyTimer';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence } from 'motion/react';
import { Menu } from 'lucide-react';
import UsernamePromptModal from './UsernamePromptModal';
import CommandPalette from '../CommandPalette';
import InteractiveGrapher from '../math/InteractiveGrapher';
import { RouteSkeletonLoader } from '../skeletons/PageSkeletons';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMathGrapherOpen, setIsMathGrapherOpen] = useState(false);
  const [mathEquation, setMathEquation] = useState<string | undefined>();

  useHotkeys('ctrl+n, meta+n', (e) => {
    e.preventDefault();
    navigate('/app/notes');
  });

  useHotkeys('ctrl+k, meta+k', (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('studyos:open-command-palette'));
  }, { enableOnFormTags: true, preventDefault: true });

  useHotkeys('ctrl+p, meta+p', (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('studyos:open-command-palette'));
  }, { enableOnFormTags: true, preventDefault: true });

  useEffect(() => {
    const handleOpenMath = (e: any) => {
      setMathEquation(e.detail?.initialEquation);
      setIsMathGrapherOpen(true);
    };
    window.addEventListener('studyos:open-math-grapher', handleOpenMath);
    return () => window.removeEventListener('studyos:open-math-grapher', handleOpenMath);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative selection:bg-primary/30">
      {/* Premium Glass Background - High-Intensity Ambient Lights */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Strong atmospheric glows specifically placed behind the Sidebar and Header to force glass distortion */}
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-indigo-600/30 blur-[100px] mix-blend-screen"></div>
        <div className="absolute top-1/3 -left-32 w-[400px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen"></div>
        <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen"></div>
      </div>

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col relative z-0">
        {/* Mobile / Split Screen Header */}
        <div className="md:hidden h-14 border-b border-white/10 flex items-center px-4 justify-between bg-black/40 backdrop-blur-3xl backdrop-saturate-200 z-30 sticky top-0 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold tracking-tight flex items-center space-x-2">
            <img src="/favicon.svg" alt="StudyOS" className="w-6 h-6 rounded-md object-contain shadow-sm border border-white/10" />
            <span>StudyOS</span>
          </span>
          <button onClick={() => navigate('/app/settings')} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors" title="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-1 flex flex-col w-full h-full min-h-0"
          >
            <React.Suspense fallback={<RouteSkeletonLoader />}>
              <Outlet />
            </React.Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <StudyTimer />
      <UsernamePromptModal />
      <CommandPalette onOpenMathGrapher={() => setIsMathGrapherOpen(true)} />
      <InteractiveGrapher 
        isOpen={isMathGrapherOpen} 
        onClose={() => setIsMathGrapherOpen(false)} 
        initialEquation={mathEquation}
      />
    </div>
  );
}
