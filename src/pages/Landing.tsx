import React, { useState, useEffect, useRef } from 'react';
import { Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const FadeInUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {children}
    </div>
  );
};


const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'About', id: 'about' },
    { label: 'Features', id: 'features' },
    { label: 'FAQ', id: 'faq' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer text-white" onClick={() => scrollTo('about')}>
          <Brain className="w-6 h-6" />
          <span className="text-xl font-bold tracking-tight">StudyOS</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block">
          <Link to="/login" className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/5 transition-colors inline-block">
            Get started
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white focus:outline-none p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-lg border-b border-white/10 transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? 'max-h-96 py-4' : 'max-h-0 py-0 border-transparent'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-gray-300 hover:text-white text-base font-medium py-2"
            >
              {link.label}
            </button>
          ))}
          <Link to="/login" className="bg-[#1F1F22] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/5 mt-2 inline-block">
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
};

const DummyLogo = ({ name }: { name: string }) => (
  <div className="flex items-center gap-2 text-gray-500 font-bold text-xl px-8 flex-shrink-0">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
    {name}
  </div>
);

const Marquee = () => {
  const brands = ['Harvard', 'Stanford', 'MIT', 'Oxford', 'Cambridge', 'UCLA'];
  // Duplicate array 4 times for seamless infinite scroll
  const duplicatedBrands = [...brands, ...brands, ...brands, ...brands];

  return (
    <div className="w-full mt-24">
      <p className="text-sm text-gray-500 font-medium mb-8 text-center">Trusted by top students at</p>
      <div
        className="overflow-hidden w-full"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}
      >
        <div className="flex w-max animate-marquee">
          {duplicatedBrands.map((brand, i) => (
            <DummyLogo key={i} name={brand} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Hero = () => {
  return (
    <section id="about" className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 relative z-0">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 -z-10 object-cover min-w-full min-h-full opacity-90"
      >
        <source src="https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black -z-10" />

      <FadeInUp>
        <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-8 backdrop-blur-sm mx-auto w-max">
          ✨ Announcing StudyOS 2.0
        </div>
      </FadeInUp>

      <FadeInUp delay={100}>
        <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 text-center max-w-4xl mx-auto px-4">
          Crush your exams with <br className="hidden md:block" />
          an AI tutor that <span className="font-serif italic font-normal">knows you.</span>
        </h1>
      </FadeInUp>

      <FadeInUp delay={200}>
        <p className="text-[16px] text-gray-400 max-w-2xl text-center mx-auto mb-10 px-4">
          <strong className="text-gray-200">What is StudyOS?</strong> StudyOS is an AI-powered study planner and homework tracker designed for students. Upload your messy notes, PDFs, and deadlines, and our system automatically organizes your homework, tracks your weak points, and acts as your personal 24/7 tutor.
        </p>
      </FadeInUp>

      <FadeInUp delay={300}>
        <div className="flex flex-row items-center gap-4">
          <Link to="/login" className="bg-white text-black px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors inline-block">
            Start for Free
          </Link>
          <a href="#features" className="bg-[#1F1F22] text-white px-6 py-3 rounded-full text-sm font-medium border border-white/5 hover:bg-[#2A2A2D] transition-colors inline-block">
            Explore Features
          </a>
        </div>
      </FadeInUp>

      <FadeInUp delay={400}>
        <Marquee />
      </FadeInUp>

      <FadeInUp delay={500}>
        <div className="mt-24 max-w-3xl mx-auto text-center px-6">
          <blockquote className="text-xl md:text-2xl font-serif italic text-gray-300 mb-6 leading-relaxed">
            "StudyOS represents a paradigm shift in how students interact with their course materials. By combining spaced repetition with personalized AI tutoring, it drastically reduces study time while improving long-term retention."
          </blockquote>
          <div className="text-sm text-gray-400">
            <strong className="text-gray-200">Dr. Elena Rostova</strong> <br />
            Cognitive Science Researcher & EdTech Expert
          </div>
        </div>
      </FadeInUp>
    </section>
  );
};

const SEOBlocks = () => {
  return (
    <section className="py-20 px-6 max-w-4xl mx-auto w-full border-t border-white/5">
      <FadeInUp>
        <div className="mb-16">
          <h2 className="text-3xl font-semibold mb-4">What is StudyOS?</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            StudyOS is an AI-powered study planner and homework tracker designed specifically for students. It combines automated schedule generation, OCR note transcription, and personalized AI tutoring into a single platform. By analyzing your syllabus and deadlines, StudyOS creates an optimized daily routine to improve grades and reduce academic stress.
          </p>
        </div>
      </FadeInUp>

      <FadeInUp delay={100}>
        <div className="mb-16">
          <h2 className="text-3xl font-semibold mb-4">How to Use StudyOS for Exam Prep</h2>
          <ol className="list-decimal list-inside space-y-4 text-gray-400 text-lg ml-2">
            <li><strong>Upload Materials:</strong> Import your PDFs, lecture slides, and handwritten notes.</li>
            <li><strong>Input Deadlines:</strong> Add your upcoming exams, midterms, and homework due dates.</li>
            <li><strong>Generate Schedule:</strong> Let the AI auto-planner build your personalized daily study routine.</li>
            <li><strong>Take Practice Quizzes:</strong> Ask the AI tutor to generate flashcards and quizzes based strictly on your uploaded materials.</li>
            <li><strong>Review Weak Points:</strong> Focus your remaining study time on the Knowledge DNA analytics that highlight where you struggle most.</li>
          </ol>
        </div>
      </FadeInUp>

      <FadeInUp delay={200}>
        <div className="mb-16">
          <h2 className="text-3xl font-semibold mb-6">StudyOS vs. Traditional Planners</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-gray-300 text-sm md:text-base">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-white/10">Feature</th>
                  <th className="px-6 py-4 font-semibold border-b border-white/10 text-white">StudyOS AI</th>
                  <th className="px-6 py-4 font-semibold border-b border-white/10 text-gray-500">Paper/Standard Planners</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr className="bg-black/20">
                  <td className="px-6 py-4">Schedule Generation</td>
                  <td className="px-6 py-4 text-green-400">Automatic & Dynamic</td>
                  <td className="px-6 py-4 text-gray-500">Manual Entry Only</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Homework Tracking</td>
                  <td className="px-6 py-4">Syncs with Syllabus automatically</td>
                  <td className="px-6 py-4 text-gray-500">Requires daily updating</td>
                </tr>
                <tr className="bg-black/20">
                  <td className="px-6 py-4">Tutor Integration</td>
                  <td className="px-6 py-4">24/7 Context-Aware AI</td>
                  <td className="px-6 py-4 text-gray-500">None</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Study Material Generation</td>
                  <td className="px-6 py-4">Instant Flashcards & Quizzes</td>
                  <td className="px-6 py-4 text-gray-500">None</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </FadeInUp>
      
      <FadeInUp delay={300}>
        <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-1">Trusted & Secure</h3>
            <p className="text-sm text-gray-400">
              StudyOS uses bank-grade encryption to protect your data. All AI features are governed by our strict Educational Integrity Policy, designed in consultation with cognitive science educators to ensure it serves as a learning aid, not an academic shortcut.
            </p>
          </div>
        </div>
      </FadeInUp>
    </section>
  );
};

const Feature1 = () => {
  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto w-full">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <FadeInUp>
          <div>
            <div className="text-yellow-400 text-sm font-medium mb-4">✨ AI Tutor</div>
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 leading-tight">
              Imagine having a 24/7 expert tutor.
            </h2>
            <p className="text-gray-400 text-base mb-8">
              An AI assistant that has deep context on every single note, PDF, and class you've ever taken. Ask any question and get perfectly tailored explanations.
            </p>
            <Link to="/login" className="bg-white text-black px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors inline-block">
              Get started
            </Link>
          </div>
        </FadeInUp>

        <FadeInUp delay={200}>
          <div className="rounded-3xl overflow-hidden p-8 border border-white/10 relative h-[500px] flex items-end">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 object-cover w-full h-full -z-10"
            >
              <source src="https://cdn.sceneai.art/Hero%20Section%20Video/1bcc8fa3-37f6-4c53-8591-0347e4c7f8ac.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/20 -z-10" />

            <div className="bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-full shadow-2xl">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                <span className="px-3 py-1.5 bg-white/5 rounded-full text-xs text-gray-300 whitespace-nowrap">Explain limits</span>
                <span className="px-3 py-1.5 bg-white/5 rounded-full text-xs text-gray-300 whitespace-nowrap">Summarize chapter 4</span>
                <span className="px-3 py-1.5 bg-white/5 rounded-full text-xs text-gray-300 whitespace-nowrap">Quiz me on mitosis</span>
              </div>
              <div className="flex items-center bg-black/50 border border-white/5 rounded-xl px-4 py-3">
                <span className="text-gray-400 text-sm flex-1">Ask anything...</span>
                <div className="flex items-center gap-3 text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                  <div className="w-px h-4 bg-white/10"></div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
};

const Feature2 = () => {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto w-full">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <FadeInUp delay={200}>
          <div className="rounded-3xl overflow-hidden p-8 border border-white/10 relative h-[500px] flex items-center justify-center order-2 lg:order-1">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 object-cover w-full h-full -z-10"
            >
              <source src="https://cdn.sceneai.art/Hero%20Section%20Video/736fd4a0-70ac-4f44-9633-55769ead6aca.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/20 -z-10" />

            <div className="bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <button className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center pl-1 hover:scale-105 transition-transform">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </button>
                <div>
                  <div className="text-white text-sm font-medium">11:06 AM – Chris</div>
                  <div className="flex gap-1 mt-2 items-end h-4">
                    {[4, 8, 12, 16, 12, 8, 14, 10, 6, 4].map((h, i) => (
                      <div key={i} className="w-1 bg-white/40 rounded-full" style={{ height: `${h}px` }}></div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                "I have a calc midterm on Friday, three physics worksheets due tomorrow, and I need to start my history essay. Can you build a schedule for me?"
              </p>
            </div>
          </div>
        </FadeInUp>

        <FadeInUp order-1 lg:order-2>
          <div className="order-1 lg:order-2">
            <div className="text-green-400 text-sm font-medium mb-4">✨ Auto-Planner</div>
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 leading-tight">
              Never miss a deadline again.
            </h2>
            <p className="text-gray-400 text-base mb-8">
              Manage your assignments, tests, and homework with an intelligent AI that automatically plans out your daily study schedule based on your syllabus.
            </p>
            <Link to="/login" className="bg-white text-black px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors inline-block">
              Get started
            </Link>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
};

const FAQ = () => {
  const faqs = [
    { q: "Is it really free?", a: "Yes! StudyOS offers a generous free tier that never expires. You can upgrade to a premium plan later for more AI usage limits if you need them." },
    { q: "Can it read my handwritten notes?", a: "Yes, our AI is trained on advanced OCR technology and can accurately transcribe and understand messy handwritten notes, diagrams, and photos of whiteboards." },
    { q: "How does the AI tutor work?", a: "When you upload your notes or syllabus, StudyOS creates a localized knowledge graph. When you ask the tutor a question, it references your specific class materials to answer it." },
    { q: "Does it work on my phone?", a: "Yes! StudyOS is a fully responsive progressive web app that feels native on iOS and Android. You can study on the bus, in bed, or at your desk." },
    { q: "What subjects does it support?", a: "StudyOS supports virtually all subjects. Because the AI learns from the notes and PDFs you provide, it adapts perfectly to anything from AP Biology to Graduate level Law." },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 px-6 max-w-3xl mx-auto w-full">
      <FadeInUp>
        <h2 className="text-4xl md:text-5xl font-semibold mb-12 text-center tracking-tight">We've got answers</h2>
        <div className="border border-white/10 rounded-xl bg-transparent overflow-hidden">
          {faqs.map((faq, idx) => (
            <div key={idx} className={`${idx !== faqs.length - 1 ? 'border-b border-white/10' : ''}`}>
              <button
                className="w-full text-left py-6 px-6 flex items-center justify-between focus:outline-none"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className="text-base text-white font-medium">{faq.q}</span>
                <span className={`text-white transition-transform duration-300 flex-shrink-0 ${openIndex === idx ? 'rotate-45' : 'rotate-0'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              <div 
                className="grid transition-all duration-300 ease-in-out"
                style={{ gridTemplateRows: openIndex === idx ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="text-gray-400 text-sm pb-6 px-6">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </FadeInUp>
    </section>
  );
};

const Footer = () => {
  return (
    <footer id="contact" className="relative z-0 pt-32 pb-10 px-6 border-t border-white/5 w-full">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 object-cover w-full h-full opacity-40 -z-10"
      >
        <source src="https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black -z-10" />

      <FadeInUp>
        <div className="text-center mb-32">
          <h2 className="text-4xl md:text-5xl font-semibold mb-8">
            Ready to stop <span className="font-serif italic font-normal">stressing?</span>
          </h2>
          <div className="flex flex-row items-center justify-center gap-4">
            <Link to="/login" className="bg-white text-black px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors inline-block">
              Get started
            </Link>
            <a href="#features" className="bg-[#1F1F22] text-white px-6 py-3 rounded-full text-sm font-medium border border-white/5 hover:bg-[#2A2A2D] transition-colors inline-block">
              Learn more
            </a>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp delay={200}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-24">
            <div className="col-span-1">
              <div className="flex items-center gap-2 text-white mb-4">
                <Brain className="w-6 h-6" />
                <span className="text-xl font-bold tracking-tight">StudyOS</span>
              </div>
              <p className="text-sm text-gray-400">Study smarter, not harder.</p>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-white font-medium mb-1">Product</span>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">About</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Changelog</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-white font-medium mb-1">Legal</span>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of service</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy policy</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">404</a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-white font-medium mb-1">Connect</span>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Instagram</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">YouTube</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Twitter / X</a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-xs text-gray-500 border-t border-white/5 pt-8">
            <p>
              © 2026 StudyOS. All rights reserved <span className="mx-1">•</span> by <span className="text-gray-300">Re-text</span> <span className="mx-1">•</span> Made in <span className="text-gray-300">Gemini</span>
            </p>
            <p className="hidden md:block">|</p>
            <p>
              Last updated: September 2026
            </p>
          </div>
        </div>
      </FadeInUp>
    </footer>
  );
};

export default function Landing() {
  return (
    <div className="bg-black text-white min-h-screen font-sans overflow-x-hidden selection:bg-white/20 selection:text-white">
      <Helmet>
        <title>AI Study Planner & Homework Tracker | StudyOS</title>
        <meta name="description" content="Transform your grades with StudyOS, the ultimate AI study planner & homework tracker. Upload notes, generate flashcards, and ace your exams. Try it free!" />
      </Helmet>
      <style dangerouslySetInnerHTML={{
        __html: `
          html { scroll-behavior: smooth; }
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
          /* Hide scrollbar for chips container */
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
        `
      }} />
      <Navbar />
      <main>
        <Hero />
        <SEOBlocks />
        <Feature1 />
        <Feature2 />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
