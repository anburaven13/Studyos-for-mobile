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
        <title>StudyOS | The All-in-One AI Study Planner & Homework Tracker</title>
        <meta name="description" content="StudyOS is the ultimate AI student planner. Train AI tutors on your notes, generate flashcards, and organize your academic life." />
        <link rel="canonical" href="https://studyos-snowy.vercel.app/" />
        <meta property="og:title" content="StudyOS | The All-in-One AI Study Planner" />
        <meta property="og:description" content="StudyOS is the ultimate AI student planner. Train AI tutors on your notes, generate flashcards, and organize your academic life." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://studyos-snowy.vercel.app/" />
        <meta property="og:image" content="https://studyos-snowy.vercel.app/hero-bg.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="StudyOS | The All-in-One AI Study Planner" />
        <meta name="twitter:description" content="Upload your notes and deadlines. StudyOS instantly acts as your 24/7 tutor." />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "StudyOS",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "StudyOS is the ultimate AI student planner. Train AI tutors on your notes, generate flashcards, and organize your academic life.",
              "url": "https://studyos-snowy.vercel.app/"
            }
          `}
        </script>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "StudyOS",
              "url": "https://studyos-snowy.vercel.app/",
              "logo": "https://studyos-snowy.vercel.app/favicon.svg"
            }
          `}
        </script>
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
              The #1 AI Study Planner
            </div>

            <h1>
              <span className="headline-line appear appear--mask">Crush your exams with an <em>AI tutor</em></span>
              <span className="headline-line appear appear--mask">that knows your exact syllabus.</span>
            </h1>

            <p className="lede appear appear--soft">
              Upload your messy notes, PDFs, and deadlines. StudyOS automatically organizes your homework, tracks your weak points, and acts as your personal 24/7 tutor.
            </p>

            <div className="hero-actions">
              <Link to="/login" className="btn btn-solid appear appear--btn">
                Start for Free
              </Link>
            </div>
            
            <div className="features-grid appear appear--soft">
              <div className="feature-card">
                <h3>Smart Homework Tracker</h3>
                <p>Manage assignments, tests, and deadlines efficiently with an AI that plans your study schedule.</p>
              </div>
              <div className="feature-card">
                <h3>AI Note-Taking</h3>
                <p>Instantly generate flashcards, summaries, and extract text from photos of your textbook or PDFs.</p>
              </div>
              <div className="feature-card">
                <h3>Context-Aware Tutor</h3>
                <p>A 24/7 AI tutor that has deep context on all your notes and classes to answer any question.</p>
              </div>
              <div className="feature-card">
                <h3>Knowledge DNA</h3>
                <p>Track your revision progress with confidence meters to focus exactly on your weakest subjects.</p>
              </div>
            </div>

            <div className="seo-content appear appear--soft" style={{ marginTop: '4rem', textAlign: 'left', background: 'var(--surface-bg)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Why Choose StudyOS for Your Exams?</h2>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Managing your <strong>homework</strong> and <strong>deadlines</strong> shouldn't be the hardest part of school. When you upload your <strong>notes</strong>, textbook photos, or <strong>PDFs</strong>, StudyOS automatically organizes your entire academic schedule.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Instead of spending hours creating flashcards manually, let your personalized <strong>AI tutor</strong> handle the heavy lifting. The built-in AI assistant has deep context on all your subjects, allowing you to <strong>study</strong> smarter, not harder. You can start for free today and effortlessly crush your upcoming board exams.
              </p>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
