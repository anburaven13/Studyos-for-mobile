import React from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton } from '../ui/Skeleton';

/**
 * 1. Dashboard Skeleton
 * Renders the exact 4-card metric grid, large chart card, and 2 split schedule/task cards.
 */
export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Title & subtitle */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl flex items-center space-x-4">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-7 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Large Analytics Chart Card */}
      <div className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-5 w-56 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>

      {/* 2 Bottom Split Cards: Schedule & Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[1, 2].map((cardIdx) => (
          <div key={cardIdx} className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl space-y-4">
            <Skeleton className="h-6 w-36 rounded-lg mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((itemIdx) => (
                <div key={itemIdx} className="p-4 border border-white/5 rounded-xl bg-background/50 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 2. Notes Skeleton
 * Renders notes master-detail view: left note list, right rich editor/viewer.
 */
export function NotesSkeleton() {
  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden p-4 md:p-6 gap-4 animate-in fade-in duration-300">
      {/* Left List Pane */}
      <div className="w-full md:w-80 border border-white/10 rounded-2xl p-4 bg-card/60 backdrop-blur-xl flex flex-col space-y-4 shrink-0">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <Skeleton className="h-6 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
        <div className="space-y-2.5 flex-1 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 border border-white/5 rounded-xl bg-background/40 space-y-2">
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Right Editor Pane */}
      <div className="flex-1 border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-11/12 rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Homework Skeleton
 * Header + Filter pills + 5 Task Cards.
 */
export function HomeworkSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-52 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border border-white/10 rounded-2xl bg-card/60 backdrop-blur-xl flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4 flex-1">
              <Skeleton className="w-5 h-5 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-2/3 rounded" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 4. Planner Skeleton
 * Focus/Timer card on top + weekly schedule columns/timeline.
 */
export function PlannerSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-44 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      {/* Top Timer/Widget Card */}
      <div className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        </div>
        <div className="flex space-x-3">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>

      {/* Schedule Items List */}
      <div className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl space-y-4">
        <Skeleton className="h-6 w-48 rounded-lg mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border border-white/5 rounded-xl bg-background/50 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 5. Exam Hub Skeleton
 * Countdown banner card + 3 Subject Cards.
 */
export function ExamHubSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-44 rounded-xl" />
          <Skeleton className="h-4 w-60 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      {/* Target/Next Exam Banner */}
      <div className="border border-white/10 rounded-3xl p-6 md:p-8 bg-card/60 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left flex-1">
          <Skeleton className="h-4 w-32 rounded mx-auto md:mx-0" />
          <Skeleton className="h-8 w-56 rounded-xl mx-auto md:mx-0" />
          <Skeleton className="h-4 w-40 rounded mx-auto md:mx-0" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <Skeleton className="w-16 h-16 rounded-2xl" />
        </div>
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-9 w-full rounded-xl mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 6. Routines Skeleton
 * Header + 7 Day Pill Tabs + 4 Time Slot blocks.
 */
export function RoutinesSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-44 rounded-full" />
      </div>

      {/* Routine Blocks List */}
      <div className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-48 rounded-lg" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border border-white/5 rounded-xl bg-background/50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="w-5 h-5 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 7. AI Tutor Skeleton
 * Top model/subject header + conversational message bubbles + prompt box.
 */
export function TutorSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] md:h-screen p-4 md:p-6 max-w-5xl mx-auto w-full overflow-hidden animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="border border-white/10 rounded-2xl p-4 bg-card/60 backdrop-blur-xl flex items-center justify-between shrink-0 mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl overflow-hidden flex flex-col justify-end space-y-4 mb-4">
        {/* Incoming AI message */}
        <div className="flex items-start space-x-3 max-w-lg">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="space-y-2 p-4 rounded-2xl border border-white/10 bg-white/[0.04] w-full">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        </div>

        {/* Outgoing user message */}
        <div className="flex items-end justify-end max-w-md ml-auto">
          <div className="space-y-2 p-4 rounded-2xl border border-white/10 bg-white/[0.08] w-72">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>

        {/* Incoming AI response */}
        <div className="flex items-start space-x-3 max-w-xl">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="space-y-2 p-4 rounded-2xl border border-white/10 bg-white/[0.04] w-full">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-11/12 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        </div>
      </div>

      {/* Bottom Prompt Bar */}
      <div className="border border-white/10 rounded-2xl p-3 bg-card/60 backdrop-blur-xl flex items-center space-x-3 shrink-0">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-12 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * 8. Workspace / PDF Skeleton
 * Split layout: Left PDF viewer + Right Q&A panel.
 */
