import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Sparkles, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [tempToken, setTempToken] = useState('');
  
  const [showForgot, setShowForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const { syncUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let firebaseUser;
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = userCred.user;
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCred.user;
      }
      
      const token = await firebaseUser.getIdToken();
      // Sync with our Postgres database
      const pgData = await syncUser(token);
      
      if (pgData.requires2FA) {
        setTempToken(token);
        setShow2FA(true);
        return;
      }
      
      // If it's a new registration or missing class info, go to onboarding
      if (!isLogin || !pgData.user?.class_level) {
        navigate('/onboarding');
      } else {
        navigate('/app');
      }
    } catch (err: any) {
      // Clean up Firebase error messages nicely
      let errorMessage = err.message || 'Authentication failed';
      if (errorMessage.includes('auth/invalid-credential')) {
        errorMessage = 'Invalid email or password. If you had an account before today, please click "Sign up" to re-register it with our new secure login system.';
      } else if (errorMessage.includes('auth/email-already-in-use')) {
        errorMessage = 'An account with this email already exists. Please log in.';
      } else if (errorMessage.includes('auth/user-not-found')) {
        errorMessage = 'No account found with this email. Please sign up.';
      } else if (errorMessage.includes('auth/wrong-password')) {
        errorMessage = 'Incorrect password.';
      } else {
        errorMessage = errorMessage.replace('Firebase: ', '').replace(/\(auth.*\)/, '').trim();
        if (errorMessage === 'Error .') errorMessage = 'Authentication failed. Please check your credentials.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ token: twoFACode })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify 2FA code');
      
      // Sync again to fetch user data and get past the 2FA block
      const pgData = await syncUser(tempToken);
      
      setShow2FA(false);
      if (!pgData.user?.class_level) {
        navigate('/onboarding');
      } else {
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Ensure the email is valid.');
    } finally {
      setLoading(false);
    }
  };

  if (show2FA) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md border rounded-2xl bg-card shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Two-Factor Authentication</h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Enter the 6-digit code from your authenticator app
          </p>
          
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg mb-4 border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">6-Digit Code</label>
              <input 
                type="text" 
                required
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                className="w-full bg-muted/50 border focus:border-primary rounded-lg px-4 py-2.5 outline-none transition-colors tracking-widest text-center text-lg"
                placeholder="000000"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || twoFACode.length < 6}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verify</span>}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShow2FA(false);
                auth.signOut();
              }}
              className="w-full text-muted-foreground py-2 text-sm hover:text-foreground"
            >
              Cancel Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (showForgot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md border rounded-2xl bg-card shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Reset Password</h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Enter your email to receive a password reset link
          </p>
          
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg mb-4 border border-destructive/20">
              {error}
            </div>
          )}

          {resetSent ? (
            <div className="text-center">
              <div className="p-3 bg-green-500/10 text-green-500 text-sm rounded-lg mb-6 border border-green-500/20">
                Password reset email sent! Check your inbox.
              </div>
              <button 
                onClick={() => {
                  setShowForgot(false);
                  setResetSent(false);
                }}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted/50 border focus:border-primary rounded-lg px-4 py-2.5 outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Send Reset Link</span>}
              </button>
              <button 
                type="button" 
                onClick={() => setShowForgot(false)}
                className="w-full text-muted-foreground py-2 text-sm hover:text-foreground"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md border rounded-2xl bg-card shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          {isLogin ? 'Enter your details to access your workspace' : 'Sign up to start organizing your studies'}
        </p>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg mb-4 border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-muted/50 border focus:border-primary rounded-lg px-4 py-2.5 outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Password</label>
              {isLogin && (
                <button 
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-muted/50 border focus:border-primary rounded-lg px-4 py-2.5 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-primary font-medium hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
