import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import { Brain, Shield, ArrowLeft, Lock, EyeOff, Database, UserCheck, HardDrive } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      <Helmet>
        <title>Privacy Policy | StudyOS</title>
        <meta name="description" content="StudyOS Privacy Policy: How we protect your data, notes, and academic privacy." />
      </Helmet>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md z-50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-colors">
              <Brain className="w-4 h-4 text-zinc-200" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Study<span className="text-zinc-500">OS</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-xs font-mono">
            <Link to="/" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pt-28 pb-16 px-6 max-w-4xl mx-auto w-full">
        <div className="mb-10 pb-8 border-b border-zinc-800/80">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-4">
            <Shield className="w-3.5 h-3.5 text-zinc-300" />
            PRIVACY &amp; SECURITY PROTOCOLS
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-zinc-400 font-mono">
            Last modified: October 13, 2026 &middot; Your privacy is paramount
          </p>
        </div>

        {/* Core Guarantees Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
            <Lock className="w-5 h-5 text-zinc-300 mb-2" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-1">Encrypted In Transit &amp; Rest</h3>
            <p className="text-xs text-zinc-400">All data transfers use TLS 1.3 encryption with AES-256 database protection.</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
            <EyeOff className="w-5 h-5 text-zinc-300 mb-2" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-1">No Data Selling</h3>
            <p className="text-xs text-zinc-400">We never monetize, broker, or sell student information or note uploads.</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
            <UserCheck className="w-5 h-5 text-zinc-300 mb-2" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-1">Student Ownership</h3>
            <p className="text-xs text-zinc-400">You retain total ownership and can export or wipe your data anytime.</p>
          </div>
        </div>

        <div className="space-y-10 text-zinc-300 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">01.</span> Information We Collect
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              We collect only the essential information necessary to deliver and personalize your study environment:
            </p>
            <ul className="space-y-2 text-zinc-400 list-disc list-inside text-sm">
              <li><strong>Account Information:</strong> Your email address, username, grade level, and authentication tokens via Firebase Auth.</li>
              <li><strong>Academic Materials:</strong> Study notes, homework task descriptions, course syllabus PDFs, and uploaded documents you choose to provide for AI processing.</li>
              <li><strong>Study Telemetry:</strong> Study session durations, flashcard review intervals, and exam target dates used to personalize your Knowledge DNA profile.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">02.</span> How We Use Your Data
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              Your information is exclusively utilized to power your personal StudyOS features:
            </p>
            <ul className="space-y-2 text-zinc-400 list-disc list-inside text-sm">
              <li>Synthesizing your lecture notes into flashcards, quizzes, and revision guides.</li>
              <li>Powering the AI Tutor to answer questions based directly on your notes.</li>
              <li>Intelligently scheduling study blocks in your Smart Planner ahead of exam deadlines.</li>
              <li>Synchronizing your workspace securely across mobile and desktop devices.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">03.</span> AI Training &amp; Document Protection
            </h2>
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-4 mb-4 flex items-start gap-3">
              <Database className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300 leading-relaxed">
                <span className="font-semibold text-white">Strict Isolation:</span> Your uploaded documents, study notes, and chat dialogues with the AI Tutor are strictly segregated. We do not license, share, or submit student data into open pools to train public foundation models.
              </div>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              When documents are processed by AI models, they are transmitted via secure enterprise APIs with strict zero-retention policies on third-party inference servers.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">04.</span> Your Rights &amp; Data Deletion
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              You maintain total control over your academic data:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-zinc-950/50 p-3.5 rounded-lg border border-zinc-800">
                <div className="font-medium text-white mb-1 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-zinc-400" /> Complete Export
                </div>
                <div className="text-xs text-zinc-400">
                  Export all your notes, schedules, and flashcard decks at any time to standard CSV or Markdown.
                </div>
              </div>
              <div className="bg-zinc-950/50 p-3.5 rounded-lg border border-zinc-800">
                <div className="font-medium text-white mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-zinc-400" /> Account Wipeout
                </div>
                <div className="text-xs text-zinc-400">
                  Delete your account directly via Settings to immediately purge your databases, files, and tokens.
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">05.</span> Contact Privacy Officer
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              If you have any questions or data requests regarding our privacy infrastructure, please contact us:
            </p>
            <Link
              to="/support"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono transition-colors"
            >
              Contact Support &amp; Privacy Desk
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
