import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './Landing.css';

export default function Landing() {
  useEffect(() => {
    // Animation fallback logic
    let frame1: number, frame2: number;
    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        const appears = document.querySelectorAll('.appear');
        let isRunning = false;
        appears.forEach(el => {
          const anims = el.getAnimations();
          if (anims.some(a => a.playState === 'running' || a.playState === 'finished')) {
            isRunning = true;
          }
        });
        if (!isRunning) {
          appears.forEach(el => el.classList.add('is-in'));
          document.querySelector('.hero-photo')?.classList.add('is-in');
        }
      });
    });

    const handleAnimEnd = (e: Event) => {
      (e.target as HTMLElement).classList.add('is-in');
    };
    
    const elements = document.querySelectorAll('.appear, .hero-photo, .badge-star, .headline-line em');
    elements.forEach(el => el.addEventListener('animationend', handleAnimEnd, { once: true }));

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
      elements.forEach(el => el.removeEventListener('animationend', handleAnimEnd));
    };
  }, []);

  return (
    <div className="landing-container">
      <Helmet>
        <title>StudyOS | Operational AI Study Infrastructure & Homework Planner</title>
        <meta name="description" content="StudyOS is the ultimate AI student planner and homework tracker. Train AI tutors on your study notes, generate flashcards, and organize your academic life." />
        <link rel="canonical" href="https://studyos-snowy.vercel.app/" />
        <meta property="og:title" content="StudyOS | Operational AI Study Infrastructure & Homework Planner" />
        <meta property="og:description" content="StudyOS is the ultimate AI student planner and homework tracker. Train AI tutors on your study notes, generate flashcards, and organize your academic life." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://studyos-snowy.vercel.app/" />
        <meta property="og:image" content="https://studyos-snowy.vercel.app/hero-bg.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="StudyOS | Operational AI Study Infrastructure & Homework Planner" />
        <meta name="twitter:description" content="Deploy adaptive AI tutors that learn, analyze, and scale your study workflow across all subjects." />
      </Helmet>
      
      <div className="grain"></div>
      <div className="hero-photo">
        <img src="/hero-bg.webp" alt="StudyOS Hero Dashboard and Notes interface showing AI integration" className="hero-bg-img" />
      </div>
      <div className="page">
        <header className="header">
          <Link to="/" className="logo appear appear--scale" aria-label="StudyOS">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <g transform="rotate(-30 12 12)">
                <circle cx="7.3" cy="3.2" r="1.45" />
                <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <circle cx="16.7" cy="20.8" r="1.45" />
              </g>
            </svg>
            Study<span className="logo-suffix">OS</span>
          </Link>
          <Link to="/login" className="btn btn-solid header-cta appear appear--scale">
            Start for Free
          </Link>
        </header>

        <main className="hero" id="top">
          <div className="hero-copy">
            <div className="badge appear appear--pop">
              <svg viewBox="0 0 24 24" fill="white" className="badge-star">
                <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z"/>
              </svg>
              Operational AI Study Infrastructure
            </div>

            <h1>
              <span className="headline-line appear appear--mask">Train <em>AI tutors</em> on your</span>
              <span className="headline-line appear appear--mask">study notes in minutes.</span>
            </h1>

            <p className="lede appear appear--soft">
              Deploy adaptive AI tutors that learn, analyze, and scale your study workflow across all subjects. Replace multiple disconnected apps with one unified, minimalist, and smart student planner.
            </p>

            <div className="hero-actions">
              <Link to="/login" className="btn btn-solid appear appear--btn">
                Start for Free
              </Link>
            </div>
            
            {/* Added for SEO depth and context */}
            <div className="sr-only">
              <h2>Features</h2>
              <ul>
                <li>Smart Homework Tracker: Manage your assignments and deadlines efficiently.</li>
                <li>AI Note-taking: Generate flashcards, summaries, and extract text from PDFs.</li>
                <li>Exam Hub: Track revision progress with confidence meters and practice questions.</li>
                <li>Unified Workspace: Everything in one place to reduce context-switching fatigue.</li>
              </ul>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
