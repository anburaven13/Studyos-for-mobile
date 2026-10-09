import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import { TextEffect } from '@/components/motion-primitives/text-effect';
import { Mail, MessageCircle, HelpCircle, ArrowRight, Brain } from 'lucide-react';

export default function Support() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-50 overflow-x-hidden font-sans selection:bg-purple-500/30">
      <Helmet>
        <title>Support | StudyOS</title>
        <meta name="description" content="Get help and support for StudyOS." />
      </Helmet>
      
      {/* Immersive Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation */}
        <header className="fixed top-0 left-0 right-0 h-20 border-b border-white/5 bg-[#050505]/60 backdrop-blur-xl z-50">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Study<span className="text-white/40">OS</span>
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/faq" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">FAQ</Link>
              <Link to="/support" className="text-sm font-medium text-white transition-colors">Support</Link>
            </nav>
            
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
                Log in
              </Link>
              <Link to="/login" className="text-sm font-semibold bg-white text-black px-5 py-2.5 rounded-full hover:bg-slate-200 transition-all">
                Start for Free
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-grow pt-32 pb-20 w-full max-w-5xl mx-auto px-6">
          <div className="text-center mb-20 pt-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 text-white mb-8 shadow-[0_0_40px_rgba(255,255,255,0.05)] backdrop-blur-md">
              <HelpCircle className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight text-white">
              <TextEffect as="span" preset="blur" per="char">How can we help?</TextEffect>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Our support team is here to assist you with any questions, issues, or feature requests you might have while using StudyOS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Email Support Card */}
            <div className="group relative bg-white/[0.02] border border-white/10 rounded-3xl p-10 flex flex-col items-start text-left overflow-hidden hover:bg-white/[0.04] transition-colors">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-colors pointer-events-none"></div>
              
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-lg">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-white">Email Support</h2>
              <p className="text-slate-400 mb-12 flex-grow text-lg leading-relaxed">
                Send us an email anytime. We typically respond within 24-48 hours on business days to help resolve any technical issues.
              </p>
              <a 
                href="mailto:atudyos.notification@gmail.com" 
                className="inline-flex items-center justify-center bg-white text-black font-bold text-lg py-4 px-8 rounded-full hover:bg-slate-200 transition-colors w-full group/btn"
              >
                Email Us
                <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* FAQ Card */}
            <div className="group relative bg-white/[0.02] border border-white/10 rounded-3xl p-10 flex flex-col items-start text-left overflow-hidden hover:bg-white/[0.04] transition-colors">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full group-hover:bg-purple-500/20 transition-colors pointer-events-none"></div>

              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-lg">
                <MessageCircle className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-white">Check the FAQ</h2>
              <p className="text-slate-400 mb-12 flex-grow text-lg leading-relaxed">
                Find quick answers to the most common questions about features, pricing, and how to get the most out of your AI Tutor.
              </p>
              <Link 
                to="/faq" 
                className="inline-flex items-center justify-center bg-white/5 text-white font-bold text-lg py-4 px-8 rounded-full hover:bg-white/10 border border-white/10 transition-colors w-full group/btn"
              >
                Browse FAQs
                <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </main>

        <div className="border-t border-white/10 bg-black/50 backdrop-blur-md">
          <Footer />
        </div>
      </div>
    </div>
  );
}
