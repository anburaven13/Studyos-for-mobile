import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-20 py-12 bg-background relative z-50">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4 font-bold text-xl">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary">
              <g transform="rotate(-30 12 12)">
                <circle cx="7.3" cy="3.2" r="1.45" />
                <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <circle cx="16.7" cy="20.8" r="1.45" />
              </g>
            </svg>
            Study<span className="text-muted-foreground font-normal">OS</span>
          </Link>
          <p className="text-muted-foreground text-sm max-w-sm">
            The ultimate AI student planner. Train AI tutors on your notes, generate flashcards, and organize your academic life.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/#top" className="hover:text-primary transition-colors">Features</Link></li>
            <li><Link to="/login" className="hover:text-primary transition-colors">Sign Up</Link></li>
            <li><Link to="/login" className="hover:text-primary transition-colors">Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            <li><Link to="/support" className="hover:text-primary transition-colors">Contact Support</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} StudyOS. All rights reserved.
      </div>
    </footer>
  );
}
