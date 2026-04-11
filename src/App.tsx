import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Settings, 
  Eye, 
  Edit3, 
  Github, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Globe, 
  Save,
  User,
  Layout,
  Palette,
  LogOut,
  LogIn,
  Sparkles,
  Check,
  Share2,
  Copy
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';

interface Link {
  title: string;
  url: string;
  icon: string;
}

interface Profile {
  username: string;
  uid: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  links: Link[];
  theme: {
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
  };
}

const DEFAULT_PROFILE: Profile = {
  username: '',
  uid: '',
  email: '',
  displayName: '',
  bio: '',
  avatarUrl: 'https://picsum.photos/seed/avatar/200/200',
  links: [
    { title: 'My Portfolio', url: 'https://example.com', icon: 'globe' },
    { title: 'GitHub', url: 'https://github.com', icon: 'github' },
    { title: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
  ],
  theme: {
    backgroundColor: '#0f172a',
    textColor: '#f8fafc',
    buttonColor: '#334155',
    buttonTextColor: '#f8fafc',
  }
};

const ICON_MAP: Record<string, any> = {
  github: Github,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  globe: Globe,
};

const TEMPLATES = [
  {
    name: 'Midnight',
    theme: {
      backgroundColor: '#0f172a',
      textColor: '#f8fafc',
      buttonColor: '#334155',
      buttonTextColor: '#f8fafc',
    }
  },
  {
    name: 'Sunset',
    theme: {
      backgroundColor: '#fff7ed',
      textColor: '#9a3412',
      buttonColor: '#f97316',
      buttonTextColor: '#ffffff',
    }
  },
  {
    name: 'Forest',
    theme: {
      backgroundColor: '#f0fdf4',
      textColor: '#166534',
      buttonColor: '#22c55e',
      buttonTextColor: '#ffffff',
    }
  },
  {
    name: 'Cyberpunk',
    theme: {
      backgroundColor: '#000000',
      textColor: '#00ff00',
      buttonColor: '#ff00ff',
      buttonTextColor: '#ffffff',
    }
  },
  {
    name: 'Minimal',
    theme: {
      backgroundColor: '#ffffff',
      textColor: '#18181b',
      buttonColor: '#18181b',
      buttonTextColor: '#ffffff',
    }
  },
  {
    name: 'Lavender',
    theme: {
      backgroundColor: '#faf5ff',
      textColor: '#6b21a8',
      buttonColor: '#a855f7',
      buttonTextColor: '#ffffff',
    }
  }
];

export default function App() {
  const [view, setView] = useState<'preview' | 'edit' | 'public'>('edit');
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const fetchProfile = async (id: string, isUid: boolean = false) => {
    setIsFetching(true);
    try {
      const endpoint = isUid ? `/api/profiles/uid/${id}` : `/api/profiles/${id}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Fetch profile failed:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/linkflow/${profile.username}`;
    navigator.clipboard.writeText(url);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Avatar generation removed - user manages avatar manually



  useEffect(() => {
    // Handle public profile routing
    const path = window.location.pathname;
    if (path.startsWith('/linkflow/')) {
      const username = path.split('/linkflow/')[1];
      if (username) {
        setView('public');
        fetchProfile(username);
      }
    } else if (path.startsWith('/u/')) {
      const username = path.split('/u/')[1];
      if (username) {
        setView('public');
        fetchProfile(username);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        if (!window.location.pathname.startsWith('/linkflow/')) {
          fetchProfile(currentUser.uid, true);
        } else {
          setIsFetching(false);
        }
        // Immediately ensure UID is in state for new users
        setProfile(prev => ({ ...prev, uid: currentUser.uid }));
      } else {
        setIsFetching(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-populate profile with Google data if empty
  useEffect(() => {
    if (user && (!profile.uid || !profile.displayName)) {
      setProfile(prev => ({
        ...prev,
        uid: user.uid,
        username: prev.username || user.uid,
        email: prev.email || user.email || '',
        displayName: prev.displayName || user.displayName || '',
        avatarUrl: (prev.avatarUrl === DEFAULT_PROFILE.avatarUrl || !prev.avatarUrl) 
          ? user.photoURL || prev.avatarUrl 
          : prev.avatarUrl,
        bio: prev.bio || ''
      }));
    }
  }, [user, profile.displayName]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setProfile(prev => ({ 
          ...prev, 
          uid: result.user.uid,
          username: prev.username || result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          avatarUrl: result.user.photoURL || prev.avatarUrl,
          bio: '' // Ensure bio is empty as requested
        }));
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setIsSavedSuccessfully(false);
    try {
      // Ensure we have a UID from state or active user
      const targetUid = profile.uid || user?.uid;
      
      if (!targetUid) {
        setSaveError("User session not found. Please log in again.");
        return;
      }

      // Automatically generate a username if it's currently a UID or empty
      let currentUsername = profile.username;
      const isUid = currentUsername && /^[A-Za-z0-9]{20,}$/.test(currentUsername); // Simple heuristic for Firebase UID
      
      if (!currentUsername || isUid) {
        const slug = profile.displayName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
          
        if (slug) {
          currentUsername = slug;
        }
      }

      // Sanitize profile: Remove MongoDB internal fields before sending
      const { _id, __v, ...pureProfileData } = profile as any;
      const updatedProfile = { ...pureProfileData, uid: targetUid, username: currentUsername };
      
      // Use the final UID for the request
      const res = await fetch(`/api/profiles/uid/${targetUid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });

      let saveSuccess = false;

      if (res.status === 409) {
        // Handle case where NEW generated username is taken
        const uniqueUsername = `${currentUsername}-${Math.random().toString(36).substring(2, 5)}`;
        const finalProfile = { ...updatedProfile, username: uniqueUsername };
        
        const retryRes = await fetch(`/api/profiles/uid/${targetUid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalProfile),
        });
        
        if (retryRes.ok) {
          setProfile(finalProfile);
          saveSuccess = true;
        } else {
          setSaveError("An error occurred while creating your unique link.");
          return;
        }
      } else if (res.ok) {
        setProfile(updatedProfile);
        saveSuccess = true;
      }
      
      if (saveSuccess) {
        setIsSavedSuccessfully(true);
        setShowSaveToast(true);
        // Silently refresh profile to ensure state is binary-perfect with DB
        fetchProfile(targetUid, true);
        // Clear success state after 3 seconds
        setTimeout(() => {
          setIsSavedSuccessfully(false);
          setShowSaveToast(false);
        }, 3000);
      } else if (res.status !== 409) {
        // Only show generic error if it wasn't a handled 409 conflict
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error || errorData.details || "Failed to save profile. Please try again.";
        setSaveError(msg);
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 5000);
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      const msg = err.message || "Failed to save profile. Please check your connection.";
      setSaveError(msg);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  if (view === 'public') {
    return (
      <div 
        className="min-h-screen w-full overflow-y-auto p-6 flex items-center justify-center"
        style={{ backgroundColor: profile.theme.backgroundColor, color: profile.theme.textColor }}
      >
        <div className="w-full max-w-md text-center py-12">
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={profile.avatarUrl} 
            alt="Avatar" 
            className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white/10 object-cover shadow-xl"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-3xl font-bold mb-1">{profile.displayName}</h1>
          <p className="text-sm opacity-60 mb-6 tracking-wide font-medium">@{profile.username}</p>
          <p className="text-lg opacity-80 mb-12 max-w-sm mx-auto whitespace-pre-wrap">
            {profile.bio || "No bio yet."}
          </p>

          <div className="space-y-4">
            {profile.links.map((link, idx) => {
              const Icon = ICON_MAP[link.icon] || Globe;
              return (
                <motion.a
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full p-5 rounded-2xl font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between group shadow-lg"
                  style={{ backgroundColor: profile.theme.buttonColor, color: profile.theme.buttonTextColor }}
                >
                  <div className="flex items-center gap-4">
                    <Icon size={24} />
                    {link.title}
                  </div>
                  <ExternalLink size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.a>
              );
            })}
          </div>

          <div className="mt-20 pt-12 border-t border-white/10">
            <div className="flex justify-center gap-6 opacity-60 mb-6">
              {profile.links.slice(0, 5).map((link, idx) => {
                const Icon = ICON_MAP[link.icon] || Globe;
                return <Icon key={idx} size={24} />;
              })}
            </div>
            <p className="text-xs uppercase tracking-[0.2em] opacity-40 font-bold">Powered by LinkFlow</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">L</div>
          <span className="font-bold text-lg sm:text-xl tracking-tight hidden sm:block">LinkFlow</span>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-full">
          <button 
            onClick={() => setView('edit')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              view === 'edit' 
                ? 'bg-white shadow-md text-indigo-600 scale-100' 
                : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50 hover:scale-105'
            }`}
          >
            <Edit3 size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Editor</span>
          </button>
          <button 
            onClick={() => setView('preview')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              view === 'preview' 
                ? 'bg-white shadow-md text-indigo-600 scale-100' 
                : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50 hover:scale-105'
            }`}
          >
            <Eye size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex flex-col items-end gap-0.5 mr-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Public Link</span>
            <a 
              href={`/linkflow/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
            >
              linkflow.me/{profile.username || '...'}
              <ExternalLink size={10} className="group-hover:scale-110 transition-transform" />
            </a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user && (
              <button 
                onClick={handleCopyLink}
                className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 active:scale-95"
              >
                {isCopying ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
                <span>{isCopying ? 'Copied!' : 'Share'}</span>
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={isSaving || !user}
              className={`${
                isSavedSuccessfully ? 'bg-green-600' : 'bg-indigo-600'
              } text-white px-3 py-2 rounded-lg text-xs font-medium hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:translate-y-0 min-w-[80px] justify-center active:scale-95`}
            >
              {isSavedSuccessfully ? (
                <>
                  <Check size={14} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save size={14} className={isSaving ? 'animate-pulse' : ''} />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </>
              )}
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-slate-200 shrink-0" />
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 p-2 active:scale-90"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium text-xs sm:text-sm"
            >
              <LogIn size={18} /> <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Mobile Actions Menu (Visible only on small screens) */}
          <div className="md:hidden flex items-center gap-1">
            {user && (
              <>
                <button 
                  onClick={handleCopyLink}
                  className="p-2 text-slate-600 hover:text-indigo-600"
                  title="Share Profile"
                >
                  {isCopying ? <Check size={18} className="text-green-600" /> : <Share2 size={18} />}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`p-2 transition-colors ${isSavedSuccessfully ? 'text-green-600' : 'text-indigo-600'} hover:opacity-80 disabled:opacity-50`}
                  title="Save Changes"
                >
                  {isSavedSuccessfully ? <Check size={18} /> : <Save size={18} className={isSaving ? 'animate-pulse' : ''} />}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Editor */}
        <div className={`space-y-8 ${view === 'preview' ? 'hidden md:block' : 'block'}`}>
          {!user ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">Sign in to edit</h2>
              <p className="text-slate-500 mb-6">You need to be logged in to customize and save your LinkFlow profile.</p>
              <button 
                onClick={handleLogin}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 mx-auto"
              >
                <LogIn size={20} /> Sign in with Google
              </button>
            </div>
          ) : (
            <div className="relative">
              {isFetching && (
                <div className="absolute inset-x-0 -inset-y-2 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-100 shadow-2xl shadow-indigo-500/10">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-base font-bold text-indigo-900 tracking-tight animate-pulse text-center px-4">
                    Syncing your latest changes...
                  </p>
                  <p className="text-xs text-indigo-500 mt-1 font-medium italic">Just a moment while we fetch your profile</p>
                </div>
              )}
              
              <div className={`space-y-8 transition-all duration-300 ${isFetching ? 'opacity-20 pointer-events-none scale-[0.98] blur-[2px]' : 'opacity-100'}`}>
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Palette className="text-indigo-600" size={20} />
                    <h2 className="text-lg font-semibold">Templates</h2>
                  </div>
                  
                  <div className="space-y-6">

                  {/* Preset Templates */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Preset Templates</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.name}
                          onClick={() => setProfile({...profile, theme: tpl.theme})}
                          className="group relative flex flex-col items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                        >
                          <div 
                            className="w-full aspect-video rounded-lg shadow-sm flex flex-col gap-1 p-1.5"
                            style={{ backgroundColor: tpl.theme.backgroundColor }}
                          >
                            <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: tpl.theme.buttonColor }} />
                            <div className="w-2/3 h-1.5 rounded-full" style={{ backgroundColor: tpl.theme.buttonColor }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{tpl.name}</span>
                          {JSON.stringify(profile.theme) === JSON.stringify(tpl.theme) && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                              <Check size={10} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <User className="text-indigo-600" size={20} />
                    <h2 className="text-lg font-semibold">Profile Info</h2>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <input 
                        type="file" 
                        id="avatar-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <label 
                        htmlFor="avatar-upload"
                        className="block cursor-pointer relative"
                      >
                        <img 
                          src={profile.avatarUrl} 
                          alt="Avatar" 
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 hover:border-indigo-300 transition-all"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
                        </div>
                      </label>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                        disabled={true}
                        className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 text-slate-300 cursor-not-allowed"
                        title="Avatar management disabled"
                        style={{display: 'none'}}
                      >
                        <Sparkles size={14} />
                      </button>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Display Name</label>
                        <input 
                          type="text" 
                          value={profile.displayName}
                          onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Your Name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Link Name (@username)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                          <input 
                            type="text" 
                            value={profile.username}
                            onChange={(e) => {
                              const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                              setProfile({...profile, username: val});
                            }}
                            className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                            placeholder="your-link-name"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 italic">Public Link: linkflow.me/{profile.username}</p>
                      </div>

                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Bio</label>
                    </div>
                    <textarea 
                      value={profile.bio}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
                    />
                  </div>
                </div>
              </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Layout className="text-indigo-600" size={20} />
                <h2 className="text-lg font-semibold">Links</h2>
              </div>
              <button 
                onClick={() => setProfile({...profile, links: [...profile.links, { title: 'New Link', url: '', icon: 'globe' }]})}
                className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Real-time Link Preview (Icon-only) */}
              {profile.links.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full mb-1">Quick Preview</span>
                  {profile.links.map((link, idx) => {
                    const Icon = ICON_MAP[link.icon] || Globe;
                    return (
                      <div 
                        key={idx} 
                        className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: profile.theme.buttonColor, color: profile.theme.buttonTextColor }}
                        title={link.title}
                      >
                        <Icon size={16} />
                      </div>
                    );
                  })}
                </div>
              )}

              {profile.links.map((link, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 group"
                >
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-3">
                      <input 
                        type="text" 
                        value={link.title}
                        placeholder="Link Title"
                        onChange={(e) => {
                          const newLinks = [...profile.links];
                          newLinks[idx].title = e.target.value;
                          setProfile({...profile, links: newLinks});
                        }}
                        className="w-full bg-transparent font-medium focus:outline-none"
                      />
                      <div className="relative">
                        <input 
                          type="text" 
                          value={link.url}
                          placeholder="URL (https://...)"
                          onChange={(e) => {
                            const newLinks = [...profile.links];
                            newLinks[idx].url = e.target.value;
                            setProfile({...profile, links: newLinks});
                          }}
                          className={`w-full bg-transparent text-sm focus:outline-none transition-colors ${
                            link.url && !/^https?:\/\//.test(link.url) 
                              ? 'text-red-500 placeholder:text-red-300' 
                              : 'text-slate-500'
                          }`}
                        />
                        {link.url && !/^https?:\/\//.test(link.url) && (
                          <p className="text-[10px] text-red-500 mt-1 font-medium animate-pulse">
                            URL must start with http:// or https://
                          </p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const newLinks = profile.links.filter((_, i) => i !== idx);
                        setProfile({...profile, links: newLinks});
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold">Appearance</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Background</label>
                <input 
                  type="color" 
                  value={profile.theme.backgroundColor}
                  onChange={(e) => setProfile({...profile, theme: {...profile.theme, backgroundColor: e.target.value}})}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Text Color</label>
                <input 
                  type="color" 
                  value={profile.theme.textColor}
                  onChange={(e) => setProfile({...profile, theme: {...profile.theme, textColor: e.target.value}})}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Button Color</label>
                <input 
                  type="color" 
                  value={profile.theme.buttonColor}
                  onChange={(e) => setProfile({...profile, theme: {...profile.theme, buttonColor: e.target.value}})}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Button Text</label>
                <input 
                  type="color" 
                  value={profile.theme.buttonTextColor}
                  onChange={(e) => setProfile({...profile, theme: {...profile.theme, buttonTextColor: e.target.value}})}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    )}
  </div>

        {/* Right Column: Live Preview */}
        <div className={`md:sticky md:top-24 h-[calc(100vh-8rem)] flex items-center justify-center ${view === 'edit' ? 'hidden md:flex' : 'flex'}`}>
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/19] bg-white rounded-[2.5rem] sm:rounded-[3rem] border-[6px] sm:border-[8px] border-slate-900 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10"></div>
            
            <div 
              className="w-full h-full overflow-y-auto p-6 pt-12 text-center"
              style={{ backgroundColor: profile.theme.backgroundColor, color: profile.theme.textColor }}
            >
              <motion.img 
                key={profile.avatarUrl}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={profile.avatarUrl} 
                alt="Avatar" 
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white/10 object-cover"
                referrerPolicy="no-referrer"
              />
              <h1 className="text-xl font-bold mb-1">{profile.displayName}</h1>
              <p className="text-sm opacity-80 mb-8 whitespace-pre-wrap" style={{ color: profile.theme.textColor }}>
                {profile.bio || "Your bio will appear here..."}
              </p>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {profile.links.map((link, idx) => {
                    const Icon = ICON_MAP[link.icon] || Globe;
                    return (
                      <motion.a
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full p-4 rounded-xl font-medium text-sm transition-transform active:scale-95 flex items-center justify-between group"
                        style={{ backgroundColor: profile.theme.buttonColor, color: profile.theme.buttonTextColor }}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} />
                          {link.title}
                        </div>
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.a>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex justify-center gap-4 opacity-60">
                  {profile.links.slice(0, 5).map((link, idx) => {
                    const Icon = ICON_MAP[link.icon] || Globe;
                    return <Icon key={idx} size={20} />;
                  })}
                </div>
                <p className="text-[10px] mt-4 uppercase tracking-widest opacity-40">Powered by LinkFlow</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Save Success Toast */}
      {showSaveToast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
        >
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check size={14} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">Profile Saved!</span>
            <span className="text-[10px] text-slate-400">Your public link is live and updated.</span>
          </div>
        </motion.div>
      )}
      {/* Error Toast */}
      {showErrorToast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-red-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-500/20"
        >
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <AlertCircle size={14} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">Save Failed</span>
            <span className="text-[10px] text-red-200">{saveError}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