export function WorkspaceSkeleton() {
  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-3.5rem)] md:h-screen p-4 md:p-6 gap-4 overflow-hidden animate-in fade-in duration-300">
      {/* Left PDF Document Container */}
      <div className="flex-1 border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="h-4 w-72 rounded" />
        <Skeleton className="h-10 w-40 rounded-full mt-2" />
      </div>

      {/* Right AI Conversation Panel */}
      <div className="w-full md:w-96 border border-white/10 rounded-2xl p-5 bg-card/60 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-xl mt-4" />
      </div>
    </div>
  );
}

/**
 * 9. Messages Skeleton
 * Split layout: Left friends/chats list + Right message conversation thread.
 */
export function MessagesSkeleton() {
  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-3.5rem)] md:h-screen p-4 md:p-6 gap-4 overflow-hidden animate-in fade-in duration-300">
      {/* Left Sidebar */}
      <div className="w-full md:w-80 border border-white/10 rounded-2xl p-4 bg-card/60 backdrop-blur-xl flex flex-col space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
        <div className="space-y-2 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 border border-white/5 rounded-xl bg-background/40 flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Message Chat Pane */}
      <div className="hidden md:flex flex-1 border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl flex-col justify-between">
        <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
        <div className="space-y-4 py-6">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <Skeleton className="h-14 w-80 rounded-2xl ml-auto" />
          <Skeleton className="h-16 w-72 rounded-2xl" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * 10. Genome Skeleton
 * Search bar + 6 Cognitive DNA concept cards.
 */
export function GenomeSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-60 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-44 rounded-full" />
      </div>

      {/* Search Bar */}
      <Skeleton className="h-11 w-full max-w-md rounded-xl" />

      {/* DNA Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-5/6 rounded" />
              <Skeleton className="h-3 w-4/6 rounded" />
            </div>
            <div className="pt-2 flex justify-between items-center border-t border-white/5">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 11. Settings Skeleton
 * Account profile card + 2FA card + Preferences.
 */
export function SettingsSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>

      <div className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl space-y-6">
        <div className="flex items-center space-x-4 pb-4 border-b border-white/10">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-4 w-60 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl space-y-4">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded" />
        <Skeleton className="h-10 w-36 rounded-full mt-2" />
      </div>
    </div>
  );
}

/**
 * 12. Universal Fallback Page Skeleton
 */
export function GenericPageSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>
      <div className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl space-y-4">
        <Skeleton className="h-6 w-40 rounded-lg" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-white/10 rounded-2xl p-6 bg-card/60 backdrop-blur-xl space-y-3">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Page-Aware Route Skeleton Loader
 * Automatically detects current route and renders the matching skeleton!
 */
export function RouteSkeletonLoader() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  if (path === '/app' || path === '/app/') return <DashboardSkeleton />;
  if (path.includes('/app/notes')) return <NotesSkeleton />;
  if (path.includes('/app/homework')) return <HomeworkSkeleton />;
  if (path.includes('/app/planner')) return <PlannerSkeleton />;
  if (path.includes('/app/tutor')) return <TutorSkeleton />;
  if (path.includes('/app/exams')) return <ExamHubSkeleton />;
  if (path.includes('/app/routines')) return <RoutinesSkeleton />;
  if (path.includes('/app/workspace')) return <WorkspaceSkeleton />;
  if (path.includes('/app/messages')) return <MessagesSkeleton />;
  if (path.includes('/app/genome')) return <GenomeSkeleton />;
  if (path.includes('/app/settings')) return <SettingsSkeleton />;

  return <GenericPageSkeleton />;
}

/**
 * Root Application Skeleton Loader (Full-Screen Layout Shell)
 */
export function RootSkeletonLoader() {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative overflow-hidden">
      {/* Sidebar Placeholder */}
      <div className="hidden md:flex flex-col w-64 border-r border-white/10 p-5 space-y-6 shrink-0 bg-black/40">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8">
        <DashboardSkeleton />
      </div>
    </div>
  );
}
