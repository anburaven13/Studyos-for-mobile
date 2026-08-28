import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Plus, X, Trash, Upload, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ExamHub() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const fetchExams = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/exams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      // Filter for future exams and sort by date
      const futureExams = subjects
        .map(sub => ({ ...sub, dateObj: new Date(sub.date) }))
        .filter(sub => sub.dateObj > now)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

      if (futureExams.length === 0) {
        return { days: 0, hours: 0, minutes: 0 };
      }

      const nextExam = futureExams[0].dateObj;
      const diff = nextExam.getTime() - now.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      
      return { days, hours, minutes };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(timer);
  }, [subjects]);

  const deleteExam = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`/api/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSubjects(subjects.filter(sub => sub.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSliderChange = async (index: number, value: number) => {
    const newSubjects = [...subjects];
    newSubjects[index].confidence = value;
    setSubjects(newSubjects);

    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`/api/exams/${subjects[index].id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ confidence: value })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newExamName, date: newExamDate, confidence: 50 })
      });
      if (res.ok) {
        setNewExamName('');
        setNewExamDate('');
        setIsModalOpen(false);
        fetchExams();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setIsExtracting(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const res = await fetch('/api/exams/extract', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ imageBase64: base64String })
        });

        if (res.ok) {
          const extractedExams = await res.json();
          // For each extracted exam, create it
          for (const exam of extractedExams) {
            if (exam.name && exam.date) {
              await fetch('/api/exams', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ name: exam.name, date: exam.date, confidence: 50 })
              });
            }
          }
          fetchExams();
          setIsModalOpen(false);
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("Failed to extract exams from image:", errData);
          alert(errData.error || "Failed to extract exams from the image. Please try again or add manually.");
        }
        setIsExtracting(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsExtracting(false);
    }
  };

  const getConfidenceColor = (val: number) => {
    if (val < 40) return 'bg-destructive text-destructive-foreground';
    if (val < 70) return 'bg-amber-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  const getConfidenceBarColor = (val: number) => {
    if (val < 40) return 'bg-destructive';
    if (val < 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full h-[calc(100vh-4rem)] flex flex-col relative">
      <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Exam Hub</h1>
          <p className="text-muted-foreground mt-1">Track your progress and pinpoint weak spots.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center space-x-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Countdown */}
        <div className="lg:col-span-3 border rounded-2xl bg-card shadow-sm p-8 flex flex-col items-center justify-center text-center py-16">
          <Target className="w-16 h-16 text-muted-foreground/30 mb-4" />
          {subjects.length === 0 ? (
            <>
              <h2 className="text-xl font-semibold mb-2">No Upcoming Exams</h2>
              <p className="text-muted-foreground">Add exams to your calendar to track them here.</p>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">Next Exam Countdown</h2>
              <div className="flex items-center justify-center space-x-4 md:space-x-6 text-center">
                <div>
                  <div className="text-6xl font-bold tracking-tighter tabular-nums">{timeLeft.days}</div>
                  <div className="text-sm text-muted-foreground mt-2 font-medium">DAYS</div>
                </div>
                <div className="text-4xl text-muted-foreground/30 font-light mb-8">:</div>
                <div>
                  <div className="text-6xl font-bold tracking-tighter tabular-nums">{timeLeft.hours}</div>
                  <div className="text-sm text-muted-foreground mt-2 font-medium">HOURS</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Confidence Meter */}
        <div className="lg:col-span-3 border rounded-2xl bg-card shadow-sm p-8">
          <div className="flex items-center space-x-2 mb-8">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Subject Confidence</h2>
          </div>
          
          <div className="space-y-8">
            {subjects.length === 0 && <p className="text-muted-foreground">No subjects added yet.</p>}
            {subjects.map((sub, i) => (
              <div key={sub.id} className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 sm:gap-0">
                  <div>
                    <p className="font-medium text-lg">{sub.name}</p>
                    <p className="text-sm text-muted-foreground">Exam on {sub.date}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={cn("px-3 py-1 rounded-md text-sm font-bold tabular-nums", getConfidenceColor(sub.confidence))}>
                      {sub.confidence}%
                    </div>
                    <button onClick={() => deleteExam(sub.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("absolute top-0 left-0 h-full transition-all duration-300", getConfidenceBarColor(sub.confidence))}
                    style={{ width: `${sub.confidence}%` }}
                  />
                </div>
                
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={sub.confidence} 
                  onChange={(e) => handleSliderChange(i, parseInt(e.target.value))}
                  className="w-full h-1 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-md border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <h2 className="text-xl font-semibold">Add New Exam</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6 space-y-3">
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors group">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isExtracting} />
                <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary transition-colors">
                  {isExtracting ? (
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 mb-2" />
                  )}
                  <span className="text-sm font-medium flex items-center gap-1">
                    {isExtracting ? 'Extracting with AI...' : (
                      <>Auto-Extract from Image <Sparkles className="w-3 h-3 text-amber-500" /></>
                    )}
                  </span>
                  <span className="text-xs opacity-70 mt-1 text-center">Upload exam timetable/schedule</span>
                </div>
              </label>
            </div>
            
            <div className="relative flex items-center py-2 mb-4">
              <div className="flex-grow border-t border-muted"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase">Or add manually</span>
              <div className="flex-grow border-t border-muted"></div>
            </div>

            <form onSubmit={handleAddExam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject Name</label>
                <input 
                  type="text" 
                  required
                  value={newExamName}
                  onChange={e => setNewExamName(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                  placeholder="e.g. Physics Midterm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  value={newExamDate}
                  onChange={e => setNewExamDate(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90">
                Save Exam
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
