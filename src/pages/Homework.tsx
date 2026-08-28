import React, { useState, useEffect } from 'react';
import { Plus, Check, Circle, Sparkles, Loader2, X, Trash } from 'lucide-react';
import { simulateAiResponse } from '../lib/aiService';
import { Helmet } from 'react-helmet-async';

type Task = {
  id: string;
  title: string;
  due_date: string;
  subject: string;
  completed: boolean;
  aiEstimate?: string;
};

export default function Homework() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [estimatingId, setEstimatingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const fetchTasks = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/homework', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`/api/homework/${id}/toggle`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ completed: !task.completed })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTask = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`/api/homework/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title: newTaskTitle, subject: newTaskSubject, due_date: newTaskDate })
      });
      if (res.ok) {
        setNewTaskTitle('');
        setNewTaskSubject('');
        setNewTaskDate('');
        setIsModalOpen(false);
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const estimateTask = async (id: string) => {
    setEstimatingId(id);
    const task = tasks.find(t => t.id === id);
    if (task) {
      const response = await simulateAiResponse(`Estimate how long it will take to complete this task: "${task.title}" for subject "${task.subject}". Return ONLY a string like "1.5 hours" or "45 mins". Do not explain.`);
      setTasks(tasks.map(t => t.id === id ? { ...t, aiEstimate: response.trim() } : t));
    }
    setEstimatingId(null);
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full h-[calc(100vh-4rem)] flex flex-col relative">
      <Helmet>
        <title>Homework | StudyOS</title>
      </Helmet>
      
      <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Homework</h1>
          <p className="text-muted-foreground mt-1">Manage your assignments and deadlines.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center space-x-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      <div className="space-y-8 flex-1 overflow-y-auto">
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">To Do ({activeTasks.length})</h2>
          <div className="space-y-2">
            {activeTasks.map(task => (
              <div key={task.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors gap-4 sm:gap-0">
                <div className="flex items-center space-x-4">
                  <button onClick={() => toggleTask(task.id)} className="text-muted-foreground hover:text-primary transition-colors">
                    <Circle className="w-5 h-5" />
                  </button>
                  <div>
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs font-medium text-primary/80 px-2 py-0.5 rounded bg-primary/10">{task.subject}</span>
                      <span className="text-xs text-muted-foreground">{task.due_date}</span>
                      {task.aiEstimate ? (
                        <span className="text-xs flex items-center text-primary/70 bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {task.aiEstimate}
                        </span>
                      ) : (
                        <button 
                          onClick={() => estimateTask(task.id)}
                          disabled={estimatingId === task.id}
                          className="text-xs flex items-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                        >
                          {estimatingId === task.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                          AI Estimate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            ))}
            {activeTasks.length === 0 && (
              <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
                You're all caught up!
              </div>
            )}
          </div>
        </section>

        {completedTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Completed ({completedTasks.length})</h2>
            <div className="space-y-2">
              {completedTasks.map(task => (
                <div key={task.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border bg-muted/20 opacity-70 gap-4 sm:gap-0">
                  <div className="flex items-center space-x-4">
                    <button onClick={() => toggleTask(task.id)} className="text-primary">
                      <Check className="w-5 h-5" />
                    </button>
                    <div>
                      <p className="font-medium text-sm line-through text-muted-foreground">{task.title}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs font-medium text-primary/50 px-2 py-0.5 rounded bg-primary/5">{task.subject}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-md border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <h2 className="text-xl font-semibold">Add Assignment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Task Title</label>
                <input 
                  type="text" 
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                  placeholder="e.g. Chapter 4 Reading"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input 
                    type="text" 
                    required
                    value={newTaskSubject}
                    onChange={e => setNewTaskSubject(e.target.value)}
                    className="w-full p-2 rounded-md border bg-background"
                    placeholder="e.g. History"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input 
                    type="date" 
                    required
                    value={newTaskDate}
                    onChange={e => setNewTaskDate(e.target.value)}
                    className="w-full p-2 rounded-md border bg-background"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90">
                Save Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
