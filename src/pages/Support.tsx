import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageCircle, HelpCircle, ArrowLeft } from 'lucide-react';

export default function Support() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center p-4 border-b border-border bg-card sticky top-0 z-10 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold ml-2">Support</h1>
      </header>

      <main className="flex-grow p-4 pb-12 overflow-y-auto">
        <div className="text-center mb-8 mt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">How can we help?</h2>
          <p className="text-muted-foreground text-sm">
            Our support team is here to assist you with any questions or issues.
          </p>
        </div>

        <div className="space-y-4">
          {/* Email Support Card */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold mb-2">Email Support</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Send us an email anytime. We typically respond within 24-48 hours.
            </p>
            <a 
              href="mailto:studyos.notification@gmail.com" 
              className="bg-primary text-primary-foreground font-medium py-3 px-4 rounded-lg hover:opacity-90 transition-opacity w-full text-sm"
            >
              studyos.notification@gmail.com
            </a>
          </div>

          {/* FAQ Card */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold mb-2">Check the FAQ</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Find quick answers to the most common questions about StudyOS.
            </p>
            <button 
              onClick={() => navigate('/faq')}
              className="bg-muted text-foreground font-medium py-3 px-4 rounded-lg hover:bg-muted/80 transition-colors w-full border border-border text-sm"
            >
              Browse FAQs
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
