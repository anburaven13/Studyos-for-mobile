import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Circle, Edit, Loader2, Sparkles, X, Wand2, FileJson, Brain, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { extractRoutineFromData } from '../lib/aiService';

type Block = {
  id: string;
  title: string;
  start: string;
  end: string;
  type: string;
};

type RoutineSchedule = {
  [key: string]: Block[];
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Routines() {
  const [schedule, setSchedule] = useState<RoutineSchedule | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [workingSchedule, setWorkingSchedule] = useState<RoutineSchedule | null>(null);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importMode, setImportMode] = useState<'json' | 'ai'>('ai');
  const [aiImporting, setAiImporting] = useState(false);
  
  const [autoWake, setAutoWake] = useState('07:00');
  const [autoSleep, setAutoSleep] = useState('22:00');
  const [autoType, setAutoType] = useState('school');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentDayIndex = new Date().getDay();
  const todayName = currentDayIndex === 0 ? 'Sunday' : days[currentDayIndex - 1];

  useEffect(() => {
    const fetchRoutine = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const [schRes, progRes] = await Promise.all([
          fetch('/api/routines', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`/api/routines/progress?date=${todayStr}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (schRes.ok) setSchedule(await schRes.json());
        if (progRes.ok) setProgress(await progRes.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchRoutine();
  }, [todayStr]);

  const toggleProgress = async (blockId: string) => {
    const newProgress = { ...progress, [blockId]: !progress[blockId] };
    setProgress(newProgress);
    
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch('/api/routines/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ date: todayStr, progress: newProgress })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveRoutine = async () => {
    if (!workingSchedule) return;
    
    // Sort blocks by start time before saving
    const sorted = { ...workingSchedule };
    Object.keys(sorted).forEach(day => {
      sorted[day].sort((a, b) => a.start.localeCompare(b.start));
    });

    setSchedule(sorted);
    setIsEditMode(false);

    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ schedule: sorted })
      });

      // Sync routine school/class blocks to Planner timetable
      await fetch('/api/routines/sync-planner', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const enterEditMode = () => {
    setWorkingSchedule(schedule ? JSON.parse(JSON.stringify(schedule)) : null);
    setSelectedDay(todayName);
    setIsEditMode(true);
  };

  const addMinutes = (timeStr: string, mins: number) => {
    let [h, m] = timeStr.split(':').map(Number);
    m += mins;
    h += Math.floor(m / 60);
    m = m % 60;
    h = h % 24;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const generateRoutineLogic = (wake: string, sleep: string, type: string) => {
    let routine: Block[] = [];
    let current = wake;
    let baseId = Date.now();
    
    routine.push({ id: `gen-${baseId++}`, title: "Morning Routine & Breakfast", start: current, end: addMinutes(current, 60), type: "break" });
    current = addMinutes(current, 60);

    if (type === "school" || type === "college") {
        let schoolHours = type === "school" ? 360 : 240; 
        let schoolTitle = type === "school" ? "School" : "College Classes";
        
        routine.push({ id: `gen-${baseId++}`, title: schoolTitle, start: current, end: addMinutes(current, schoolHours), type: "school" });
        current = addMinutes(current, schoolHours);
        
        routine.push({ id: `gen-${baseId++}`, title: "Lunch & Rest", start: current, end: addMinutes(current, 60), type: "break" });
        current = addMinutes(current, 60);
        
        routine.push({ id: `gen-${baseId++}`, title: "Self Study Session 1", start: current, end: addMinutes(current, 120), type: "study" });
        current = addMinutes(current, 120);
        
        routine.push({ id: `gen-${baseId++}`, title: "Free Time / Relax", start: current, end: addMinutes(current, 90), type: "break" });
        current = addMinutes(current, 90);
        
        routine.push({ id: `gen-${baseId++}`, title: "Self Study Session 2", start: current, end: addMinutes(current, 120), type: "study" });
        current = addMinutes(current, 120);
        
        routine.push({ id: `gen-${baseId++}`, title: "Dinner", start: current, end: addMinutes(current, 60), type: "break" });
        current = addMinutes(current, 60);
        
        routine.push({ id: `gen-${baseId++}`, title: "Wind Down", start: current, end: sleep, type: "study" });
    } else {
        routine.push({ id: `gen-${baseId++}`, title: "Morning Deep Work", start: current, end: addMinutes(current, 180), type: "study" });
        current = addMinutes(current, 180);
        
        routine.push({ id: `gen-${baseId++}`, title: "Lunch & Break", start: current, end: addMinutes(current, 60), type: "break" });
        current = addMinutes(current, 60);
        
        routine.push({ id: `gen-${baseId++}`, title: "Afternoon Study", start: current, end: addMinutes(current, 180), type: "study" });
        current = addMinutes(current, 180);
        
        routine.push({ id: `gen-${baseId++}`, title: "Evening Relax", start: current, end: addMinutes(current, 90), type: "break" });
        current = addMinutes(current, 90);
        
        routine.push({ id: `gen-${baseId++}`, title: "Evening Study", start: current, end: addMinutes(current, 120), type: "study" });
        current = addMinutes(current, 120);
        
        routine.push({ id: `gen-${baseId++}`, title: "Dinner", start: current, end: addMinutes(current, 60), type: "break" });
        current = addMinutes(current, 60);
        
        routine.push({ id: `gen-${baseId++}`, title: "Wind Down", start: current, end: sleep, type: "study" });
    }
    
    routine.push({ id: `gen-${baseId++}`, title: "Sleep", start: sleep, end: wake, type: "sleep" });
    return routine;
  };

  const handleAutoGenerate = () => {
    const generated = generateRoutineLogic(autoWake, autoSleep, autoType);
    if (!workingSchedule) return;
    
    const newSchedule = { ...workingSchedule };
    days.forEach(day => {
      newSchedule[day] = JSON.parse(JSON.stringify(generated));
    });
    setWorkingSchedule(newSchedule);
    setIsAutoModalOpen(false);
  };

  const handleImport = () => {
    try {
      setImportError('');
      const parsed = JSON.parse(importText);
      let extractedSchedule = null;
      
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].schedule) {
        extractedSchedule = parsed[0].schedule;
      } else if (parsed.schedule) {
        extractedSchedule = parsed.schedule;
      } else {
        extractedSchedule = parsed;
      }

      if (!extractedSchedule || typeof extractedSchedule !== 'object' || !days.some(day => extractedSchedule[day])) {
        throw new Error('Invalid schedule format');
      }

      const newSchedule = { ...workingSchedule };
      days.forEach(day => {
        newSchedule[day] = extractedSchedule[day] || [];
      });

      setWorkingSchedule(newSchedule);
      setIsImportModalOpen(false);
      setImportText('');
    } catch (e) {
      setImportError('Invalid JSON or schedule format. Please check your data.');
    }
  };

  const handleAiExtract = async () => {
    if (!importText.trim()) {
      setImportError('Please paste some data first.');
      return;
    }
    setImportError('');
    setAiImporting(true);
    try {
      const result = await extractRoutineFromData(importText);
      if (result && result.schedule) {
        const newSchedule = { ...workingSchedule };
        days.forEach(day => {
          newSchedule[day] = result.schedule[day] || [];
        });
        setWorkingSchedule(newSchedule);
        setIsImportModalOpen(false);
        setImportText('');
        setImportMode('ai');
      } else {
        setImportError('AI could not extract a routine. Try providing more detail.');
      }
    } catch (error: any) {
      setImportError(error.message || 'Failed to extract routine. Please try again.');
    } finally {
      setAiImporting(false);
    }
  };

  if (!schedule) {
    return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'school': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'study': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'class': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'break': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'sleep': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full h-[calc(100vh-4rem)] flex flex-col relative">
      <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Daily Routines</h1>
          <p className="text-muted-foreground mt-1">Structure your days for maximum productivity.</p>
        </div>
        {!isEditMode ? (
          <button 
            onClick={enterEditMode}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center space-x-2 hover:opacity-90 transition-opacity"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Weekly Routine</span>
          </button>
        ) : (
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => { setImportMode('ai'); setIsImportModalOpen(true); }}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center space-x-2 hover:opacity-90 transition-opacity shadow-md"
            >
              <Wand2 className="w-4 h-4" />
              <span>AI Import</span>
            </button>
            <button 
              onClick={() => setIsAutoModalOpen(true)}
              className="bg-amber-500 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center space-x-2 hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              <span>Auto-Generate</span>
            </button>
            <button 
              onClick={() => setIsEditMode(false)}
              className="bg-muted text-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Cancel
            </button>
            <button 
              onClick={saveRoutine}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {!isEditMode ? (
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Today's Routine ({todayName})</h2>
          </div>
          
          <div className="space-y-3">
            {schedule[todayName]?.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
                No routine set for today. Click "Edit Weekly Routine" to get started.
              </div>
            ) : (
              schedule[todayName]?.map(block => {
                const isChecked = progress[block.id];
                return (
                  <div key={block.id} className={cn(
                    "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-4 rounded-xl border transition-all duration-300",
                    isChecked ? "bg-muted/30 opacity-60" : "bg-card shadow-sm hover:shadow-md"
                  )}>
                    <div className="flex items-center space-x-4">
                      <button onClick={() => toggleProgress(block.id)} className={isChecked ? "text-primary" : "text-muted-foreground hover:text-primary"}>
                        {isChecked ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>
                      <div>
                        <p className={cn("font-medium", isChecked && "line-through")}>{block.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatTime(block.start)} - {formatTime(block.end)}</p>
                      </div>
                    </div>
                    <div className={cn("px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border", getTypeColor(block.type))}>
                      {block.type}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 shrink-0">
            {days.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedDay === day ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {workingSchedule?.[selectedDay]?.map((block, index) => (
              <div key={index} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border bg-card">
                <input 
                  type="text" 
                  value={block.title}
                  onChange={(e) => {
                    const newSch = { ...workingSchedule };
                    newSch[selectedDay][index].title = e.target.value;
                    setWorkingSchedule(newSch);
                  }}
                  className="flex-1 p-2 rounded-md border bg-background text-sm"
                  placeholder="Activity Title"
                />
                <input 
                  type="time" 
                  value={block.start}
                  onChange={(e) => {
                    const newSch = { ...workingSchedule };
                    newSch[selectedDay][index].start = e.target.value;
                    setWorkingSchedule(newSch);
                  }}
                  className="w-28 p-2 rounded-md border bg-background text-sm"
                />
                <input 
                  type="time" 
                  value={block.end}
                  onChange={(e) => {
                    const newSch = { ...workingSchedule };
                    newSch[selectedDay][index].end = e.target.value;
                    setWorkingSchedule(newSch);
                  }}
                  className="w-28 p-2 rounded-md border bg-background text-sm"
                />
                <select 
                  value={block.type}
                  onChange={(e) => {
                    const newSch = { ...workingSchedule };
                    newSch[selectedDay][index].type = e.target.value;
                    setWorkingSchedule(newSch);
                  }}
                  className="w-32 p-2 rounded-md border bg-background text-sm"
                >
                  <option value="school">School/College</option>
                  <option value="study">Deep Study</option>
                  <option value="class">Tuition</option>
                  <option value="break">Break/Chill</option>
                  <option value="sleep">Sleep</option>
                </select>
                <button 
                  onClick={() => {
                    const newSch = { ...workingSchedule };
                    newSch[selectedDay].splice(index, 1);
                    setWorkingSchedule(newSch);
                  }}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button 
              onClick={() => {
                const newSch = { ...workingSchedule! };
                newSch[selectedDay].push({
                  id: `custom-${Date.now()}`,
                  title: "New Activity",
                  start: "12:00",
                  end: "13:00",
                  type: "study"
                });
                setWorkingSchedule(newSch);
              }}
              className="w-full p-3 rounded-xl border border-dashed border-primary/50 text-primary font-medium hover:bg-primary/5 transition-colors flex items-center justify-center"
            >
              + Add Time Block
            </button>
          </div>
        </div>
      )}

      {isAutoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-md border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div className="flex items-center space-x-2 text-amber-500">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-xl font-semibold text-foreground">Auto-Generate Routine</h2>
              </div>
              <button onClick={() => setIsAutoModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                This will automatically generate an optimized routine for your entire week based on your wake and sleep times. This will replace your current schedule.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Wake up at</label>
                  <input type="time" value={autoWake} onChange={e=>setAutoWake(e.target.value)} className="w-full p-2 rounded-md border bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sleep at</label>
                  <input type="time" value={autoSleep} onChange={e=>setAutoSleep(e.target.value)} className="w-full p-2 rounded-md border bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Primary Daytime Activity</label>
                <select value={autoType} onChange={e=>setAutoType(e.target.value)} className="w-full p-2 rounded-md border bg-background">
                  <option value="school">School (6 hours)</option>
                  <option value="college">College (4 hours)</option>
                  <option value="study">Self Study (No Classes)</option>
                </select>
              </div>
              <button onClick={handleAutoGenerate} className="w-full bg-amber-500 text-white py-2 rounded-md font-medium hover:opacity-90 mt-4">
                Generate My Week
              </button>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-lg border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 p-1.5 rounded-lg">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Smart Import</h2>
              </div>
              <button onClick={() => { setIsImportModalOpen(false); setImportError(''); setImportText(''); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex rounded-lg bg-muted p-1 mb-4">
              <button
                onClick={() => { setImportMode('ai'); setImportError(''); }}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-medium transition-all",
                  importMode === 'ai' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Brain className="w-4 h-4" />
                <span>AI Extract</span>
              </button>
              <button
                onClick={() => { setImportMode('json'); setImportError(''); }}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-medium transition-all",
                  importMode === 'json' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileJson className="w-4 h-4" />
                <span>Direct JSON</span>
              </button>
            </div>

            <div className="space-y-4">
              {importMode === 'ai' ? (
                <>
                  <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                    <p className="text-sm text-violet-700 dark:text-violet-300">
                      Paste <strong>anything</strong> — SQL dumps, JSON, CSV, or even plain text like <em>"I go to school from 8-2, study 4-6pm"</em>. AI will figure out the routine.
                    </p>
                  </div>
                  <textarea 
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    disabled={aiImporting}
                    className="w-full h-48 p-3 rounded-md border bg-background font-mono text-xs focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50"
                    placeholder={`Paste anything here...\n\nExamples:\n• SQL: SELECT * FROM routines WHERE user_id = '...'\n• JSON: [{"schedule": {"Monday": [...]}}]\n• Text: "School 8am-2pm, Lunch 2-3pm, Study 3-5pm"`}
                  />
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Paste a valid JSON object with the exact routine schedule format.
                  </p>
                  <textarea 
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    className="w-full h-48 p-3 rounded-md border bg-background font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder='{"Monday": [{"id": "mon-1", "title": "Study", "start": "09:00", "end": "11:00", "type": "study"}], ...}'
                  />
                </>
              )}

              {importError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <p className="text-sm text-destructive font-medium">{importError}</p>
                </div>
              )}

              {importMode === 'ai' ? (
                <button 
                  onClick={handleAiExtract} 
                  disabled={aiImporting || !importText.trim()}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white py-2.5 rounded-md font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md"
                >
                  {aiImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI is extracting your routine...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Extract with AI</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={handleImport} 
                  disabled={!importText.trim()}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply JSON Data
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
