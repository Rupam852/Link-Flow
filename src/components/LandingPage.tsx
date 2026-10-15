import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Check, 
  Globe, 
  Github, 
  Twitter, 
  Instagram,
  Zap, 
  Palette, 
  Layout, 
  Eye,
  ChevronDown, 
  ExternalLink,
  Shield,
  ArrowRight,
  MousePointerClick,
  AlertCircle,
  X
} from 'lucide-react';
import ThemeToggleButton from './ThemeToggleButton';
import { useThemeMode } from '../context/ThemeContext';

interface LandingPageProps {
  onLogin: () => void;
  loginError?: string;
  clearLoginError?: () => void;
}

const PRESET_THEMES = [
  {
    name: 'Midnight Purple',
    backgroundColor: '#0f172a',
    textColor: '#f8fafc',
    buttonColor: '#6366f1',
    buttonTextColor: '#ffffff',
    bio: 'Digital artist & backend engineer based in Seattle. Creating premium user experiences.',
    bgStyle: 'bg-slate-900'
  },
  {
    name: 'Cyberpunk Neon',
    backgroundColor: '#000000',
    textColor: '#39ff14',
    buttonColor: '#ff007f',
    buttonTextColor: '#ffffff',
    bio: 'Systems architect. Cyber security researcher. Coding in the neon rain.',
    bgStyle: 'bg-black'
  },
  {
    name: 'Warm Sunset',
    backgroundColor: '#fff7ed',
    textColor: '#9a3412',
    buttonColor: '#f97316',
    buttonTextColor: '#ffffff',
    bio: 'Travel blogger and lifestyle photographer. Wandering the world one sunset at a time.',
    bgStyle: 'bg-orange-50'
  },
  {
    name: 'Forest Moss',
    backgroundColor: '#062f17',
    textColor: '#f0fdf4',
    buttonColor: '#22c55e',
    buttonTextColor: '#052e16',
    bio: 'Environmentalist, botanist & nature storyteller sharing daily field discoveries.',
    bgStyle: 'bg-emerald-950'
  }
];

const FEATURES = [
  {
    title: 'Instant Drag & Drop Reordering',
    description: 'Long-press and smoothly drag your links into the exact hierarchy you want with tactile haptic feedback and auto-scrolling.',
    icon: Layout,
    color: 'from-blue-500 to-indigo-500'
  },
  {
    title: 'Direct Multimedia Embeds',
    description: 'Embed YouTube videos, Spotify playlists, and audio tracks directly on your page without sending followers elsewhere.',
    icon: Zap,
    color: 'from-amber-500 to-orange-500'
  },
  {
    title: 'Custom Themes & Wallpapers',
    description: 'Personalize every detail with 20+ preset aesthetics, hex color pickers, custom button styles, and HD background image cropping.',
    icon: Palette,
    color: 'from-pink-500 to-rose-500'
  },
  {
    title: 'Real-Time Click Analytics',
    description: 'Track aggregate visitor views, individual link clicks, and engagement percentages in real-time right inside your dashboard.',
    icon: MousePointerClick,
    color: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'AI Bio & Copy Generator',
    description: 'Supercharge your personal brand statement with instant Gemini-powered creative bios tailored to your niche and profession.',
    icon: Sparkles,
    color: 'from-purple-500 to-indigo-500'
  },
  {
    title: 'High-Res Branded QR Codes',
    description: 'Generate stunning, scannable QR posters with custom finder eyes, color palettes, and embedded LinkFlow emblem for print and social sharing.',
    icon: Eye,
    color: 'from-cyan-500 to-blue-500'
  }
];

const FAQS = [
  {
    question: 'Is LinkFlow completely free to use?',
    answer: 'Yes! LinkFlow provides full customization, unlimited link creation, real-time analytics, multimedia embeds, and custom background images 100% free with no hidden charges or subscription paywalls.'
  },
  {
    question: 'How do I claim my custom username?',
    answer: 'Simply type your desired handle into the username field on this page or sign in with your Google Account. If available, your profile URL (e.g. linkflow.me/yourname) is reserved instantly.'
  },
  {
    question: 'Can I embed YouTube videos or Spotify music?',
    answer: 'Yes! Simply toggle the Multimedia switch on any link card in your dashboard, paste the URL, and select whether you want an interactive player or a compact audio bar.'
  },
  {
    question: 'Can I switch between Light and Dark mode?',
    answer: 'Yes! Both the Landing Page and your User Dashboard support clean Light Mode and Dark Mode toggling anytime via the sun/moon icon in the header.'
  },
  {
    question: 'Does the smart link detector work with any website?',
    answer: 'Yes! The detector automatically recognizes popular websites like GitHub, Twitter/X, Instagram, LinkedIn, YouTube, Facebook, WhatsApp, Telegram, and Discord, styling them with their corresponding high-quality brand icon. For other sites, it displays a beautiful default global network icon.'
  }
];

