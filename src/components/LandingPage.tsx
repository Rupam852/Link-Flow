import React, { useState } from 'react';
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
  MousePointerClick
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
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
    buttonTextColor: '#ffffff',
    bio: 'Permaculture designer and botanist. Sharing green ideas and organic growth.',
    bgStyle: 'bg-emerald-950'
  },
  {
    name: 'Dracula Dark',
    backgroundColor: '#282a36',
    textColor: '#f8f8f2',
    buttonColor: '#bd93f9',
    buttonTextColor: '#282a36',
    bio: 'Open source contributor & UI enthusiast. Vim is my favorite operating system.',
    bgStyle: 'bg-zinc-900'
  }
];

const FEATURES = [
  {
    icon: Palette,
    title: 'Rich & Dynamic Themes',
    description: 'Choose from 15+ beautifully pre-designed templates or build your own color scheme from scratch with our visual appearance controls.',
    color: 'from-purple-500 to-indigo-500'
  },
  {
    icon: Layout,
    title: 'Grid & List Layouts',
    description: 'Format your social links in a tight grid or clean, detailed lists with custom descriptions. Tailor your page to your personal brand.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Zap,
    title: 'Smart Link Detection',
    description: 'Simply paste any link—GitHub, Youtube, Twitter, WhatsApp, Telegram, or Discord. Our engine instantly configures the perfect icon and branding.',
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: Eye,
    title: 'Real-Time Interactive Preview',
    description: 'See every change instantly in a high-fidelity virtual phone mockup. Never publish blind adjustments again.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: Shield,
    title: 'Safe, Secure & Fast',
    description: 'Powered by Firebase Auth and lightning-fast API responses. Enjoy zero-latency page loading for your public audience.',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: Globe,
    title: '100% Free Forever',
    description: 'No paid upgrades, no hidden features, no corporate watermarks. Claim your custom short URL and enjoy full premium access, absolutely free.',
    color: 'from-violet-500 to-fuchsia-500'
  }
];

