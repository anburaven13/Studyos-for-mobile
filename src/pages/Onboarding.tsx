import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { GraduationCap, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const classes = ['Class 10', 'Class 11', 'Class 12'];
const boards = ['CBSE', 'ICSE', 'State Board'];

export default function Onboarding() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { token, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!selectedClass || !selectedBoard) return;
    setLoading(true);

    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ class_level: selectedClass, board: selectedBoard })
      });

      if (res.ok) {
        updateUser({ class_level: selectedClass, board: selectedBoard });
        navigate('/app');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl border rounded-2xl bg-card shadow-lg p-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">Personalize Your Workspace</h1>
        <p className="text-muted-foreground text-center mb-10">
          Tell us a bit about your studies so we can customize your AI tools and templates.
        </p>

        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Select your Grade</h2>
            <div className="grid grid-cols-3 gap-4">
              {classes.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={cn(
                    "p-4 rounded-xl border text-center font-medium transition-all duration-200",
                    selectedClass === c 
                      ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20" 
                      : "hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Select your Board</h2>
            <div className="grid grid-cols-3 gap-4">
              {boards.map(b => (
                <button
                  key={b}
                  onClick={() => setSelectedBoard(b)}
                  className={cn(
                    "p-4 rounded-xl border text-center font-medium transition-all duration-200",
                    selectedBoard === b 
                      ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20" 
                      : "hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={!selectedClass || !selectedBoard || loading}
          className="w-full mt-12 bg-primary text-primary-foreground py-3.5 rounded-xl font-medium text-lg flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Complete Setup</span>}
        </button>
      </div>
    </div>
  );
}
