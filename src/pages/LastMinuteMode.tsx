import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function LastMinuteMode() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [exam, setExam] = useState<any>(null);
  const [examDate, setExamDate] = useState('');
  
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [setupPhase, setSetupPhase] = useState<'confirm' | 'analyze' | 'ready'>('confirm');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchExam = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/exams', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const target = data.find((e: any) => e.id === Number(examId));
          if (target) {
            setExam(target);
            setExamDate(target.date);
          }
        }
      } catch(e) {}
    };
    fetchExam();
  }, [examId, token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [chatHistory]);

  const startAnalysis = async () => {
    setSetupPhase('analyze');
    
    setChatHistory([
      { role: 'assistant', text: `Welcome to Last Minute Mode for ${exam.name}. \n\nI see you're in ${user?.class_level} (${user?.board}). I will act as your emergency tutor and fetch the relevant syllabus topics to calculate a crash course based on the time you have left before ${examDate}.\n\nTo help me perfectly tailor this plan, tell me: **What topics do you already know well, and which ones are you completely lost on?**` }
    ]);
    
    setSetupPhase('ready');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    const userMsg = message;
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/last-minute/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          examName: exam.name,
          examDate: examDate,
          board: user?.board,
          classLevel: user?.class_level,
          history: chatHistory.concat({ role: 'user', text: userMsg })
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', text: "Error: " + data.error }]);
      }
    } catch(err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: "Network error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!exam) return <div className="p-8 text-center flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-destructive border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="h-[calc(100vh-4rem)] max-w-5xl mx-auto p-4 md:p-8 flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/app/exams')} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-destructive"><AlertTriangle className="w-6 h-6" /> Last Minute Mode</h1>
          <p className="text-muted-foreground font-medium">{exam.name}</p>
        </div>
      </div>

      {setupPhase === 'confirm' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-card border rounded-2xl p-8 max-w-md w-full text-center shadow-lg border-destructive/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-destructive"></div>
            <Sparkles className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Emergency Study Plan</h2>
            <p className="text-muted-foreground mb-6 text-sm">We'll fetch the syllabus for {user?.board} {user?.class_level} and calculate a crash course based on the time you have left.</p>
            
            <div className="text-left mb-6">
              <label className="block text-sm font-semibold mb-2">Confirm Exam Date:</label>
              <input 
                type="date" 
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="w-full bg-background border rounded-lg px-4 py-2 focus:border-destructive outline-none"
              />
            </div>
            
            <button 
              onClick={startAnalysis}
              className="w-full bg-destructive text-destructive-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Start Last Minute Mode <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {setupPhase === 'ready' && (
        <div className="flex-1 bg-card border rounded-2xl flex flex-col overflow-hidden shadow-sm relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-destructive"></div>
           
           <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
             <div className="flex items-center gap-2 font-semibold">
               <Sparkles className="w-5 h-5 text-destructive" /> AI Crash Course Tutor
             </div>
             <div className="text-xs bg-destructive/10 text-destructive px-3 py-1 rounded-full font-bold flex items-center gap-1">
               <Clock className="w-3 h-3" /> Target Date: {examDate}
             </div>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-6">
             {chatHistory.map((msg, idx) => (
               <div key={idx} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                 <div className={cn(
                   "max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed",
                   msg.role === 'user' 
                     ? "bg-primary text-primary-foreground rounded-tr-sm" 
                     : "bg-muted rounded-tl-sm prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-border"
                 )}>
                   {msg.role === 'user' ? (
                     <span className="whitespace-pre-wrap">{msg.text}</span>
                   ) : (
                     <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                       {msg.text}
                     </Markdown>
                   )}
                 </div>
               </div>
             ))}
             {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-muted rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-muted-foreground animate-pulse">
                   Thinking...
                 </div>
               </div>
             )}
             <div ref={messagesEndRef} />
           </div>

           <div className="p-4 border-t bg-background">
             <form onSubmit={handleSendMessage} className="relative">
               <input 
                 type="text"
                 value={message}
                 onChange={e => setMessage(e.target.value)}
                 disabled={isLoading}
                 placeholder="Tell me what you struggle with, or ask a question..."
                 className="w-full bg-muted/50 border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-destructive transition-colors disabled:opacity-50"
               />
               <button 
                 type="submit"
                 disabled={!message.trim() || isLoading}
                 className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-destructive text-destructive-foreground rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
               >
                 <Send className="w-4 h-4" />
               </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