const FAQS = [
  {
    question: 'Is LinkFlow really free?',
    answer: 'Absolutely! LinkFlow is 100% free with no premium paywalls, no recurring subscriptions, and no trial limits. All features, customization controls, and templates are available to everyone immediately.'
  },
  {
    question: 'How do I claim my own custom username link?',
    answer: 'Simply type your preferred username in the box at the top of this page (e.g. linkflow.me/yourname) and click "Claim for Free". After signing in with your Google account, your profile link will be claimed and live instantly!'
  },
  {
    question: 'Can I add custom bios and social handles?',
    answer: 'Yes! You can set your display name, write a rich custom bio, upload your profile photo, and add as many links as you want. You can also toggle between grid and list layouts for your primary social networks.'
  },
  {
    question: 'Does the smart link detector work with any website?',
    answer: 'Yes! The detector automatically recognizes popular websites like GitHub, Twitter/X, Instagram, LinkedIn, YouTube, Facebook, WhatsApp, Telegram, and Discord, styling them with their corresponding high-quality brand icon. For other sites, it displays a beautiful default global network icon.'
  }
];

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [activeThemeIdx, setActiveThemeIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const activeTheme = PRESET_THEMES[activeThemeIdx];

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Please enter a username.');
      return;
    }

    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, and hyphens.');
      return;
    }

    // Save proposed username to session storage and trigger login
    sessionStorage.setItem('claimedUsername', cleanUsername);
    onLogin();
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Decorative Radial Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-indigo-900/20 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[50%] aspect-square rounded-full bg-purple-900/15 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[55%] aspect-square rounded-full bg-blue-900/20 blur-[150px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />

      {/* Header */}
      <header className="relative max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">L</div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">LinkFlow</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:inline-block">Features</a>
          <a href="#demo" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:inline-block">Themes</a>
          <a href="#faq" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:inline-block">FAQs</a>
          <button 
            onClick={onLogin}
            className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
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
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 text-xs text-indigo-400 font-bold tracking-wide uppercase">
            <Sparkles size={12} className="animate-pulse" />
            <span>Introducing LinkFlow 1.0</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] text-white">
            One Link to{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-black">
              Flow Them All
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Consolidate your social channels, showcase your portfolio, and collect your audience in one beautifully customized, high-converting bio link. Fast, modern, and free forever.
          </p>

          {/* Claim Username Form */}
          <div className="max-w-md mx-auto pt-6">
            <form onSubmit={handleClaim} className="flex flex-col sm:flex-row gap-3 bg-slate-900/50 p-2 rounded-2xl border border-white/10 backdrop-blur-md focus-within:border-indigo-500/50 transition-all shadow-2xl">
              <div className="flex items-center px-4 flex-1 py-1">
                <span className="text-slate-500 font-semibold select-none text-base">linkflow.me/</span>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="username"
                  className="bg-transparent border-0 outline-none w-full text-white font-bold placeholder:text-slate-600 focus:ring-0 px-1 ml-0.5 text-base"
                />
              </div>
              <button 
                type="submit" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <span>Claim for Free</span>
                <ArrowRight size={16} />
              </button>
            </form>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 font-semibold text-sm mt-3 text-left pl-4"
              >
                ⚠️ {error}
              </motion.p>
            )}
            <p className="text-slate-500 text-xs font-bold mt-4 flex items-center justify-center gap-2">
              <Check size={12} className="text-emerald-500" /> Instant Custom Link
              <span className="text-slate-700">•</span>
              <Check size={12} className="text-emerald-500" /> Beautiful Responsive Design
              <span className="text-slate-700">•</span>
              <Check size={12} className="text-emerald-500" /> No Credit Card Required
            </p>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-slate-950/40 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">10,000+</h3>
            <p className="text-xs uppercase tracking-widest font-extrabold text-slate-500">Active Creators</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">5M+</h3>
            <p className="text-xs uppercase tracking-widest font-extrabold text-slate-500">Total Clicks Tracked</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">99.9%</h3>
            <p className="text-xs uppercase tracking-widest font-extrabold text-slate-500">System Uptime</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">0$</h3>
            <p className="text-xs uppercase tracking-widest font-extrabold text-slate-500">Cost Forever</p>
          </div>
        </div>
      </section>

      {/* Theme Interactive Showcase Sandbox */}
      <section id="demo" className="py-24 md:py-32 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Text Column (5 cols) */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Theme Sandbox</span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Try custom styling before joining.
              </h2>
              <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">
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
                        : 'border-white/10 bg-slate-900/30 hover:border-white/20 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10" style={{ backgroundColor: theme.backgroundColor }}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.buttonColor }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">{theme.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider mt-0.5">Click to preview</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={onLogin}
                className="inline-flex items-center gap-2 bg-white text-slate-950 font-bold px-6 py-3.5 rounded-xl hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
              >
                <span>Start building your page</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Phone Mockup Column (6 cols) */}
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
                <div className="mt-8 pt-6 border-t border-white/10 opacity-30 text-[9px] uppercase tracking-widest font-extrabold">
                  Powered by LinkFlow
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 bg-slate-950/20 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Premium Features</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Everything you need to showcase your digital presence.
            </h2>
            <p className="text-slate-400 text-base md:text-lg font-medium">
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
                  className="bg-slate-900/30 p-8 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 group"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white shadow-lg`}>
                      <IconComp size={22} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{feat.title}</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">{feat.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works / Steps Section */}
      <section className="py-24 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Simple Setup</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Create your link in 3 steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative p-6 rounded-2xl bg-slate-900/20 border border-white/5 text-center flex flex-col items-center">
              <div className="absolute top-[-20px] w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-lg font-black text-indigo-400 shadow-md">1</div>
              <h3 className="text-xl font-bold text-white mt-4 mb-2">Claim your URL</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Choose a custom username (e.g. `linkflow.me/yourname`) and reserve it instantaneously.</p>
            </div>
            <div className="relative p-6 rounded-2xl bg-slate-900/20 border border-white/5 text-center flex flex-col items-center">
              <div className="absolute top-[-20px] w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-lg font-black text-indigo-400 shadow-md">2</div>
              <h3 className="text-xl font-bold text-white mt-4 mb-2">Add Your Content</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Add social handles, website links, portfolios, emails, or phone numbers. Instant real-time preview.</p>
            </div>
            <div className="relative p-6 rounded-2xl bg-slate-900/20 border border-white/5 text-center flex flex-col items-center">
              <div className="absolute top-[-20px] w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-lg font-black text-indigo-400 shadow-md">3</div>
              <h3 className="text-xl font-bold text-white mt-4 mb-2">Share With The World</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Paste your unique URL in your bio on Instagram, TikTok, Twitter/X, GitHub, or LinkedIn to instantly connect.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section id="faq" className="py-24 bg-slate-950/20 relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Got Questions?</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-slate-900/30 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex items-center justify-between font-bold text-white hover:text-indigo-400 transition-colors focus:outline-none"
                >
                  <span className="text-base md:text-lg">{faq.question}</span>
                  <ChevronDown 
                    size={20} 
                    className={`text-slate-500 transition-transform duration-300 shrink-0 ${openFaqIdx === idx ? 'rotate-180 text-indigo-400' : ''}`} 
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
                      <div className="px-6 pb-6 pt-1 text-slate-400 text-sm md:text-base leading-relaxed border-t border-white/5 font-medium">
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
      <section className="py-24 relative z-10 border-t border-white/5 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 space-y-8 relative z-10">
          <h2 className="text-3xl md:text-6xl font-extrabold text-white tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to optimize your digital presence?
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-lg mx-auto font-medium">
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
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              <span>See Themes</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/60 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">L</div>
            <span className="font-extrabold text-xl tracking-tight text-white">LinkFlow</span>
          </div>

          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            <p className="text-slate-500 text-xs font-medium">
              &copy; {new Date().getFullYear()} LinkFlow. All rights reserved.
            </p>
            <p className="text-[11px] text-slate-400 font-semibold tracking-wide">
              Support: <a href="mailto:rupambairagya08@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors hover:underline">rupambairagya08@gmail.com</a>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/Rupam852?fbclid=PAT01DUASBCdNleHRuA2FlbQIxMABzcnRjBmFwcF9pZA81NjcwNjczNDMzNTI0MjcAAadPduSgzS2IrTgwp6Lj5UJXNFB14KH1r5yrTZHu_9Y3EXX-sRFQe2yof59fbQ_aem_gogCmQtwxmn64XK458q7yw" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-white transition-colors" title="GitHub">
              <Github size={20} />
            </a>
            <a href="https://www.instagram.com/_rupambairagya_?igsh=MWNsNHFiZzE4bnQ5OQ==" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-white transition-colors" title="Instagram">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
