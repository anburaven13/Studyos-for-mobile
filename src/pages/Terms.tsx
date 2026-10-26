import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import { Brain, FileText, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      <Helmet>
        <title>Terms of Service | StudyOS</title>
        <meta name="description" content="StudyOS Terms of Service and Conditions of Use." />
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
            <FileText className="w-3.5 h-3.5 text-zinc-300" />
            LEGAL // TERMS OF SERVICE
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-zinc-400 font-mono">
            Last modified: October 13, 2026 &middot; Effective immediately
          </p>
        </div>

        <div className="space-y-10 text-zinc-300 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">01.</span> Acceptance of Terms
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              By accessing, browsing, registering for, or using the StudyOS website, web application, or any associated APIs (collectively, the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              If you are using the Service on behalf of an educational institution, school, or organization, you represent and warrant that you have authority to bind that entity to these Terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">02.</span> Description of the Service
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              StudyOS provides an integrated study operating platform for students and educators, comprising AI study tutoring, note organization, smart syllabus scheduling, homework tracking, flashcard generation, and exam preparation utilities.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              We continually enhance our services. As a result, features, user interfaces, and functionality may be improved, modified, or updated over time without prior notice.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">03.</span> Academic Integrity &amp; Ethical Use
            </h2>
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300 leading-relaxed">
                StudyOS is designed exclusively as an educational study accelerator, knowledge synthesizer, and tutor. It is strictly not intended to facilitate academic misconduct, cheating, or plagiarized submissions.
              </p>
            </div>
            <p className="text-zinc-400 leading-relaxed mb-3">
              You agree that you will not use StudyOS to:
            </p>
            <ul className="space-y-2 text-zinc-400 list-disc list-inside text-sm">
              <li>Violate the honor code or academic policies of your school, college, or university.</li>
              <li>Submit AI-generated explanations or answers verbatim as your own original work in examinations or proctored assessments without permission.</li>
              <li>Upload malicious content, harmful scripts, or copyrighted exam banks that you do not own the right to distribute.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">04.</span> Your Content &amp; Intellectual Property
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              You retain 100% full ownership and intellectual property rights in and to all notes, study guides, documents, homework files, and lecture transcripts you upload or input into StudyOS (&ldquo;User Content&rdquo;).
            </p>
            <div className="flex items-start gap-2.5 text-zinc-300 text-sm bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Public AI Training Guarantee:</strong> We do not sell your personal notes or use your uploaded school materials to train public, open third-party AI models.
              </span>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">05.</span> AI Disclaimers &amp; Educational Guidance
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              StudyOS uses modern artificial intelligence to synthesize information, generate study questions, and answer academic inquiries. While we strive for extreme precision, AI systems may occasionally produce inaccurate, incomplete, or out-of-date answers.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Users are advised to cross-verify critical academic formulas, dates, theorems, and definitions with their course textbooks and certified course instructors.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">06.</span> Account Security &amp; Credentials
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              You are responsible for maintaining the confidentiality of your login credentials and 2-Factor Authentication keys. You must immediately inform our support team of any unauthorized use or security compromise regarding your account.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">07.</span> Contact &amp; Inquiries
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              For questions regarding these Terms or to report an issue, please reach out to our team:
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/support"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Contact Legal Support
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
