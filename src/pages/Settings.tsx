import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Settings as SettingsIcon, User, Bell, Download, Globe, Puzzle, MonitorPlay, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function Settings() {
  const { user, token, logout, syncUser } = useAuth();
  
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secretText, setSecretText] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading2FA, setLoading2FA] = useState(false);
  const [error2FA, setError2FA] = useState('');

  const handleSetup2FA = async () => {
    setLoading2FA(true);
    setError2FA('');
    setShow2FAModal(true);
    
    try {
      const res = await fetch('/api/2fa/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setQrCode(data.qrCodeUrl);
      setSecretText(data.secret);
    } catch (err: any) {
      setError2FA(err.message || 'Failed to generate 2FA secret');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleVerifySetup2FA = async () => {
    setLoading2FA(true);
    setError2FA('');
    try {
      const res = await fetch('/api/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: verifyCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      await syncUser(token!); // Refresh user to get updated is_2fa_enabled
      setShow2FAModal(false);
    } catch (err: any) {
      setError2FA(err.message || 'Invalid code');
    } finally {
      setLoading2FA(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-8 animate-fade-in">
      <Helmet>
        <title>Settings - StudyOS</title>
      </Helmet>

      <div className="flex items-center space-x-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-xl">
          <SettingsIcon className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your account details and preferences.
          </p>
        </div>
        
        <div className="md:col-span-2 bg-card border rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Email</label>
            <div className="text-lg font-medium">{user?.email || 'student@example.com'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Class Level</label>
            <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wider">
              {user?.class_level || 'General'}
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <h3 className="text-md font-semibold mb-4">Study Preferences & Appearance</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium">Focus Sounds</div>
                    <div className="text-sm text-muted-foreground">Play ambient noise during focus sessions</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium">Auto-start Pomodoro</div>
                    <div className="text-sm text-muted-foreground">Automatically start breaks and focus sessions</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <div>
                    <div className="font-medium">Show Study Streaks</div>
                    <div className="text-sm text-muted-foreground">Display your daily streak on the dashboard</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <div>
                    <div className="font-medium">Dark Mode</div>
                    <div className="text-sm text-muted-foreground">Toggle dark theme appearance</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-md font-semibold mb-4">Account Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive weekly study summaries</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">Secure your account with 2FA</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {user?.is_2fa_enabled && (
                    <span className="text-sm text-green-500 font-medium bg-green-500/10 px-2 py-1 rounded">Enabled</span>
                  )}
                  <button 
                    onClick={handleSetup2FA}
                    disabled={user?.is_2fa_enabled}
                    className="px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {user?.is_2fa_enabled ? 'Already Setup' : 'Setup 2FA'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button 
              onClick={logout}
              className="text-destructive hover:bg-destructive/10 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Sign out of all devices
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border/50">
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-muted-foreground" />
            Extensions
          </h2>
          <p className="text-sm text-muted-foreground">
            Supercharge your workflow with the official StudyOS Browser Extension.
          </p>
        </div>
        
        <div className="md:col-span-2 bg-gradient-to-br from-card to-muted/30 border rounded-2xl p-8 shadow-sm space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2 mb-2">
                <Globe className="w-6 h-6" />
                StudyOS Blocker & Timer
              </h3>
              <p className="text-muted-foreground max-w-md">
                A powerful Pomodoro timer, dynamic distraction blocker, and smart YouTube filter that hides non-educational videos.
              </p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MonitorPlay className="w-5 h-5" />
              Installation Tutorial
            </h4>
            <ol className="list-decimal list-inside space-y-4 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Download the extension:</strong>
                <a 
                  href="https://www.mediafire.com/file/82vzx41ee6gio95/StudyOS_Extension.zip/file" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 ml-4 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" /> Download ZIP
                </a>
              </li>
              <li><strong className="text-foreground">Extract the ZIP file</strong> to a folder on your computer.</li>
              <li>Open your browser and navigate to <code className="bg-muted px-2 py-0.5 rounded text-foreground">chrome://extensions</code> (or <code className="bg-muted px-2 py-0.5 rounded text-foreground">edge://extensions</code>).</li>
              <li>Turn on <strong className="text-foreground">Developer mode</strong> in the top right corner.</li>
              <li>Click <strong className="text-foreground">Load unpacked</strong> and select the folder you extracted in step 2.</li>
              <li><strong className="text-foreground">Pin the extension</strong> to your toolbar and start focusing!</li>
            </ol>
          </div>
        </div>
      </div>

      {show2FAModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-2xl p-6 shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-2">Set up Two-Factor Authentication</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Use Google Authenticator, Authy, or any standard TOTP app.
            </p>

            {error2FA && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg mb-4 border border-destructive/20">
                {error2FA}
              </div>
            )}

            {loading2FA && !qrCode ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center bg-white p-4 rounded-xl border">
                  {qrCode && <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />}
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Or enter this code manually:</p>
                  <code className="bg-muted px-2 py-1 rounded text-primary font-mono tracking-widest">{secretText}</code>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Verify Code</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value)}
                    className="w-full bg-muted/50 border focus:border-primary rounded-lg px-4 py-2 outline-none tracking-widest text-center text-lg"
                    placeholder="000000"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShow2FAModal(false)}
                    className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg font-medium hover:opacity-90"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleVerifySetup2FA}
                    disabled={loading2FA || verifyCode.length < 6}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium flex items-center justify-center hover:opacity-90 disabled:opacity-50"
                  >
                    {loading2FA ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Enable'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
