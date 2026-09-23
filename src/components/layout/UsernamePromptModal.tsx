import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { motion } from 'motion/react';
import { AtSign, Loader2, ArrowRight, User } from 'lucide-react';

export default function UsernamePromptModal() {
  const { user, token, updateUser } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only show if user is logged in and DOES NOT have a username
  if (!user || user.username) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Only letters, numbers, and underscores allowed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user/username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: username.toLowerCase() })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim username');
      }

      // Update local state instantly so the modal closes
      updateUser({ username: data.username });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-card border border-border p-8 rounded-3xl shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
            <User className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-3xl font-bold mb-2 text-card-foreground">Pick a Username</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            We just launched messaging! Claim your unique username to start chatting with friends.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <AtSign className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="superstudent99"
                  disabled={loading}
                  className="w-full bg-background border border-input rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 text-foreground"
                  autoFocus
                />
              </div>
              {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || username.length < 3}
              className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Claim Username</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
