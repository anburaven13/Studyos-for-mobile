import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, CheckCircle, Clock, LayoutList, PenTool, MessageSquare, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';

export default function ExamWorkspace() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [activeTab, setActiveTab] = useState('syllabus');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: "Hi! I'm your Exam Coach. Based on your profile, you need to focus on Electricity today. Should we start with a quick concept review or practice questions?" }
  ]);
  const [syllabusData, setSyllabusData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [subjectInput, setSubjectInput] = useState('Science');
  const [syllabusText, setSyllabusText] = useState('');

  const fetchSyllabus = async (subject: string) => {
    try {
      const res = await fetch(`/api/exam-mode/syllabi?board=${user?.board || 'CBSE'}&class_level=${user?.class_level || 'Class 10'}&academic_year=2026-2027&subject=${subject}`, {
        headers: { 'Authorization': `Bearer ${token || ''}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSyllabusData(data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchSyllabus(subjectInput);
  }, [user?.board, user?.class_level]);

  const handleSyncSyllabus = async () => {
    if (!syllabusText.trim()) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/exam-mode/syllabi/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          board: user?.board || 'CBSE',
          class_level: user?.class_level || 'Class 10',
          academic_year: '2026-2027',
          subject: subjectInput,
          source_text: syllabusText
        })
      });
      if (res.ok) {
        await fetchSyllabus(subjectInput);
        setSyllabusText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setChatHistory([...chatHistory, { role: 'user', text: message }]);
    setMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        text: "I recommend we start by reviewing Ohm's Law. Here is a quick breakdown..." 
      }]);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
      {/* LEFT PANE: Content & Progress */}
      <div className="flex-1 flex flex-col bg-card border rounded-2xl shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/app/exams')} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <input 
                type="text" 
                defaultValue="Science Board Examination"
                className="font-bold bg-transparent outline-none border-none border-b border-transparent hover:border-border focus:border-primary px-1 -ml-1 transition-colors"
              />
              <p className="text-xs text-muted-foreground">{user?.class_level || 'Class 10'} • {user?.board || 'CBSE'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
            <Clock className="w-4 h-4" /> 
            <input 
              type="date" 
              className="bg-transparent outline-none border-none text-primary font-semibold cursor-pointer"
              defaultValue={new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 border-b overflow-x-auto hide-scrollbar">
          {['syllabus', 'progress', 'practice', 'notes'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'syllabus' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2"><LayoutList className="w-4 h-4" /> Official Syllabus</h3>
                <span className="text-xs bg-muted px-2 py-1 rounded font-medium">78% Covered</span>
              </div>
              
              {syllabusData?.chapters?.length > 0 ? (
                <div className="space-y-3">
                  {syllabusData.chapters.map((chapter: any) => (
                    <div key={chapter.id} className="border rounded-xl p-3">
                      <div className="font-semibold mb-2">{chapter.name}</div>
                      <div className="space-y-2 pl-4 border-l-2 border-muted">
                        {chapter.topics.map((topic: any) => (
                          <div key={topic.id} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {topic.name}</span>
                            <span className="text-muted-foreground text-xs">0% Mastery</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-xl p-6 text-center space-y-4 bg-muted/20">
                  <Book className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                  <div>
                    <h4 className="font-semibold">No Syllabus Found</h4>
                    <p className="text-sm text-muted-foreground">Paste your syllabus text below and AI will generate the chapter structure automatically.</p>
                  </div>
                  <div className="max-w-md mx-auto space-y-3">
                    <input 
                      type="text" 
                      value={subjectInput}
                      onChange={e => setSubjectInput(e.target.value)}
                      placeholder="Subject Name (e.g., Science)"
                      className="w-full bg-background border rounded-lg px-3 py-2 text-sm"
                    />
                    <textarea 
                      value={syllabusText}
                      onChange={e => setSyllabusText(e.target.value)}
                      placeholder="Paste syllabus text here..."
                      className="w-full bg-background border rounded-lg px-3 py-2 text-sm h-32 resize-none"
                    />
                    <button 
                      onClick={handleSyncSyllabus}
                      disabled={isSyncing || !syllabusText.trim()}
                      className="w-full bg-primary text-primary-foreground font-semibold rounded-lg px-4 py-2 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSyncing ? 'Syncing...' : 'Generate Syllabus with AI'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab !== 'syllabus' && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <PenTool className="w-12 h-12 mb-4 opacity-20" />
              <p>This tab is currently under construction.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: AI Coach */}
      <div className="w-full md:w-96 flex flex-col bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-primary/5 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Exam Coach</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-muted rounded-tl-sm"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-3 border-t bg-muted/20">
          <form onSubmit={handleSendMessage} className="relative">
            <input 
              type="text" 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Ask anything..." 
              className="w-full bg-background border rounded-xl pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <button 
              type="submit"
              disabled={!message.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary disabled:opacity-50 hover:bg-primary/10 rounded-md transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
      
    </div>
  );
}
