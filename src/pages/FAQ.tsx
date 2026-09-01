import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

const faqs = [
  {
    question: "Is StudyOS free to use?",
    answer: "Yes! You can sign up and start using StudyOS for free. We offer a generous free tier that allows you to manage your homework and try out our AI tutor."
  },
  {
    question: "How does the AI Note-Taker work?",
    answer: "You can upload your PDFs, paste text, or even snap a photo of your textbook. Our AI instantly reads the content, summarizes it, and can automatically generate flashcards and quizzes for you to study."
  },
  {
    question: "Can I use StudyOS on my phone?",
    answer: "Absolutely! StudyOS is designed to work perfectly on your phone's browser, and we also offer a dedicated mobile app experience so you can study on the go."
  },
  {
    question: "Is my data secure?",
    answer: "We take your privacy very seriously. Your notes, files, and personal data are encrypted and securely stored. We never sell your data to third parties."
  },
  {
    question: "What is 'Knowledge DNA'?",
    answer: "Knowledge DNA is our unique analytics system. As you study and take quizzes, StudyOS tracks which topics you are struggling with and builds a visual 'DNA' profile. This allows the AI to automatically schedule review sessions focused exactly on your weakest subjects."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center p-4 border-b border-border bg-card sticky top-0 z-10 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold ml-2">FAQ</h1>
      </header>

      <main className="flex-grow p-4 pb-12 overflow-y-auto">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="border border-border bg-card rounded-xl overflow-hidden transition-all duration-200"
            >
              <button
                className="w-full px-5 py-4 flex items-center justify-between text-left font-semibold hover:bg-muted/30 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span>{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-5 pb-5 pt-2 text-muted-foreground text-sm leading-relaxed border-t border-border/50">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-muted-foreground mb-4 text-sm">Still have questions?</p>
          <button onClick={() => navigate('/support')} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Contact Support
          </button>
        </div>
      </main>
    </div>
  );
}
