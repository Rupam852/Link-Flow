import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, X, Check, AlertCircle, Send, Users, Trash2 } from 'lucide-react';

interface EmailCaptureWidgetProps {
  username: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonStyle?: string;
}

// Public-facing widget shown on the live profile page
export function EmailCaptureWidget({ username, buttonColor, buttonTextColor, buttonStyle }: EmailCaptureWidgetProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const getBorderRadius = () => {
    switch (buttonStyle) {
      case 'pill': return 'rounded-full';
      case 'sharp': return 'rounded-none';
      case 'glass': return 'rounded-2xl';
      default: return 'rounded-xl';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(`/api/profiles/${username}/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Connection failed. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30"
      >
        <Check size={16} className="text-emerald-400 shrink-0" />
        <span className="text-sm font-semibold text-emerald-300">You're subscribed! 🎉</span>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
          placeholder="Enter your email..."
          className="flex-1 min-w-0 px-4 py-2.5 text-sm rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 backdrop-blur-sm"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`shrink-0 px-4 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-60 flex items-center gap-1.5 ${getBorderRadius()}`}
          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
        >
          {status === 'loading' ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-[11px] text-red-400 flex items-center gap-1">
          <AlertCircle size={11} /> {errorMsg}
        </p>
      )}
    </form>
  );
}

// Editor panel component - shows subscriber count and export
interface EmailEditorPanelProps {
  username: string;
  authToken?: string;
  getAuthToken?: () => Promise<string>;
}

export function EmailEditorPanel({ username, authToken, getAuthToken }: EmailEditorPanelProps) {
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const resolveToken = async () => {
    if (getAuthToken) {
      try {
        return await getAuthToken();
      } catch (err) {
        console.warn('Failed to resolve auth token:', err);
      }
    }
    return authToken || '';
  };

  const loadSubscribers = async () => {
    setIsLoading(true);
    try {
      const token = await resolveToken();
      const res = await fetch(`/api/profiles/${username}/subscribers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
        setIsLoaded(true);
      }
    } catch (e) {
      console.error('Failed to load subscribers:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (email: string) => {
    try {
      const token = await resolveToken();
      const res = await fetch(`/api/profiles/${username}/subscribers/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSubscribers(prev => prev.filter(e => e !== email));
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
    setDeleteConfirm(null);
  };

  const handleExportCSV = () => {
    const csvContent = 'Email\n' + subscribers.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}-subscribers.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users size={15} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {isLoaded ? `${subscribers.length} Subscriber${subscribers.length !== 1 ? 's' : ''}` : 'Email Subscribers'}
            </p>
            <p className="text-[11px] text-slate-400">Collect emails from your visitors</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoaded && subscribers.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-all"
            >
              Export CSV
            </button>
          )}
          <button
            onClick={loadSubscribers}
            disabled={isLoading}
            className="px-3 py-1.5 text-[11px] font-bold text-indigo-300 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/10 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : isLoaded ? 'Refresh' : 'View List'}
          </button>
        </div>
      </div>

      {isLoaded && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {subscribers.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No subscribers yet. Share your profile to start collecting emails!</p>
          ) : (
            subscribers.map((email) => (
              <div key={email} className="flex items-center justify-between px-3 py-2 bg-slate-950/40 rounded-xl border border-white/5">
                <span className="text-xs text-slate-300 font-mono truncate flex-1">{email}</span>
                {deleteConfirm === email ? (
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => handleDelete(email)}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 px-2 py-0.5 rounded-md hover:bg-red-500/10 transition-all"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(email)}
                    className="shrink-0 ml-2 p-1 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