export default function LandingPage({ onLogin, loginError, clearLoginError }: LandingPageProps) {
  const { isDark } = useThemeMode();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [activeThemeIdx, setActiveThemeIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTheme = PRESET_THEMES[activeThemeIdx];

  // Real-time username availability check with 600ms debounce
  useEffect(() => {
    const trimmed = username.trim();

    // Reset if too short or invalid
    if (!trimmed || trimmed.length < 3 || !/^[a-z0-9-]+$/.test(trimmed)) {
      setUsernameStatus('idle');
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      return;
    }

    setUsernameStatus('checking');

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profiles/${trimmed}`);
        if (res.status === 404) {
          setUsernameStatus('available');
        } else if (res.ok) {
          setUsernameStatus('taken');
        } else {
          setUsernameStatus('idle');
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 600);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [username]);

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      setError('Please enter a username to claim your link.');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, and hyphens.');
      return;
    }

    if (usernameStatus === 'taken') {
      setError('This username is already taken. Please choose another.');
      return;
    }

    if (usernameStatus === 'checking') {
      setError('Please wait while we check username availability...');
      return;
    }

    // Save proposed username to session storage and trigger login directly
    sessionStorage.setItem('claimedUsername', trimmedUsername);
    onLogin();
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  return (
    <div className={`relative min-h-screen font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white transition-colors duration-300 ${
      isDark ? 'bg-[#090d16] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      {/* Decorative Radial Background Glows clipped inside a full-bleed wrapper */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full blur-[150px] transition-colors duration-500 ${
          isDark ? 'bg-indigo-900/20' : 'bg-indigo-300/35'
        }`} />
        <div className={`absolute top-[40%] right-[-10%] w-[50%] aspect-square rounded-full blur-[150px] transition-colors duration-500 ${
          isDark ? 'bg-purple-900/15' : 'bg-purple-300/30'
        }`} />
        <div className={`absolute bottom-[-10%] left-[20%] w-[55%] aspect-square rounded-full blur-[150px] transition-colors duration-500 ${
          isDark ? 'bg-blue-900/20' : 'bg-sky-300/35'
        }`} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className={`absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none transition-opacity ${
        isDark ? 'opacity-40' : 'opacity-25 invert'
      }`} />

      {/* Header */}
      <header className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.png"
            alt="LinkFlow Logo"
            className="w-9 h-9 rounded-xl shadow-lg border border-white/10 hover:rotate-6 transition-all duration-300 object-cover"
          />
          <span className={`font-extrabold text-xl tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${
            isDark ? 'from-white via-slate-200 to-slate-400' : 'from-slate-950 via-slate-800 to-indigo-700'
          }`}>LinkFlow</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <a href="#features" className={`text-sm font-medium transition-colors hidden sm:inline-block ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}>Features</a>
          <a href="#demo" className={`text-sm font-medium transition-colors hidden sm:inline-block ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}>Themes</a>
          <a href="#faq" className={`text-sm font-medium transition-colors hidden sm:inline-block ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}>FAQs</a>
          
          {/* Light / Dark Mode Toggle Button */}
          <ThemeToggleButton />

          <button 
            onClick={onLogin}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white' 
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10'
            }`}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 px-6 max-w-7xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Main Title */}
          <h1 className={`text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            One Link to{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent font-black">
              Flow Them All
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Consolidate your social channels, showcase your portfolio, and collect your audience in one beautifully customized, high-converting bio link. Fast, modern, and free forever.
          </p>

          {/* Claim Username Form */}
          <div className="max-w-md mx-auto pt-6">
            <form onSubmit={handleClaim} className={`flex flex-col sm:flex-row gap-2.5 sm:gap-3 p-0 sm:p-2 rounded-2xl sm:border backdrop-blur-md transition-all sm:shadow-2xl ${
              isDark
                ? `bg-transparent sm:bg-slate-900/50 ${
                    usernameStatus === 'available' ? 'sm:border-emerald-500/50' :
                    usernameStatus === 'taken'     ? 'sm:border-red-500/50' :
                    'sm:border-white/10 focus-within:border-indigo-500/50'
                  }`
                : `bg-transparent sm:bg-white ${
                    usernameStatus === 'available' ? 'sm:border-emerald-500' :
                    usernameStatus === 'taken'     ? 'sm:border-red-500' :
                    'sm:border-slate-200 sm:shadow-xl sm:shadow-slate-300/40 focus-within:border-indigo-500'
                  }`
            }`}>
              <div className={`flex items-center px-4 py-3 sm:py-1 rounded-xl sm:rounded-none border sm:border-none flex-1 gap-2 transition-all ${
                isDark
                  ? 'bg-slate-900/60 sm:bg-transparent border-white/10 focus-within:border-indigo-500/50'
                  : 'bg-white sm:bg-transparent border-slate-200 focus-within:border-indigo-500'
              }`}>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase());
                    setError('');
                  }}
                  placeholder="Enter your username"
                  className={`bg-transparent border-0 outline-none w-full font-bold focus:ring-0 px-0 text-base ${
                    isDark ? 'text-white placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                {/* Availability indicator */}
                {usernameStatus === 'checking' && (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                {usernameStatus === 'available' && (
                  <span className="text-emerald-500 shrink-0 font-bold" title="Available">✓</span>
                )}
                {usernameStatus === 'taken' && (
                  <span className="text-red-500 shrink-0 font-bold" title="Already taken">✗</span>
                )}
              </div>
              <button 
                type="submit" 
                disabled={usernameStatus === 'taken' || usernameStatus === 'checking'}
                className={`text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all shrink-0 ${
                  usernameStatus === 'taken'
                    ? 'bg-red-600/60 cursor-not-allowed opacity-60'
                    : usernameStatus === 'checking'
                    ? 'bg-slate-600/60 cursor-wait opacity-60'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <span>Claim for Free</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Status message below form */}
            <AnimatePresence mode="wait">
              {usernameStatus === 'available' && username.trim().length >= 3 && (
                <motion.p
                  key="available"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-emerald-500 font-semibold text-sm mt-3 text-left pl-4"
                >
                  ✓ <strong>@{username.trim()}</strong> is available! Click Claim for Free.
                </motion.p>
              )}
              {usernameStatus === 'taken' && (
                <motion.p
                  key="taken"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500 font-semibold text-sm mt-3 text-left pl-4"
                >
                  ✗ <strong>@{username.trim()}</strong> is already taken. Try another.
                </motion.p>
              )}
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500 font-semibold text-sm mt-3 text-left pl-4"
                >
                  ⚠️ {error}
                </motion.p>
              )}
            </AnimatePresence>

            <p className="text-slate-500 text-xs font-bold mt-4 flex items-center justify-center gap-2">
              <Check size={12} className="text-emerald-500" /> Instant Custom Link
              <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>
              <Check size={12} className="text-emerald-500" /> Beautiful Responsive Design
              <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>
              <Check size={12} className="text-emerald-500" /> No Credit Card Required
            </p>
          </div>
        </motion.div>
      </section>

      {/* Platform Value Highlights Banner */}
      <section className={`border-y py-16 relative z-10 transition-colors ${
        isDark ? 'border-white/5 bg-slate-950/40' : 'border-slate-200/80 bg-white/70 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4 text-left">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm'
            }`}>
              <Zap size={20} />
            </div>
            <div className="space-y-1">
              <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Lightning Speed</h4>
              <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Instant real-time updates and lightning-fast page loading.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 text-left">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600 shadow-sm'
            }`}>
              <Sparkles size={20} />
            </div>
            <div className="space-y-1">
              <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>100% Free</h4>
              <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No subscriptions, no paywalls, premium themes included free.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 text-left">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' : 'bg-pink-50 border-pink-200 text-pink-600 shadow-sm'
            }`}>
              <Shield size={20} />
            </div>
            <div className="space-y-1">
              <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Privacy Control</h4>
              <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Take your page offline or wipe your data with one click.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 text-left">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'
            }`}>
              <Eye size={20} />
            </div>
            <div className="space-y-1">
              <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Zero Ads</h4>
              <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>A pristine, professional digital presence without cleanups.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Interactive Showcase Sandbox */}
      <section id="demo" className="py-24 md:py-32 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <span className="text-indigo-500 text-xs font-bold uppercase tracking-widest">Theme Sandbox</span>
              <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Try custom styling before joining.
              </h2>
              <p className={`text-base md:text-lg font-medium leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Click on the presets below to instantly preview how your live LinkFlow page can look. Customize backgrounds, text, and buttons to craft your perfect aesthetic.
              </p>
            </div>

            {/* Clickable Theme Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select a Design Preset</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_THEMES.map((theme, idx) => (
                  <button
                    key={theme.name}
                    onClick={() => setActiveThemeIdx(idx)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left group ${
                      activeThemeIdx === idx
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
                        : isDark
                        ? 'border-white/10 bg-slate-900/30 hover:border-white/20 hover:bg-slate-900/50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-black/10" style={{ backgroundColor: theme.backgroundColor }}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.buttonColor }} />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm transition-colors ${
                        isDark ? 'text-white group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-indigo-600'
                      }`}>{theme.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider mt-0.5">Click to preview</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={onLogin}
                className={`inline-flex items-center gap-2 font-bold px-6 py-3.5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl ${
                  isDark
                    ? 'bg-white text-slate-950 hover:bg-slate-200 shadow-white/5'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/15'
                }`}
              >
                <span>Start building your page</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Phone Mockup Column */}
          <div className="lg:col-span-6 flex justify-center relative">
            {/* Background Light Halo */}
            <div className="absolute inset-0 w-80 h-80 rounded-full blur-[100px] opacity-25 mx-auto top-1/2 -translate-y-1/2 transition-colors duration-500" style={{ backgroundColor: activeTheme.buttonColor }} />

            {/* High Fidelity Phone Container */}
            <motion.div 
              layout
              className="relative w-full max-w-[340px] aspect-[9/19] bg-slate-950 rounded-[3rem] border-[12px] border-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden ring-4 ring-slate-800"
            >
              {/* Dynamic Island Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-slate-900 rounded-full z-20 flex items-center justify-between px-2 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-slate-800/80"></div>
                <div className="w-3 h-3 rounded-full bg-indigo-900/40 border border-slate-700/50"></div>
              </div>

              {/* Screen Content */}
              <div 
                className="w-full h-full overflow-y-auto p-6 pt-16 text-center scrollbar-hide relative transition-all duration-500"
                style={{ backgroundColor: activeTheme.backgroundColor, color: activeTheme.textColor }}
              >
                {/* Mock User Details */}
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-spin-slow opacity-30 blur-md"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-spin-slow"></div>
                  <div 
                    className="absolute inset-[3px] rounded-full object-cover shadow-xl flex items-center justify-center font-bold text-2xl text-white uppercase border-4 border-slate-900/50"
                    style={{ 
                      backgroundImage: `linear-gradient(135deg, ${activeTheme.buttonColor}, #a855f7)`, 
                      borderColor: activeTheme.backgroundColor 
                    }}
                  >
                    🚀
                  </div>
                </div>

                <h1 className="text-xl font-extrabold mb-1 tracking-tight drop-shadow-sm">Creator Name</h1>
                <p className="text-[11px] opacity-60 mb-5 font-bold uppercase tracking-wider">@yourusername</p>
                <p className="text-xs opacity-80 mb-6 max-w-xs mx-auto leading-relaxed whitespace-pre-wrap font-medium">
                  {activeTheme.bio}
                </p>

                {/* Social grid icons */}
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {['github', 'twitter', 'linkedin', 'instagram'].map((soc, idx) => (
                    <div
                      key={idx}
                      className="w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-white/5 relative overflow-hidden transition-all duration-500"
                      style={{ backgroundColor: activeTheme.buttonColor, color: activeTheme.buttonTextColor }}
                    >
                      {soc === 'github' && <Github size={16} />}
                      {soc === 'twitter' && <Twitter size={16} />}
                      {soc === 'linkedin' && <Globe size={16} />}
                      {soc === 'instagram' && <Sparkles size={16} />}
                    </div>
                  ))}
                </div>

                {/* Primary Mock Links */}
                <div className="space-y-3">
                  <div 
                    className="block w-full p-4 rounded-xl flex items-center justify-between shadow-md border border-white/5 relative overflow-hidden transition-all duration-500"
                    style={{ backgroundColor: activeTheme.buttonColor, color: activeTheme.buttonTextColor }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Globe size={16} />
                      <div className="text-left">
                        <p className="font-extrabold text-xs tracking-tight">My Portfolio</p>
                        <p className="text-[9px] opacity-70">Check out my projects & code</p>
                      </div>
                    </div>
                    <ExternalLink size={12} className="opacity-70" />
                  </div>

                  <div 
                    className="block w-full p-4 rounded-xl flex items-center justify-between shadow-md border border-white/5 relative overflow-hidden transition-all duration-500"
                    style={{ backgroundColor: activeTheme.buttonColor, color: activeTheme.buttonTextColor }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Sparkles size={16} />
                      <div className="text-left">
                        <p className="font-extrabold text-xs tracking-tight">Weekly Newsletter</p>
                        <p className="text-[9px] opacity-70">Join 5,000+ other subscribers</p>
                      </div>
                    </div>
                    <ExternalLink size={12} className="opacity-70" />
                  </div>

                  <div 
                    className="block w-full p-4 rounded-xl flex items-center justify-between shadow-md border border-white/5 relative overflow-hidden transition-all duration-500"
                    style={{ backgroundColor: activeTheme.buttonColor, color: activeTheme.buttonTextColor }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Zap size={16} />
                      <div className="text-left">
                        <p className="font-extrabold text-xs tracking-tight">Watch My Latest Video</p>
                      </div>
                    </div>
                    <ExternalLink size={12} className="opacity-70" />
                  </div>
                </div>

                {/* Powered by */}
                <a
                  href="https://link-flow-program.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 pt-6 border-t border-white/10 opacity-30 hover:opacity-75 transition-opacity text-[9px] uppercase tracking-widest font-extrabold cursor-pointer inline-block hover:underline"
                >
                  Powered by LinkFlow
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className={`py-24 relative z-10 border-t transition-colors ${
        isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-100/40 border-slate-200/80'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-indigo-500 text-xs font-bold uppercase tracking-widest">Premium Features</span>
            <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Everything you need to showcase your digital presence.
            </h2>
            <p className={`text-base md:text-lg font-medium ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              LinkFlow provides standard premium features out of the box, with an intuitive dashboard and lightning fast responsiveness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -8, scale: 1.01 }}
                  className={`p-8 rounded-2xl border backdrop-blur-md flex flex-col justify-between transition-all group ${
                    isDark
                      ? 'bg-slate-900/30 border-white/10 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5'
                      : 'bg-white border-slate-200/90 hover:border-indigo-500/40 shadow-md shadow-slate-200/40 hover:shadow-xl'
                  }`}
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white shadow-lg`}>
                      <IconComp size={22} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className={`text-xl font-bold transition-colors ${
                      isDark ? 'text-white group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-indigo-600'
                    }`}>{feat.title}</h3>
                    <p className={`text-sm font-medium leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>{feat.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works / Steps Section */}
      <section className={`py-24 relative z-10 border-t ${
        isDark ? 'border-white/5' : 'border-slate-200/80'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-indigo-500 text-xs font-bold uppercase tracking-widest">Simple Setup</span>
            <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>Create your link in 3 steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`relative p-6 rounded-2xl border text-center flex flex-col items-center transition-all ${
              isDark ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-200/90 shadow-sm'
            }`}>
              <div className={`absolute top-[-20px] w-12 h-12 rounded-full border flex items-center justify-center text-lg font-black shadow-md ${
                isDark ? 'bg-slate-900 border-white/10 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600 shadow-md'
              }`}>1</div>
              <h3 className={`text-xl font-bold mt-4 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Claim your URL</h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Choose a custom username (e.g. <code>linkflow.me/yourname</code>) and reserve it instantaneously.</p>
            </div>
            <div className={`relative p-6 rounded-2xl border text-center flex flex-col items-center transition-all ${
              isDark ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-200/90 shadow-sm'
            }`}>
              <div className={`absolute top-[-20px] w-12 h-12 rounded-full border flex items-center justify-center text-lg font-black shadow-md ${
                isDark ? 'bg-slate-900 border-white/10 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600 shadow-md'
              }`}>2</div>
              <h3 className={`text-xl font-bold mt-4 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Your Content</h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Add social handles, website links, portfolios, emails, or phone numbers. Instant real-time preview.</p>
            </div>
            <div className={`relative p-6 rounded-2xl border text-center flex flex-col items-center transition-all ${
              isDark ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-200/90 shadow-sm'
            }`}>
              <div className={`absolute top-[-20px] w-12 h-12 rounded-full border flex items-center justify-center text-lg font-black shadow-md ${
                isDark ? 'bg-slate-900 border-white/10 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600 shadow-md'
              }`}>3</div>
              <h3 className={`text-xl font-bold mt-4 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Share With The World</h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Paste your unique URL in your bio on Instagram, TikTok, Twitter/X, GitHub, or LinkedIn to instantly connect.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section id="faq" className={`py-24 relative z-10 border-t transition-colors ${
        isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-100/40 border-slate-200/80'
      }`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="text-indigo-500 text-xs font-bold uppercase tracking-widest">Got Questions?</span>
            <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx}
                className={`rounded-2xl border overflow-hidden backdrop-blur-md transition-all ${
                  isDark ? 'bg-slate-900/30 border-white/10' : 'bg-white border-slate-200/90 shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className={`w-full p-6 text-left flex items-center justify-between font-bold transition-colors focus:outline-none ${
                    isDark ? 'text-white hover:text-indigo-400' : 'text-slate-900 hover:text-indigo-600'
                  }`}
                >
                  <span className="text-base md:text-lg">{faq.question}</span>
                  <ChevronDown 
                    size={20} 
                    className={`transition-transform duration-300 shrink-0 ${
                      openFaqIdx === idx ? 'rotate-180 text-indigo-500' : isDark ? 'text-slate-500' : 'text-slate-400'
                    }`} 
                  />
                </button>

                <AnimatePresence initial={false}>
                  {openFaqIdx === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className={`px-6 pb-6 pt-1 text-sm md:text-base leading-relaxed border-t font-medium ${
                        isDark ? 'text-slate-400 border-white/5' : 'text-slate-600 border-slate-100'
                      }`}>
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Block */}
      <section className={`py-24 relative z-10 border-t text-center overflow-hidden transition-colors ${
        isDark ? 'border-white/5' : 'border-slate-200/80 bg-white/50'
      }`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 space-y-8 relative z-10">
          <h2 className={`text-3xl md:text-6xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Ready to optimize your digital presence?
          </h2>
          <p className={`text-base md:text-lg max-w-lg mx-auto font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Claim your LinkFlow page for free today and connect all your handles with one simple, beautiful page.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>Get Started for Free</span>
              <ArrowRight size={18} />
            </button>
            <a 
              href="#demo"
              className={`w-full sm:w-auto px-8 py-4 font-bold rounded-xl border transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-sm'
              }`}
            >
              <span>See Themes</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-12 relative z-10 transition-colors ${
        isDark ? 'border-white/5 bg-slate-950/60' : 'border-slate-200/80 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">L</div>
            <span className={`font-extrabold text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>LinkFlow</span>
          </div>

          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
              &copy; {new Date().getFullYear()} LinkFlow. All rights reserved.
            </p>
            <p className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Support: <a href="mailto:rupambairagya08@gmail.com" className="text-indigo-500 hover:text-indigo-400 transition-colors hover:underline">rupambairagya08@gmail.com</a>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/Rupam852?fbclid=PAT01DUASBCdNleHRuA2FlbQIxMABzcnRjBmFwcF9pZA81NjcwNjczNDMzNTI0MjcAAadPduSgzS2IrTgwp6Lj5UJXNFB14KH1r5yrTZHu_9Y3EXX-sRFQe2yof59fbQ_aem_gogCmQtwxmn64XK458q7yw" target="_blank" rel="noopener noreferrer" className={`p-2 transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`} title="GitHub">
              <Github size={20} />
            </a>
            <a href="https://www.instagram.com/_rupambairagya_?igsh=MWNsNHFiZzE4bnQ5OQ==" target="_blank" rel="noopener noreferrer" className={`p-2 transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`} title="Instagram">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </footer>

      {/* Login Error Toast */}
      <AnimatePresence>
        {loginError && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[100] bg-red-950/90 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-red-500/30 backdrop-blur-md max-w-md w-[calc(100%-2rem)] md:w-full mx-auto"
          >
            <div className="w-8 h-8 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div className="flex flex-col flex-1 text-left">
              <span className="text-sm font-bold text-red-200 font-sans">Sign In Failed</span>
              <span className="text-xs text-slate-300 mt-0.5 leading-normal font-sans">{loginError}</span>
            </div>
            {clearLoginError && (
              <button 
                onClick={clearLoginError}
                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors shrink-0"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
