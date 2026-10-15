// Vercel Fresh Clean Trigger
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import {
  Plus,
  Trash2,
  ExternalLink,
  Settings,
  Eye,
  EyeOff,
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
  Copy,
  AlertCircle,
  Youtube,
  Facebook,
  MessageCircle,
  Send,
  Mail,
  Play,
  ChevronUp,
  ChevronDown,
  GripVertical,
  TrendingUp,
  RotateCw,
  RotateCcw,
  HardDrive,
  Link,
  Phone,
  ShoppingBag,
  Coffee,
  Music,
  Search,
  Sliders,
  Layers,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Crop,
  Upload,
  QrCode
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, getRedirectResult } from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import LandingPage from './components/LandingPage';
import BackgroundCropModal from './components/BackgroundCropModal';
import QRCodeModal from './components/QRCodeModal';
import BioGeneratorModal from './components/BioGeneratorModal';
import MediaEmbed, { isEmbeddableUrl, isYouTubeUrl } from './components/MediaEmbed';
import { EmailCaptureWidget, EmailEditorPanel } from './components/EmailCapture';
import PublicProfileSkeleton from './components/PublicProfileSkeleton';

interface Link {
  id?: string; // Stable ID for Reorder tracking key
  title: string;
  url: string;
  icon: string;
  description?: string;
  isActive?: boolean; // Feature 1: Enable/Disable Link Toggle
  animation?: 'none' | 'pulse' | 'wobble' | 'glow'; // Feature 2: Link Highlights Animations
  clicks?: number; // Feature 3: Analytics Badges
  thumbnailUrl?: string; // Feature 6: Custom Link Thumbnail Image
  display?: 'card' | 'icon';
  embed?: boolean; // Feature 4: Interactive Media Embed (YouTube / Spotify)
  autoplay?: boolean; // Autoplay on profile open
  embedType?: 'video' | 'music'; // 'video' for 16:9 iframe, 'music' for minimal soundwave card
}

interface QuickSocial {
  platform: string;
  url: string;
  icon: string;
  isActive?: boolean;
}

interface Profile {
  username: string;
  uid: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  links: Link[];
  quickSocials?: QuickSocial[]; // Feature 8: Quick Social Icon Grid Row
  theme: {
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
    buttonStyle?: 'rounded' | 'pill' | 'sharp' | 'glass' | 'shadow';
    themeId?: string;
    backgroundImageUrl?: string;
    backgroundBlur?: number;
    backgroundOverlay?: number;
  };
  socialLinksStyle: 'grid' | 'list';
  isActive?: boolean;
  emailCaptureEnabled?: boolean;
  subscribers?: string[];
}

const DEFAULT_PROFILE: Profile = {
  username: '',
  uid: '',
  email: '',
  displayName: '',
  bio: '',
  avatarUrl: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23111827'/%3E%3Ccircle cx='100' cy='75' r='35' fill='%2338BDF8'/%3E%3Cpath d='M45 190 C45 110, 155 110, 155 190 Z' fill='%2338BDF8'/%3E%3C/svg%3E",
  links: [
    { id: 'default-portfolio', title: 'My Portfolio', url: 'https://example.com', icon: 'globe', description: 'Check out my latest projects and work experience.', isActive: true, animation: 'none', clicks: 0 },
    { id: 'default-github', title: 'GitHub', url: 'https://github.com', icon: 'github', isActive: true, animation: 'none', clicks: 0 },
    { id: 'default-twitter', title: 'Twitter', url: 'https://twitter.com', icon: 'twitter', isActive: true, animation: 'none', clicks: 0 },
  ],
  quickSocials: [
    { platform: 'instagram', url: '', icon: 'instagram', isActive: false },
    { platform: 'twitter', url: '', icon: 'twitter', isActive: false },
    { platform: 'youtube', url: '', icon: 'youtube', isActive: false },
    { platform: 'whatsapp', url: '', icon: 'whatsapp', isActive: false },
    { platform: 'mail', url: '', icon: 'mail', isActive: false }
  ],
  theme: {
    backgroundColor: '#0f172a',
    textColor: '#f8fafc',
    buttonColor: '#334155',
    buttonTextColor: '#f8fafc',
    buttonStyle: 'rounded',
    themeId: 'classic',
    backgroundImageUrl: '',
    backgroundBlur: 0,
    backgroundOverlay: 0.35,
  },
  socialLinksStyle: 'grid',
  isActive: true,
  emailCaptureEnabled: false,
  subscribers: []
};

const GoogleDriveIcon = ({ size = 20, className = '' }: { size?: number, className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="currentColor"
  >
    <path d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167h-7.249z" />
  </svg>
);

const ICON_MAP: Record<string, any> = {
  github: Github,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  facebook: Facebook,
  whatsapp: MessageCircle,
  telegram: Send,
  mail: Mail,
  discord: MessageCircle,
  tiktok: Play,
  globe: Globe,
  drive: GoogleDriveIcon,
  link: Link,
  phone: Phone,
  shop: ShoppingBag,
  coffee: Coffee,
  music: Music,
};

const detectIcon = (url: string): string => {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes('github.com')) return 'github';
  if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) return 'twitter';
  if (lowercaseUrl.includes('instagram.com')) return 'instagram';
  if (lowercaseUrl.includes('linkedin.com')) return 'linkedin';
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) return 'youtube';
  if (lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('fb.com')) return 'facebook';
  if (lowercaseUrl.includes('wa.me') || lowercaseUrl.includes('whatsapp.com')) return 'whatsapp';
  if (lowercaseUrl.includes('t.me') || lowercaseUrl.includes('telegram.org')) return 'telegram';
  if (lowercaseUrl.includes('discord.gg') || lowercaseUrl.includes('discord.com')) return 'discord';
  if (lowercaseUrl.includes('tiktok.com')) return 'tiktok';
  if (lowercaseUrl.includes('mailto:')) return 'mail';
  if (lowercaseUrl.includes('drive.google.com') || lowercaseUrl.includes('docs.google.com')) return 'drive';
  if (lowercaseUrl.includes('spotify.com') || lowercaseUrl.includes('soundcloud.com') || lowercaseUrl.includes('music.apple.com')) return 'music';
  if (lowercaseUrl.includes('tel:')) return 'phone';
  return 'globe';
};

export interface TemplatePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  badge?: string;
  theme: {
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
    buttonStyle: 'rounded' | 'pill' | 'sharp' | 'glass' | 'shadow';
    themeId: string;
  };
}

const TEMPLATE_CATEGORIES = [
  'All',
  'Featured',
  'Creator',
  'Fashion & Beauty',
  'Music & Audio',
  'Business & Tech',
  'Minimal & Luxe',
  'Bold & Pop',
  'Nature & Wellness'
];

const TEMPLATES: TemplatePreset[] = [
  {
    id: 'classic',
    name: 'LinkFlow Classic',
    category: 'Featured',
    badge: 'Default',
    description: 'Our signature dark slate with radiant avatar glow ring and sleek cards.',
    theme: {
      backgroundColor: '#0f172a',
      textColor: '#f8fafc',
      buttonColor: '#334155',
      buttonTextColor: '#f8fafc',
      buttonStyle: 'rounded',
      themeId: 'classic',
    }
  },
  {
    id: 'glassmorphism',
    name: 'Frosted Glass',
    category: 'Featured',
    badge: 'Modern',
    description: 'Translucent floating frosted glass cards with outer glow.',
    theme: {
      backgroundColor: '#111827',
      textColor: '#f9fafb',
      buttonColor: '#1f2937',
      buttonTextColor: '#ffffff',
      buttonStyle: 'glass',
      themeId: 'glassmorphism',
    }
  },
  {
    id: 'artemis',
    name: 'Artemis',
    category: 'Creator',
    badge: 'Popular',
    description: 'Warm cream & amber aesthetic, refined editorial elegance for creators.',
    theme: {
      backgroundColor: '#fdfbf7',
      textColor: '#292524',
      buttonColor: '#78350f',
      buttonTextColor: '#ffffff',
      buttonStyle: 'pill',
      themeId: 'artemis',
    }
  },
  {
    id: 'balcombe',
    name: 'Balcombe',
    category: 'Nature & Wellness',
    badge: 'Trending',
    description: 'Sage green & organic earthy wellness vibe for healthy lifestyle.',
    theme: {
      backgroundColor: '#f4f7f4',
      textColor: '#14532d',
      buttonColor: '#15803d',
      buttonTextColor: '#ffffff',
      buttonStyle: 'pill',
      themeId: 'balcombe',
    }
  },
  {
    id: 'boultont',
    name: 'Boultont',
    category: 'Bold & Pop',
    badge: 'Gen-Z',
    description: 'Punchy neo-brutalist yellow/black contrast with retro hard shadow.',
    theme: {
      backgroundColor: '#fef08a',
      textColor: '#000000',
      buttonColor: '#000000',
      buttonTextColor: '#fef08a',
      buttonStyle: 'shadow',
      themeId: 'boultont',
    }
  },
  {
    id: 'bourke',
    name: 'Bourke',
    category: 'Minimal & Luxe',
    badge: 'Clean',
    description: 'Ultra-crisp Apple-inspired monochrome simplicity and airy spacing.',
    theme: {
      backgroundColor: '#ffffff',
      textColor: '#18181b',
      buttonColor: '#18181b',
      buttonTextColor: '#ffffff',
      buttonStyle: 'pill',
      themeId: 'bourke',
    }
  },
  {
    id: 'constance',
    name: 'Constance',
    category: 'Fashion & Beauty',
    badge: 'Aesthetic',
    description: 'Blush pastel pink & delicate fashion styling for beauty influencers.',
    theme: {
      backgroundColor: '#fff1f2',
      textColor: '#881337',
      buttonColor: '#fb7185',
      buttonTextColor: '#ffffff',
      buttonStyle: 'pill',
      themeId: 'constance',
    }
  },
  {
    id: 'coromandel',
    name: 'Coromandel',
    category: 'Nature & Wellness',
    description: 'Coastal turquoise and crisp oceanic vibes for travel & outdoors.',
    theme: {
      backgroundColor: '#f0fdfa',
      textColor: '#134e4a',
      buttonColor: '#0d9488',
      buttonTextColor: '#ffffff',
      buttonStyle: 'rounded',
      themeId: 'coromandel',
    }
  },
  {
    id: 'crombie',
    name: 'Crombie',
    category: 'Music & Audio',
    badge: 'Trending',
    description: 'Deep midnight purple designed for musicians, bands & producers.',
    theme: {
      backgroundColor: '#1e112a',
      textColor: '#f3e8ff',
      buttonColor: '#9333ea',
      buttonTextColor: '#ffffff',
      buttonStyle: 'pill',
      themeId: 'crombie',
    }
  },
  {
    id: 'sunset-aura',
    name: 'Sunset Aura',
    category: 'Creator',
    badge: 'Warm',
    description: 'Golden hour sunset warmth with smooth vibrant capsule buttons.',
    theme: {
      backgroundColor: '#fff7ed',
      textColor: '#9a3412',
      buttonColor: '#f97316',
      buttonTextColor: '#ffffff',
      buttonStyle: 'pill',
      themeId: 'sunset-aura',
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Matrix',
    category: 'Business & Tech',
    badge: 'Gamer',
    description: 'Deep black with laser neon matrix accents and high-tech styling.',
    theme: {
      backgroundColor: '#050505',
      textColor: '#4ade80',
      buttonColor: '#16a34a',
      buttonTextColor: '#ffffff',
      buttonStyle: 'sharp',
      themeId: 'cyberpunk',
    }
  },
  {
    id: 'neon-synth',
    name: 'Neon Synthwave',
    category: 'Music & Audio',
    description: 'Electric cyan energy with dark violet background and retro pulse.',
    theme: {
      backgroundColor: '#090514',
      textColor: '#38bdf8',
      buttonColor: '#06b6d4',
      buttonTextColor: '#090514',
      buttonStyle: 'rounded',
      themeId: 'neon-synth',
    }
  },
  {
    id: 'executive-navy',
    name: 'Executive Navy',
    category: 'Business & Tech',
    badge: 'Pro',
    description: 'Cobalt and deep navy for founders, devs, and digital agencies.',
    theme: {
      backgroundColor: '#0a192f',
      textColor: '#e2e8f0',
      buttonColor: '#2563eb',
      buttonTextColor: '#ffffff',
      buttonStyle: 'rounded',
      themeId: 'executive-navy',
    }
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    category: 'Minimal & Luxe',
    description: 'Scandinavian Arctic slate with icy slate highlights.',
    theme: {
      backgroundColor: '#2e3440',
      textColor: '#eceff4',
      buttonColor: '#5e81ac',
      buttonTextColor: '#eceff4',
      buttonStyle: 'rounded',
      themeId: 'nordic',
    }
  },
  {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    category: 'Fashion & Beauty',
    description: 'Dreamy lilac and purple tones for beauty, skincare & lifestyle.',
    theme: {
      backgroundColor: '#faf5ff',
      textColor: '#581c87',
      buttonColor: '#a855f7',
      buttonTextColor: '#ffffff',
      buttonStyle: 'pill',
      themeId: 'lavender-mist',
    }
  },
  {
    id: 'brutal-orange',
    name: 'Brutal Tangerine',
    category: 'Bold & Pop',
    description: 'Bold orange pop with heavy solid retro drop shadows.',
    theme: {
      backgroundColor: '#ffedd5',
      textColor: '#000000',
      buttonColor: '#ea580c',
      buttonTextColor: '#ffffff',
      buttonStyle: 'shadow',
      themeId: 'brutal-orange',
    }
  },
  {
    id: 'matcha',
    name: 'Matcha Zen',
    category: 'Nature & Wellness',
    description: 'Soothing botanical matcha tones and warm beige buttons.',
    theme: {
      backgroundColor: '#f2efe9',
      textColor: '#283618',
      buttonColor: '#606c38',
      buttonTextColor: '#fefae0',
      buttonStyle: 'pill',
      themeId: 'matcha',
    }
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    category: 'Creator',
    badge: 'Luxury',
    description: 'Onyx black and burnished gold for luxury brands and creators.',
    theme: {
      backgroundColor: '#121212',
      textColor: '#fbbf24',
      buttonColor: '#d97706',
      buttonTextColor: '#121212',
      buttonStyle: 'rounded',
      themeId: 'midnight-gold',
    }
  },
  {
    id: 'dracula',
    name: 'Dracula Dark',
    category: 'Business & Tech',
    description: 'Famous dark theme palette with purple and coral accents.',
    theme: {
      backgroundColor: '#282a36',
      textColor: '#f8f8f2',
      buttonColor: '#bd93f9',
      buttonTextColor: '#282a36',
      buttonStyle: 'rounded',
      themeId: 'dracula',
    }
  },
  {
    id: 'emerald',
    name: 'Deep Emerald',
    category: 'Nature & Wellness',
    description: 'Deep botanical emerald forest for sustainable ventures.',
    theme: {
      backgroundColor: '#064e3b',
      textColor: '#ecfdf5',
      buttonColor: '#10b981',
      buttonTextColor: '#ffffff',
      buttonStyle: 'rounded',
      themeId: 'emerald',
    }
  }
];

const getButtonStyleClasses = (style?: string) => {
  switch (style) {
    case 'pill':
      return 'rounded-full border border-white/15 px-5 shadow-md';
    case 'sharp':
      return 'rounded-none border border-white/20 shadow-md';
    case 'glass':
      return 'rounded-2xl border border-white/30 backdrop-blur-md shadow-lg';
    case 'shadow':
      return 'rounded-xl border-2 border-black/80 shadow-[4px_4px_0px_rgba(0,0,0,0.9)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] active:translate-x-1 active:translate-y-1';
    case 'rounded':
    default:
      return 'rounded-xl border border-white/10 shadow-md';
  }
};

const getSocialIconStyleClasses = (style?: string) => {
  switch (style) {
    case 'sharp':
      return 'rounded-none border border-white/20 shadow-md';
    case 'shadow':
      return 'rounded-xl border-2 border-black/80 shadow-[3px_3px_0px_rgba(0,0,0,0.9)] active:translate-x-0.5 active:translate-y-0.5';
    case 'glass':
      return 'rounded-full border border-white/30 backdrop-blur-md shadow-lg';
    case 'pill':
    case 'rounded':
    default:
      return 'rounded-full border border-white/10 shadow-md';
  }
};

const isTemplateActive = (tplTheme: any, currentTheme: any) => {
  if (!currentTheme) return false;
  if (currentTheme.themeId && tplTheme.themeId) {
    return currentTheme.themeId === tplTheme.themeId;
  }
  return (
    currentTheme.backgroundColor?.toLowerCase() === tplTheme.backgroundColor?.toLowerCase() &&
    currentTheme.buttonColor?.toLowerCase() === tplTheme.buttonColor?.toLowerCase()
  );
};

const preloadImage = (url?: string): Promise<void> => {
  if (!url || typeof url !== 'string' || !url.trim() || !url.startsWith('http')) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    if (img.complete) {
      resolve();
      return;
    }
    img.onload = () => resolve();
    img.onerror = () => resolve();
    setTimeout(resolve, 1000);
  });
};

const checkIsPublicPath = () => {
  if (typeof window === 'undefined') return false;
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts.length === 1 && !['api', 'admin', 'assets', 'static', 'edit', 'preview', 'index.html'].includes(parts[0]);
};

export default function App() {
  const isInitialPublic = checkIsPublicPath();
  const [view, setView] = useState<'preview' | 'edit' | 'public'>(isInitialPublic ? 'public' : 'edit');
  const [isPublicLoading, setIsPublicLoading] = useState(isInitialPublic);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [debouncedProfile, setDebouncedProfile] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProfile(profile);
    }, 150);
    return () => clearTimeout(handler);
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<'links' | 'profile' | 'appearance' | 'analytics' | 'settings'>('links');
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState('All');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [activeIconPickerIdx, setActiveIconPickerIdx] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [claimedTakenAlert, setClaimedTakenAlert] = useState<string | null>(null);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshingAnalytics, setIsRefreshingAnalytics] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawCropImage, setRawCropImage] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const backgroundFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleBackgroundFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawCropImage(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRefreshAnalytics = async () => {
    if (!user) return;
    setIsRefreshingAnalytics(true);
    try {
      await fetchProfile(user.uid, true);
    } catch (err) {
      console.error("Failed to refresh analytics:", err);
    } finally {
      setIsRefreshingAnalytics(false);
    }
  };

  const [isResettingAnalytics, setIsResettingAnalytics] = useState(false);

  const handleResetAnalytics = async () => {
    if (!user) return;

    setIsResettingAnalytics(true);
    try {
      const token = await user.getIdToken();
      const updatedLinks = profile.links.map(link => ({
        ...link,
        clicks: 0
      }));

      // Sanitize profile like handleSave does
      const { _id, __v, ...pureProfileData } = profile as any;
      const sanitizedLinks = updatedLinks.map((link: any) => {
        const trimmedUrl = link.url ? link.url.trim() : '';
        if (trimmedUrl && !/^(https?:\/\/|mailto:|tel:)/.test(trimmedUrl) && !trimmedUrl.startsWith('/')) {
          return { ...link, url: `https://${trimmedUrl}` };
        }
        return { ...link, url: trimmedUrl };
      });

      const updatedProfile = {
        ...pureProfileData,
        uid: user.uid,
        username: profile.username,
        links: sanitizedLinks
      };

      const res = await fetch(`/api/profiles/uid/${user.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProfile),
      });

      if (res.ok) {
        setProfile(updatedProfile);
        const cacheKey = `linkflow_profile_cache_uid_${user.uid}`;
        const usernameCacheKey = `linkflow_profile_cache_${profile.username}`;
        localStorage.setItem(cacheKey, JSON.stringify(updatedProfile));
        localStorage.setItem(usernameCacheKey, JSON.stringify(updatedProfile));
      } else {
        console.error('Failed to reset analytics');
        alert("Failed to reset analytics. Please try again.");
      }
    } catch (err) {
      console.error("Failed to reset analytics:", err);
      alert("Failed to reset analytics. Please try again.");
    } finally {
      setIsResettingAnalytics(false);
    }
  };

  // Responsive View Handler with History tracking for back gesture
  const handleSetView = (newView: 'preview' | 'edit') => {
    if (newView === 'preview') {
      window.history.pushState({ view: 'preview' }, '', '?view=preview');
      setView('preview');
    } else {
      window.history.pushState({ view: 'edit' }, '', window.location.pathname);
      setView('edit');
    }
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (window.location.pathname !== '/') {
        return;
      }
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'preview') {
        setView('preview');
      } else {
        setView('edit');
      }
    };
    window.addEventListener('popstate', handlePopState);
    handlePopState(new PopStateEvent('popstate'));
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check for post-deletion redirect success toast trigger
  useEffect(() => {
    const isDeleted = sessionStorage.getItem('deleteSuccess');
    if (isDeleted === 'true') {
      sessionStorage.removeItem('deleteSuccess');
      setShowDeleteToast(true);
      const timer = setTimeout(() => setShowDeleteToast(false), 7000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Check if claimed username was already taken, or if they logged into an existing account
  useEffect(() => {
    const takenName = sessionStorage.getItem('claimedUsernameTaken');
    const pendingClaim = sessionStorage.getItem('claimedUsername');

    if (takenName && profile.username && profile.username !== takenName) {
      sessionStorage.removeItem('claimedUsernameTaken');
      sessionStorage.removeItem('claimedUsername');
      setClaimedTakenAlert(`The handle @${takenName} was already registered by another creator, so we assigned a unique variation: @${profile.username}. You can customize it at any time below!`);
      const timer = setTimeout(() => setClaimedTakenAlert(null), 9000);
      return () => clearTimeout(timer);
    }

    if (pendingClaim && profile.username) {
      sessionStorage.removeItem('claimedUsername');
      if (profile.username !== pendingClaim) {
        setClaimedTakenAlert(`You logged in using an account already linked to the handle @${profile.username}. We have loaded your existing profile instead of @${pendingClaim}.`);
        const timer = setTimeout(() => setClaimedTakenAlert(null), 9000);
        return () => clearTimeout(timer);
      }
    }
  }, [profile.username]);

  // Helper for generating URL slugs
  const generateSlug = (name?: string | null) => {
    if (!name) return '';
    return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const fetchProfile = async (id: string, isUid: boolean = false, autoSaveUserData?: any) => {
    setIsFetching(true);
    const fetchStartTime = Date.now();
    const cacheKey = `linkflow_profile_cache_${isUid ? 'uid_' : ''}${id}`;

    // Helper for public profile: Preloads visual assets & guarantees smooth minimum skeleton display
    const finishPublicLoading = async (profileData?: any) => {
      if (!isUid) {
        if (profileData) {
          const promises: Promise<void>[] = [];
          if (profileData.avatarUrl) {
            promises.push(preloadImage(profileData.avatarUrl));
          }
          if (profileData.theme?.backgroundImageUrl) {
            promises.push(preloadImage(profileData.theme.backgroundImageUrl));
          }
          await Promise.all(promises);
        }

        // Give the public skeleton shimmer a smooth, premium presentation time (minimum 750ms)
        const elapsed = Date.now() - fetchStartTime;
        const minLoadingDuration = 750;
        if (elapsed < minLoadingDuration) {
          await new Promise((resolve) => setTimeout(resolve, minLoadingDuration - elapsed));
        }
        setIsPublicLoading(false);
      }
    };

    // 1. Try loading instantly from localStorage cache (SWR Strategy)
    let cachedProfile: any = null;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.links) {
          parsed.links = parsed.links.map((l: any, i: number) => ({
            ...l,
            id: l.id || l._id || `link-${i}-${Math.random().toString(36).substring(2, 5)}`
          }));
        }
        cachedProfile = parsed;
        setProfile(parsed);
        if (isUid) {
          setLoading(false);
        }
        // NOTE: For public view (!isUid), we do NOT immediately set isPublicLoading(false)
        // to avoid a 0ms flicker and ensure the smooth shimmer plays while fetching freshest data and preloading assets.
      } catch (e) {
        console.error('Failed to parse cached profile', e);
      }
    }

    try {
      const endpoint = isUid ? `/api/profiles/uid/${id}` : `/api/profiles/${id}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && data.links) {
          data.links = data.links.map((l: any, i: number) => ({
            ...l,
            id: l.id || l._id || `link-${i}-${Math.random().toString(36).substring(2, 5)}`
          }));
        }
        setProfile(data);
        setProfileNotFound(false);
        if (isUid) {
          setLoading(false);
        }
        // 2. Save fresh version to cache
        localStorage.setItem(cacheKey, JSON.stringify(data));

        // Preload avatar/background image and smoothly transition public skeleton
        await finishPublicLoading(data);
      } else if (res.status === 404) {
        // Clear stale local storage cache
        localStorage.removeItem(cacheKey);

        if (!isUid) {
          setProfileNotFound(true);
          await finishPublicLoading();
        } else if (autoSaveUserData) {
          // AUTOSAVE: The profile wasn't found in DB (new user or DB deleted), auto-create it now
          const claimedName = sessionStorage.getItem('claimedUsername');
          const suggestedName = claimedName || autoSaveUserData.uid;
          if (claimedName) {
            sessionStorage.removeItem('claimedUsername');
          }

          const newProfile = {
            ...DEFAULT_PROFILE,
            uid: autoSaveUserData.uid,
            username: suggestedName,
            email: autoSaveUserData.email || '',
            displayName: autoSaveUserData.displayName || '',
            avatarUrl: autoSaveUserData.photoURL || DEFAULT_PROFILE.avatarUrl,
          };

          const token = await autoSaveUserData.getIdToken();

          const createRes = await fetch(`/api/profiles/uid/${id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newProfile),
          });

          if (createRes.status === 409) {
            const conflictUsername = suggestedName;
            const finalProfile = { ...newProfile, username: `${suggestedName}-${Math.random().toString(36).substring(2, 5)}` };
            const retryRes = await fetch(`/api/profiles/uid/${id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(finalProfile),
            });
            if (retryRes.ok) {
              setProfile(finalProfile);
              sessionStorage.setItem('claimedUsernameTaken', conflictUsername);
            }
          } else if (createRes.ok) {
            setProfile(newProfile);
          }
        }
      } else {
        if (!isUid) {
          await finishPublicLoading(cachedProfile);
        }
      }
    } catch (err) {
      console.error('Fetch profile failed:', err);
      if (!isUid) {
        await finishPublicLoading(cachedProfile);
      }
    } finally {
      setIsFetching(false);
      if (isUid) {
        setLoading(false);
      }
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${profile.username}`;
    navigator.clipboard.writeText(url);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };



  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setSaveError("Cloudinary configuration missing in environment variables.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
      return;
    }

    // Purana avatar URL save kar lo (delete ke liye)
    const oldAvatarUrl = profile.avatarUrl;

    setIsImageUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (data.secure_url) {
        setProfile(prev => ({ ...prev, avatarUrl: data.secure_url }));

        // Naya avatar set hone ke baad purana Cloudinary se delete karo (silently)
        if (oldAvatarUrl && oldAvatarUrl.includes('cloudinary.com')) {
          try {
            await fetch('/api/cloudinary/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: oldAvatarUrl }),
            });
          } catch (deleteErr) {
            // Delete fail hone pe upload cancel mat karo — silently ignore
            console.warn('Old avatar delete failed (non-critical):', deleteErr);
          }
        }
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      setSaveError(error.message || "Failed to upload image");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
    } finally {
      setIsImageUploading(false);
    }
  };


  const handleGenerateAITheme = () => {
    const hue = Math.floor(Math.random() * 360);
    const hslToHex = (h: number, s: number, l: number): string => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    const isDark = Math.random() < 0.8;
    let bgColor, textColor, btnColor, btnTextColor;

    if (isDark) {
      bgColor = hslToHex(hue, 35, 8);
      textColor = '#f8fafc';
      const btnHue = (hue + 120 + Math.floor(Math.random() * 120)) % 360;
      btnColor = hslToHex(btnHue, 60, 45);
      btnTextColor = '#ffffff';
    } else {
      bgColor = hslToHex(hue, 25, 95);
      textColor = hslToHex(hue, 60, 20);
      btnColor = hslToHex((hue + 180) % 360, 50, 45);
      btnTextColor = '#ffffff';
    }

    setProfile(prev => ({
      ...prev,
      theme: {
        backgroundColor: bgColor,
        textColor: textColor,
        buttonColor: btnColor,
        buttonTextColor: btnTextColor
      }
    }));
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const newLinks = [...profile.links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLinks.length) return;

    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;

    setProfile(prev => ({ ...prev, links: newLinks }));
  };

  const handleLinkClick = async (clickedLink: any) => {
    if (!clickedLink) return;

    // Dynamically find index using stable identity (id, _id, or url)
    const linkIndex = profile.links.findIndex(l =>
      (l.id && l.id === clickedLink.id) ||
      (l._id && l._id === clickedLink._id) ||
      l.url === clickedLink.url
    );

    if (linkIndex === -1) return;

    // Instantly update UI for perfect instantaneous feel
    const newLinks = [...profile.links];
    newLinks[linkIndex].clicks = (newLinks[linkIndex].clicks || 0) + 1;
    setProfile(prev => ({ ...prev, links: newLinks }));

    if (profile.username) {
      try {
        await fetch(`/api/profiles/${profile.username}/links/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: clickedLink.url, linkId: clickedLink.id || clickedLink._id })
        });
      } catch (e) {
        console.warn("Silent analytics save failed:", e);
      }
    }
  };

  const getAnimationProps = (animation?: string, btnColor?: string) => {
    if (animation === 'pulse') {
      return {
        animate: { scale: [1, 1.03, 1] },
        transition: { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
      };
    }
    if (animation === 'wobble') {
      return {
        animate: { rotate: [0, -1.5, 1.5, -1.5, 1.5, 0] },
        transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
      };
    }
    if (animation === 'glow' && btnColor) {
      return {
        animate: {
          boxShadow: [
            `0 0 0px ${btnColor}00`,
            `0 0 15px ${btnColor}80`,
            `0 0 0px ${btnColor}00`
          ]
        },
        transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
      };
    }
    return {};
  };

  // Avatar generation removed - user manages avatar manually



  useEffect(() => {
    // Check for redirect sign-in results and capture errors
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Successfully logged in via redirect:", result.user);
        }
      })
      .catch((err: any) => {
        console.error("Firebase redirect login error:", err);
        let msg = "Google Sign-In failed.";
        if (err?.code === 'auth/web-storage-unsupported' || err?.message?.includes('storage') || err?.message?.includes('cookie')) {
          msg = "Sign-in blocked by adblocker or browser settings. Please disable adblocker/Brave Shields and try again.";
        } else if (err?.code === 'auth/unauthorized-domain') {
          msg = "This domain is not authorized in the Firebase Console. Please add it to your Firebase Authorized Domains list.";
        } else if (err?.message) {
          msg = `Sign-in failed: ${err.message}`;
        }
        setLoginError(msg);
      });

    // Handle public profile routing
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    const isPublicProfile = parts.length === 1 && !['api', 'admin', 'assets', 'static', 'edit', 'preview', 'index.html'].includes(parts[0]);

    if (isPublicProfile) {
      const username = parts[0];
      setView('public');
      fetchProfile(username);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        sessionStorage.removeItem('auth_in_progress');
        if (!isPublicProfile) {
          fetchProfile(currentUser.uid, true, currentUser);
        } else {
          setIsFetching(false);
        }
        // Immediately ensure UID is in state for new users
        setProfile(prev => ({ ...prev, uid: currentUser.uid }));
      } else {
        setIsFetching(false);
        if (sessionStorage.getItem('auth_in_progress') === 'true') {
          sessionStorage.removeItem('auth_in_progress');
          setLoginError("Sign-in blocked by adblocker or browser settings. Please disable adblocker/Brave Shields and try again.");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Live Sync Polling for Public Profiles
  useEffect(() => {
    if (view !== 'public' || !profile.username) return;

    // Periodically poll for updates every 4 seconds
    const interval = setInterval(async () => {
      try {
        const endpoint = `/api/profiles/${profile.username}?poll=true`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const freshData = await res.json();
          // Check if anything has actually changed to avoid unnecessary state triggers
          if (JSON.stringify(freshData.links) !== JSON.stringify(profile.links) ||
            freshData.bio !== profile.bio ||
            freshData.displayName !== profile.displayName ||
            freshData.avatarUrl !== profile.avatarUrl ||
            JSON.stringify(freshData.theme) !== JSON.stringify(profile.theme)) {

            // Assign stable ids to fetched links
            if (freshData.links) {
              freshData.links = freshData.links.map((l: any, i: number) => ({
                ...l,
                id: l.id || l._id || `link-${i}-${Math.random().toString(36).substring(2, 5)}`
              }));
            }
            setProfile(freshData);
          }
        }
      } catch (err) {
        console.warn('Real-time sync polling failed:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [view, profile.username, profile.links, profile.bio, profile.displayName, profile.avatarUrl, profile.theme]);


  // Auto-populate profile with Google data if empty
  useEffect(() => {
    if (user && (!profile.uid || !profile.displayName)) {
      setProfile(prev => {
        return {
          ...prev,
          uid: user.uid,
          username: prev.username,
          email: prev.email || user.email || '',
          displayName: prev.displayName || user.displayName || '',
          avatarUrl: (prev.avatarUrl === DEFAULT_PROFILE.avatarUrl || !prev.avatarUrl)
            ? user.photoURL || prev.avatarUrl
            : prev.avatarUrl,
          bio: prev.bio || ''
        };
      });
    }
  }, [user, profile.displayName]);

  const handleLogin = async () => {
    setLoginError(null);
    sessionStorage.setItem('auth_in_progress', 'true');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        sessionStorage.removeItem('auth_in_progress');
        setProfile(prev => {
          return {
            ...prev,
            uid: result.user.uid,
            username: prev.username,
            email: result.user.email || '',
            displayName: result.user.displayName || '',
            avatarUrl: result.user.photoURL || prev.avatarUrl,
            bio: '' // Ensure bio is empty as requested
          };
        });
      }
    } catch (err: any) {
      console.warn('Popup login failed, attempting redirect login:', err);
      
      const errCode = err?.code || '';
      const errMsg = err?.message || '';
      const isCancellation = errCode === 'auth/popup-closed-by-user' ||
                             errCode === 'auth/cancelled-popup-request' ||
                             errCode === 'auth/request-cancelled' ||
                             errMsg.includes('popup-closed-by-user') ||
                             errMsg.includes('cancelled-popup-request') ||
                             errMsg.includes('popup closed by user');

      if (isCancellation) {
        sessionStorage.removeItem('auth_in_progress');
        return;
      }
      
      const isStorageUnsupported = err?.code === 'auth/web-storage-unsupported' || 
                                   err?.message?.includes('storage') || 
                                   err?.message?.includes('cookie');
      
      if (isStorageUnsupported) {
        sessionStorage.removeItem('auth_in_progress');
        setLoginError("Sign-in blocked by adblocker or browser settings. Please disable adblocker/Brave Shields and try again.");
        return;
      }
      
      if (err?.code === 'auth/unauthorized-domain') {
        sessionStorage.removeItem('auth_in_progress');
        setLoginError("This domain is not authorized in the Firebase Console. Please add it to your Firebase Authorized Domains list.");
        return;
      }

      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirErr: any) {
        console.error('Redirect login failed as well:', redirErr);
        sessionStorage.removeItem('auth_in_progress');
        let msg = "Google Sign-In failed.";
        if (redirErr?.code === 'auth/web-storage-unsupported' || redirErr?.message?.includes('storage') || redirErr?.message?.includes('cookie')) {
          msg = "Sign-in blocked by adblocker or browser settings. Please disable adblocker/Brave Shields and try again.";
        } else if (redirErr?.code === 'auth/unauthorized-domain') {
          msg = "This domain is not authorized in the Firebase Console. Please add it to your Firebase Authorized Domains list.";
        } else if (redirErr?.message) {
          msg = `Sign-in failed: ${redirErr.message}`;
        }
        setLoginError(msg);
      }
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Smooth delay for centered spinner display
      await new Promise(resolve => setTimeout(resolve, 800));
      // 2. Perform Firebase sign out
      await signOut(auth);
      // 3. Reset profile state
      setProfile(DEFAULT_PROFILE);
      setView('edit');
      // 4. Brief buffer for smooth exit to landing page
      await new Promise(resolve => setTimeout(resolve, 350));
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const checkUsernameAvailability = async (val: string) => {
    if (!val) {
      setUsernameStatus('idle');
      return;
    }
    const clean = val.toLowerCase().trim().replace(/[^\w-]/g, '');
    if (clean !== val || val.length < 3) {
      setUsernameStatus('invalid');
      return;
    }
    // If checking their own current username, immediately allow it as available
    if (val.toLowerCase().trim() === (profile.username || '').toLowerCase().trim()) {
      setUsernameStatus('available');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await fetch(`/api/profiles/${val}`);
      if (res.status === 404) {
        setUsernameStatus('available');
      } else {
        setUsernameStatus('taken');
      }
    } catch {
      setUsernameStatus('taken');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (newUsername) {
        checkUsernameAvailability(newUsername);
      } else {
        setUsernameStatus('idle');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [newUsername]);

  const handleSaveUsername = async () => {
    if (usernameStatus !== 'available' || !user) return;
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      
      // Clear old username cache entry to prevent stale storage pollution
      const oldUsername = profile.username;
      if (oldUsername) {
        localStorage.removeItem(`linkflow_profile_cache_${oldUsername}`);
      }

      const updatedProfile = { ...profile, username: newUsername };
      const res = await fetch(`/api/profiles/uid/${user.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProfile),
      });
      if (res.ok) {
        setProfile(updatedProfile);
      } else {
        console.error('Failed to save username');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const executeDeleteAccount = async () => {
    if (!user || deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;

    setIsSaving(true);
    setShowDeleteModal(false);
    try {
      const token = await user.getIdToken();
      // 1. Wipe profile data from MongoDB with authorization token
      const res = await fetch(`/api/profiles/uid/${user.uid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        // Clear local storage cache
        const uidCacheKey = `linkflow_profile_cache_uid_${user.uid}`;
        const usernameCacheKey = `linkflow_profile_cache_${profile.username}`;
        localStorage.removeItem(uidCacheKey);
        localStorage.removeItem(usernameCacheKey);

        // 2. Clear local session & set deletion success indicator
        sessionStorage.clear();
        sessionStorage.setItem('deleteSuccess', 'true');

        // 3. Try to delete the Firebase Auth user account
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await currentUser.delete();
          }
        } catch (fbErr: any) {
          console.warn("Firebase user deletion requires recent login, logging out instead:", fbErr);
        }

        // 4. Force Sign Out
        await signOut(auth);

        // 5. Reset App States
        setProfile(DEFAULT_PROFILE);
        setView('edit');
      } else {
        alert("Failed to delete your database profile. Please try again later.");
      }
    } catch (err) {
      console.error("Delete account failed:", err);
      alert("An unexpected error occurred during account deletion.");
    } finally {
      setIsSaving(false);
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

      // Sanitize profile: Remove MongoDB internal fields and format link URLs securely before sending
      const { _id, __v, ...pureProfileData } = profile as any;

      const sanitizedLinks = (pureProfileData.links || []).map((link: any) => {
        const trimmedUrl = link.url ? link.url.trim() : '';
        if (trimmedUrl && !/^(https?:\/\/|mailto:|tel:)/.test(trimmedUrl) && !trimmedUrl.startsWith('/')) {
          return { ...link, url: `https://${trimmedUrl}` };
        }
        return { ...link, url: trimmedUrl };
      });

      const updatedProfile = { 
        ...pureProfileData, 
        uid: targetUid, 
        username: currentUsername,
        links: sanitizedLinks 
      };

      const token = await user?.getIdToken();

      // Use the final UID for the request
      const res = await fetch(`/api/profiles/uid/${targetUid}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProfile),
      });

      let saveSuccess = false;

      if (res.status === 409) {
        // Handle case where generated username is taken
        const uniqueUsername = `${currentUsername}-${Math.random().toString(36).substring(2, 5)}`;
        const finalProfile = { ...updatedProfile, username: uniqueUsername };

        const retryRes = await fetch(`/api/profiles/uid/${targetUid}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(finalProfile),
        });

        if (retryRes.ok) {
          setProfile(finalProfile);
          saveSuccess = true;
        } else {
          setSaveError("An error occurred while creating your unique link.");
          setShowErrorToast(true);
          setTimeout(() => setShowErrorToast(false), 5000);
          setIsSaving(false);
          return;
        }
      } else if (res.ok) {
        setProfile(updatedProfile);
        saveSuccess = true;
      }

      if (saveSuccess) {
        setIsSavedSuccessfully(true);
        setShowSaveToast(true);
        // Update local storage cache immediately with the saved state to prevent SWR from loading stale data
        const freshProfile = res.ok ? updatedProfile : { ...updatedProfile, username: profile.username };
        localStorage.setItem(`linkflow_profile_cache_uid_${targetUid}`, JSON.stringify(freshProfile));
        localStorage.setItem(`linkflow_profile_cache_${freshProfile.username}`, JSON.stringify(freshProfile));

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
        const msg = errorData.reason 
          ? `${errorData.error} - ${errorData.reason}` 
          : (errorData.error || errorData.details || "Failed to save profile. Please try again.");
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
      <AnimatePresence mode="wait">
        {isPublicLoading ? (
          <PublicProfileSkeleton key="public-skeleton" />
        ) : profileNotFound ? (
          <motion.div
            key="public-404"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className="min-h-screen w-full overflow-hidden flex items-center justify-center p-6 bg-[#090d16]"
          >
            {/* Radial Mesh Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/10 blur-[120px]" />

            <div className="w-full max-w-md text-center p-8 bg-slate-900/30 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shadow-md">
                <EyeOff size={28} />
              </div>

              <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">404 - Profile Not Found</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                This link is not active or has been deleted. Make sure you typed the correct address.
              </p>

              <div className="h-[1px] bg-white/5 w-full mb-6" />

              <a
                href="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
              >
                Create Your Own LinkFlow Page →
              </a>
            </div>
          </motion.div>
        ) : profile.isActive === false ? (
          <motion.div
            key="public-offline"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className="min-h-screen w-full overflow-hidden flex items-center justify-center p-6 bg-[#090d16]"
          >
            {/* Radial Mesh Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/40 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/40 blur-[120px]" />

            <div className="w-full max-w-md text-center p-8 bg-slate-900/30 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 bg-slate-800/80 rounded-2xl flex items-center justify-center text-slate-500 shadow-md">
                <EyeOff size={28} />
              </div>

              <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Profile Currently Offline</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                The owner of this link has temporarily disabled public access to their page. Please check back later.
              </p>

              <div className="h-[1px] bg-white/5 w-full mb-6" />

              <a
                href="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
              >
                Create Your Own LinkFlow Page →
              </a>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={profile.username || 'public-profile'}
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen w-full overflow-y-auto px-3 sm:px-4 py-8 sm:py-16 flex flex-col items-center justify-start relative overflow-x-hidden"
            style={{ backgroundColor: profile.theme.backgroundColor, color: profile.theme.textColor }}
          >
            {/* Background Image Layer if present */}
            {profile.theme.backgroundImageUrl && (
              <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-300"
              style={{
                backgroundImage: `url(${profile.theme.backgroundImageUrl})`,
                filter: profile.theme.backgroundBlur ? `blur(${profile.theme.backgroundBlur}px)` : 'none',
                transform: profile.theme.backgroundBlur ? 'scale(1.08)' : 'none',
              }}
            />
            {/* Dimmer overlay for text contrast */}
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                backgroundColor: '#000000',
                opacity: typeof profile.theme.backgroundOverlay === 'number' ? profile.theme.backgroundOverlay : 0.35,
              }}
            />
          </div>
        )}
        <div className="w-full max-w-md text-center relative z-10">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-spin-slow opacity-30 blur-md"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-spin-slow"></div>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              src={profile.avatarUrl}
              alt="Avatar"
              className="absolute inset-[3px] w-[calc(100%-6px)] h-[calc(100%-6px)] rounded-full object-cover shadow-2xl"
              style={{ border: `3px solid ${profile.theme.backgroundColor}` }}
              referrerPolicy="no-referrer"
            />
          </div>
          <motion.h1
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-xl font-extrabold mb-1 tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient"
          >
            {profile.displayName}
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="text-xs opacity-60 mb-4 font-semibold tracking-wide"
          >
            @{profile.username}
          </motion.p>
          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-sm opacity-80 mb-6 max-w-xs mx-auto leading-relaxed whitespace-pre-wrap"
          >
            {profile.bio || "No bio yet."}
          </motion.p>
          {/* Optimized Link Layout */}
          <div className="space-y-6">
            {/* Social Icons Row */}
            {profile.links.filter(l => l.isActive !== false && !l.embed && (l.display === 'icon' || (l.display !== 'card' && profile.socialLinksStyle === 'grid' && l.icon !== 'globe'))).length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {profile.links
                  .filter(l => l.isActive !== false && !l.embed && (l.display === 'icon' || (l.display !== 'card' && profile.socialLinksStyle === 'grid' && l.icon !== 'globe')))
                  .map((link, idx) => {
                    const Icon = ICON_MAP[link.icon] || Globe;
                    const animProps = getAnimationProps(link.animation, profile.theme.buttonColor);
                    return (
                      <motion.a
                        key={idx}
                        whileHover={{ scale: 1.15, y: -3, boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.3)" }}
                        whileTap={{ scale: 0.9 }}
                        {...animProps}
                        href={link.url}
                        onClick={() => handleLinkClick(link)}
                        target={/^(mailto:|tel:)/.test(link.url) ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className={`w-10 h-10 flex items-center justify-center transition-all relative group overflow-hidden ${getSocialIconStyleClasses(profile.theme.buttonStyle)}`}
                        style={{ backgroundColor: profile.theme.buttonColor, color: profile.theme.buttonTextColor }}
                        title={link.title}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        {link.thumbnailUrl ? (
                          <img src={link.thumbnailUrl} alt={link.title} className="w-5 h-5 rounded-full object-cover relative z-10" />
                        ) : (
                          <Icon size={18} className="relative z-10" />
                        )}
                      </motion.a>
                    );
                  })}
              </div>
            )}

            {/* Primary Links & Bar Socials */}
            <div className="space-y-4">
              {profile.links
                .filter(l => l.isActive !== false && (l.embed || l.display === 'card' || (l.display !== 'icon' && (profile.socialLinksStyle === 'list' || l.icon === 'globe'))))
                .map((link, idx) => {
                  const Icon = ICON_MAP[link.icon] || Globe;
                  const animProps = getAnimationProps(link.animation, profile.theme.buttonColor);

                  // If interactive player is enabled, show ONLY the player without the card and icon
                  if (link.embed && isEmbeddableUrl(link.url)) {
                    return (
                      <div key={link.id || idx} className="w-full my-1">
                        <MediaEmbed url={link.url} title={link.title} autoplay={link.autoplay} embedType={link.embedType} />
                      </div>
                    );
                  }

                  return (
                    <motion.a
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ 
                        scale: 1.03, 
                        y: -3,
                        boxShadow: "0 15px 30px -5px rgba(99, 102, 241, 0.25), 0 10px 15px -6px rgba(99, 102, 241, 0.25)",
                        borderColor: "rgba(99, 102, 241, 0.4)"
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ delay: 0.35 + idx * 0.08, type: "spring", stiffness: 260, damping: 20 }}
                      {...animProps}
                      href={link.url}
                      onClick={() => handleLinkClick(link)}
                      target={/^(mailto:|tel:)/.test(link.url) ? '_self' : '_blank'}
                      rel="noopener noreferrer"
                      className={`block w-full px-3.5 py-4 transition-all flex items-center justify-between group overflow-hidden relative ${getButtonStyleClasses(profile.theme.buttonStyle)}`}
                      style={{ backgroundColor: profile.theme.buttonColor, color: profile.theme.buttonTextColor }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <div className="flex items-center gap-3 relative z-10 w-full min-w-0">
                        {link.thumbnailUrl ? (
                          <img src={link.thumbnailUrl} alt={link.title} className="w-7 h-7 rounded-lg object-cover shadow-sm shrink-0" />
                        ) : (
                          <Icon size={18} className="drop-shadow-sm shrink-0" />
                        )}
                        <div className="text-left min-w-0 flex-1">
                          <p className="font-bold text-sm tracking-tight drop-shadow-sm leading-tight truncate">{link.title}</p>
                          {link.description && (
                            <p className="text-[11.5px] text-white/80 mt-1 whitespace-pre-wrap leading-tight text-left break-words">{link.description}</p>
                          )}
                        </div>
                        <ExternalLink size={14} className="opacity-40 group-hover:opacity-100 transition-opacity relative z-10 shrink-0 ml-auto" />
                      </div>
                    </motion.a>
                  );
                })}
            </div>

            {/* Email Capture Widget in Public Profile */}
            {profile.emailCaptureEnabled && (
              <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <p className="text-xs font-bold mb-2.5 text-center opacity-90">
                  Join my newsletter & updates
                </p>
                <EmailCaptureWidget
                  username={profile.username}
                  buttonColor={profile.theme.buttonColor}
                  buttonTextColor={profile.theme.buttonTextColor}
                  buttonStyle={profile.theme.buttonStyle}
                />
              </div>
            )}
          </div>

          <div className="mt-20 pt-12 border-t border-white/10">
            <div className="flex justify-center gap-6 opacity-60 mb-6">
              {profile.links.filter(l => l.isActive !== false).slice(0, 5).map((link, idx) => {
                const Icon = ICON_MAP[link.icon] || Globe;
                return <Icon key={idx} size={24} />;
              })}
            </div>
            <a
              href="https://link-flow-program.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-[0.2em] opacity-40 hover:opacity-80 transition-opacity font-extrabold relative z-10 hover:underline cursor-pointer inline-block"
            >
              Powered by LinkFlow
            </a>
          </div>
        </div>
      </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-md"></div>
        </div>
        <p className="text-slate-400 font-bold text-sm mt-6 tracking-wide animate-pulse">Initializing LinkFlow...</p>
      </div>
    );
  }

  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient Radial Mesh Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 blur-[130px] pointer-events-none" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -15 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative flex flex-col items-center text-center p-8 sm:p-10 rounded-3xl bg-slate-900/40 border border-white/10 shadow-2xl backdrop-blur-2xl max-w-sm w-full z-10"
        >
          {/* Glowing Center Spinner */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 border-r-purple-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
              <LogOut size={20} className="animate-pulse" />
            </div>
          </div>

          <h3 className="text-xl font-black text-white tracking-tight mb-1.5">
            Signing Out...
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Safely closing session and returning to home
          </p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full min-h-screen"
      >
        <LandingPage 
          onLogin={handleLogin} 
          loginError={loginError || undefined} 
          clearLoginError={() => setLoginError(null)} 
        />
      </motion.div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#070a13] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Dynamic Background Radial Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] aspect-square rounded-full bg-purple-900/8 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293703_1px,transparent_1px),linear-gradient(to_bottom,#1f293703_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-40" />

      <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-950/60 border-b border-white/5 backdrop-blur-xl z-50 px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/favicon.png"
            alt="LinkFlow Logo"
            className="w-9 h-9 rounded-xl shadow-lg border border-white/10 object-cover"
          />
          <span className="font-extrabold text-xl tracking-tight hidden sm:block bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">LinkFlow</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 bg-slate-950/50 border border-white/5 p-1 rounded-full lg:hidden">
          <button
            onClick={() => handleSetView('edit')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 ${view === 'edit'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md text-white scale-100'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Edit3 size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Editor</span>
          </button>
          <button
            onClick={() => handleSetView('preview')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 ${view === 'preview'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md text-white scale-100'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Eye size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex flex-col items-end gap-0.5 mr-2">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Public Link</span>
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 group bg-indigo-500/5 px-3 py-1.5 rounded-full border border-indigo-500/10 transition-all hover:bg-indigo-500/10"
            >
              link-flow-program.vercel.app/{profile.username || '...'}
              <ExternalLink size={10} className="group-hover:scale-110 transition-transform" />
            </a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user && (
              <>
                <button
                  onClick={() => setShowQRModal(true)}
                  className="bg-slate-900 border border-white/10 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                  title="Generate QR Code"
                >
                  <QrCode size={14} className="text-indigo-400" />
                  <span>QR Code</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="bg-slate-900 border border-white/10 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                >
                  {isCopying ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
                  <span>{isCopying ? 'Copied!' : 'Share'}</span>
                </button>
              </>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !user}
              className={`${isSavedSuccessfully ? 'bg-green-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
                } text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 min-w-[85px] justify-center hover:shadow-lg hover:shadow-indigo-600/20`}
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
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-9 h-9 rounded-full border border-white/10 shrink-0 object-cover" />
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all duration-200 p-2.5 active:scale-90"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-xs sm:text-sm bg-white/5 border border-white/10 px-4 py-2 rounded-xl transition-all"
            >
              <LogIn size={18} /> <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Mobile Actions Menu (Visible only on small screens) */}
          <div className="md:hidden flex items-center gap-1">
            {user && (
              <>
                <button
                  onClick={() => setShowQRModal(true)}
                  className="p-2.5 text-slate-400 hover:text-white"
                  title="QR Code"
                >
                  <QrCode size={18} className="text-indigo-400" />
                </button>
                <button
                  onClick={handleCopyLink}
                  className="p-2.5 text-slate-400 hover:text-white"
                  title="Share Profile"
                >
                  {isCopying ? <Check size={18} className="text-green-400" /> : <Share2 size={18} />}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`p-2.5 transition-colors ${isSavedSuccessfully ? 'text-green-500' : 'text-indigo-400'} hover:opacity-80 disabled:opacity-50`}
                  title="Save Changes"
                >
                  {isSavedSuccessfully ? <Check size={18} /> : <Save size={18} className={isSaving ? 'animate-pulse' : ''} />}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-12 px-4 lg:px-8 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-24">
        {/* Left Column: Editor */}
        <div className={`space-y-8 ${view === 'preview' ? 'hidden lg:block' : 'block'}`}>
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

              <div className={`space-y-6 transition-all duration-300 ${isFetching ? 'opacity-20 pointer-events-none scale-[0.98] blur-[2px]' : 'opacity-100'}`}>
                {/* Editor Tab Navigation */}
                <div className="flex items-center justify-between overflow-x-auto scrollbar-hide bg-slate-950/40 border border-white/5 p-1.5 rounded-2xl gap-1 mb-6">
                  {[
                    { id: 'links', label: 'Links', icon: Link },
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'appearance', label: 'Appearance', icon: Palette },
                    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                    { id: 'settings', label: 'Settings', icon: Settings },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = editorTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setEditorTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold transition-all duration-200 min-w-[90px] sm:min-w-0 ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md text-white scale-100 border border-indigo-500/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <Icon size={14} className="shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={editorTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {editorTab === 'links' && (
                      <section className="bg-slate-900/30 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                              <Link size={20} />
                            </div>
                            <h2 className="text-lg font-extrabold text-white tracking-tight font-sans">Manage Links</h2>
                          </div>
                          <button
                            onClick={() => {
                              const newId = `link-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
                              setProfile({
                                ...profile,
                                links: [
                                  ...profile.links,
                                  { id: newId, title: 'New Link', url: '', icon: 'globe', isActive: true, display: 'card' }
                                ]
                              });
                              setExpandedLinkId(newId);
                            }}
                            className="text-indigo-400 hover:bg-indigo-500/10 p-2.5 rounded-xl border border-white/5 transition-all"
                            title="Add New Link"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                        <div className="space-y-4">
                          {/* Real-time Link Preview (Icon-only) */}
                          {profile.links.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-3 bg-slate-950/40 rounded-2xl border border-dashed border-white/10 mb-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest w-full mb-1">Quick Preview</span>
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

                          <AnimatePresence initial={false}>
                            {profile.links.map((link, idx) => {
                              const isExpanded = expandedLinkId === (link.id || String(idx));
                              return (
                                <motion.div
                                  key={link.id || `link-${idx}`}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  transition={{ duration: 0.2 }}
                                  className="p-4 bg-slate-950/30 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-200 group relative"
                                >
                                  <div 
                                    className="flex items-center justify-between gap-4 cursor-pointer select-none"
                                    onClick={() => setExpandedLinkId(isExpanded ? null : (link.id || String(idx)))}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {/* Up & Down Reorder Buttons */}
                                      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            if (idx > 0) {
                                              const newLinks = [...profile.links];
                                              const temp = newLinks[idx];
                                              newLinks[idx] = newLinks[idx - 1];
                                              newLinks[idx - 1] = temp;
                                              setProfile({ ...profile, links: newLinks });
                                            }
                                          }}
                                          disabled={idx === 0}
                                          className={`p-1.5 rounded-lg transition-colors ${idx === 0
                                              ? 'text-slate-800 cursor-not-allowed opacity-20'
                                              : 'text-slate-400 hover:text-indigo-400 hover:bg-white/5 active:scale-90'
                                            }`}
                                          title="Move Up"
                                        >
                                          <ChevronUp size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            if (idx < profile.links.length - 1) {
                                              const newLinks = [...profile.links];
                                              const temp = newLinks[idx];
                                              newLinks[idx] = newLinks[idx + 1];
                                              newLinks[idx + 1] = temp;
                                              setProfile({ ...profile, links: newLinks });
                                            }
                                          }}
                                          disabled={idx === profile.links.length - 1}
                                          className={`p-1.5 rounded-lg transition-colors ${idx === profile.links.length - 1
                                              ? 'text-slate-800 cursor-not-allowed opacity-20'
                                              : 'text-slate-400 hover:text-indigo-400 hover:bg-white/5 active:scale-90'
                                            }`}
                                          title="Move Down"
                                        >
                                          <ChevronDown size={15} />
                                        </button>
                                      </div>

                                      {/* Icon Selector Button */}
                                      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          onClick={() => {
                                            const currentOpen = activeIconPickerIdx === idx ? null : idx;
                                            setActiveIconPickerIdx(currentOpen);
                                          }}
                                          className="w-9 h-9 rounded-lg bg-slate-950/60 border border-white/10 hover:border-indigo-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
                                          title="Choose Icon"
                                        >
                                          {(() => {
                                            const IconComp = ICON_MAP[link.icon] || Globe;
                                            return <IconComp size={16} />;
                                          })()}
                                        </button>

                                        {/* Floating icon selector picker */}
                                        {activeIconPickerIdx === idx && (
                                          <>
                                            <div
                                              className="fixed inset-0 z-10"
                                              onClick={() => setActiveIconPickerIdx(null)}
                                            />
                                            <div className="absolute left-0 mt-2 p-2 bg-slate-950 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl z-20 w-72 grid grid-cols-6 gap-1.5">
                                              {Object.keys(ICON_MAP).map((iconName) => {
                                                const PickerIcon = ICON_MAP[iconName];
                                                return (
                                                  <button
                                                    key={iconName}
                                                    onClick={() => {
                                                      const newLinks = [...profile.links];
                                                      newLinks[idx].icon = iconName;
                                                      setProfile({ ...profile, links: newLinks });
                                                      setActiveIconPickerIdx(null);
                                                    }}
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${link.icon === iconName
                                                        ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                      }`}
                                                    title={iconName}
                                                  >
                                                    <PickerIcon size={16} />
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      {/* Title */}
                                      <span className="font-extrabold text-sm text-slate-200 truncate">
                                        {link.title || 'Untitled Link'}
                                      </span>
                                    </div>

                                    {/* Action items on header */}
                                    <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      {/* Show/Hide Switch */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const newLinks = [...profile.links];
                                          newLinks[idx] = { 
                                            ...newLinks[idx], 
                                            isActive: newLinks[idx].isActive !== false ? false : true 
                                          };
                                          setProfile({ ...profile, links: newLinks });
                                        }}
                                        className={`relative w-8 h-4 rounded-full transition-colors duration-150 focus:outline-none ${link.isActive !== false ? 'bg-green-500' : 'bg-slate-800'
                                          }`}
                                      >
                                        <span
                                          className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-150 ${link.isActive !== false ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                        />
                                      </button>

                                      {/* Expand indicator */}
                                      <div
                                        onClick={() => setExpandedLinkId(isExpanded ? null : (link.id || String(idx)))}
                                        className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                      >
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expanded Content Details */}
                                  <AnimatePresence initial={false}>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden mt-4 pt-4 border-t border-white/5 space-y-4"
                                      >
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                                            {link.embed ? (link.embedType === 'music' ? 'Music / Song Title' : 'Video Title') : 'Link Title'}
                                          </label>
                                          <input
                                            type="text"
                                            value={link.title}
                                            placeholder={link.embed ? (link.embedType === 'music' ? "e.g. Song Name (defaults to 'YouTube Audio Track')" : "e.g. Video Title") : "e.g. My Website"}
                                            onChange={(e) => {
                                              const newLinks = [...profile.links];
                                              newLinks[idx].title = e.target.value;
                                              setProfile({ ...profile, links: newLinks });
                                            }}
                                            className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 text-white rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none text-sm font-semibold"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Link URL</label>
                                          <div className="relative">
                                            <input
                                              type="text"
                                              value={link.url}
                                              placeholder="https://..."
                                              onChange={(e) => {
                                                const newUrl = e.target.value;
                                                const newLinks = [...profile.links];
                                                newLinks[idx].url = newUrl;
                                                newLinks[idx].icon = detectIcon(newUrl);
                                                setProfile({ ...profile, links: newLinks });
                                              }}
                                              onBlur={(e) => {
                                                const val = e.target.value.trim();
                                                if (val && !/^(https?:\/\/|mailto:|tel:)/.test(val) && !val.startsWith('/')) {
                                                  const formatted = `https://${val}`;
                                                  const newLinks = [...profile.links];
                                                  newLinks[idx].url = formatted;
                                                  newLinks[idx].icon = detectIcon(formatted);
                                                  setProfile({ ...profile, links: newLinks });
                                                }
                                              }}
                                              className={`w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 text-white rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none text-sm font-semibold ${link.url && !/^(https?:\/\/|mailto:|tel:)/.test(link.url)
                                                ? 'text-red-400 border-red-500/30'
                                                : 'text-indigo-400'
                                                }`}
                                            />
                                            {link.url && !/^(https?:\/\/|mailto:|tel:)/.test(link.url) && (
                                              <p className="text-[10px] text-red-400 mt-1.5 font-medium animate-pulse">
                                                URL must start with http://, https://, or mailto:
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Description (Hidden when interactive embed player is active) */}
                                        {!link.embed && (
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                                            <textarea
                                              value={link.description || ''}
                                              placeholder="Short description..."
                                              onChange={(e) => {
                                                const newLinks = [...profile.links];
                                                newLinks[idx].description = e.target.value;
                                                setProfile({ ...profile, links: newLinks });
                                              }}
                                              rows={2}
                                              className="w-full bg-slate-950/60 text-xs text-white font-bold placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 border border-white/5 focus:border-indigo-500/40 px-3.5 py-2.5 rounded-xl transition-all resize-none min-h-[3rem]"
                                            />
                                          </div>
                                        )}

                                        {/* Media Embed Toggle for YouTube & Spotify */}
                                        {isEmbeddableUrl(link.url) && (
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                              <div>
                                                <p className="text-xs font-bold text-indigo-300">Embed Interactive Player</p>
                                                <p className="text-[10px] text-slate-400">
                                                  {link.embed
                                                    ? 'Player mode active — Card, icon & animations are hidden'
                                                    : 'Play video/audio directly on your profile'}
                                                </p>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  const newLinks = [...profile.links];
                                                  newLinks[idx] = { ...newLinks[idx], embed: !newLinks[idx].embed };
                                                  setProfile({ ...profile, links: newLinks });
                                                }}
                                                className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                                                  link.embed ? 'bg-indigo-600' : 'bg-slate-800'
                                                }`}
                                              >
                                                <span
                                                  className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                                                    link.embed ? 'translate-x-4' : 'translate-x-0'
                                                  }`}
                                                />
                                              </button>
                                            </div>

                                            {/* Sub-toggle: Autoplay on page load (visible when embed is toggled ON) */}
                                            {link.embed && (
                                              <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                                                <div>
                                                  <p className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                                                    <span>⚡</span> Autoplay on Open
                                                  </p>
                                                  <p className="text-[10px] text-slate-400">
                                                    Automatically start playing when visitor opens your profile
                                                  </p>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    const newLinks = [...profile.links];
                                                    newLinks[idx] = { ...newLinks[idx], autoplay: !newLinks[idx].autoplay };
                                                    setProfile({ ...profile, links: newLinks });
                                                  }}
                                                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
                                                    link.autoplay ? 'bg-purple-600' : 'bg-slate-800'
                                                  }`}
                                                >
                                                  <span
                                                    className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                                                      link.autoplay ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                                  />
                                                </button>
                                              </div>
                                            )}

                                            {/* Style Selector for YouTube & Spotify: Full Player vs Minimal Card */}
                                            {link.embed && (
                                              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                                      <span>🎧</span> {isYouTubeUrl(link.url) ? 'YouTube Player Style' : 'Spotify Player Style'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                      {isYouTubeUrl(link.url)
                                                        ? ((link.embedType || 'video') === 'music'
                                                            ? 'Minimal music card with soundwave & thumbnail (no large video box)'
                                                            : 'Full 16:9 interactive YouTube video player')
                                                        : (link.embedType === 'music'
                                                            ? 'Compact 80px minimal audio bar'
                                                            : 'Standard Spotify interactive music player')}
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      const newLinks = [...profile.links];
                                                      newLinks[idx] = { ...newLinks[idx], embedType: 'video' };
                                                      setProfile({ ...profile, links: newLinks });
                                                    }}
                                                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                                                      (link.embedType || 'video') === 'video'
                                                        ? 'bg-rose-600/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-950/40 ring-1 ring-rose-500/30'
                                                        : 'bg-slate-950/50 text-slate-400 border-white/5 hover:border-white/10 hover:text-white'
                                                    }`}
                                                  >
                                                    {isYouTubeUrl(link.url) ? (
                                                      <Youtube size={15} className={(link.embedType || 'video') === 'video' ? 'text-rose-400' : ''} />
                                                    ) : (
                                                      <Sliders size={15} className={(link.embedType || 'video') === 'video' ? 'text-rose-400' : ''} />
                                                    )}
                                                    {isYouTubeUrl(link.url) ? 'Video Player' : 'Standard Player'}
                                                  </button>

                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      const newLinks = [...profile.links];
                                                      newLinks[idx] = { ...newLinks[idx], embedType: 'music' };
                                                      setProfile({ ...profile, links: newLinks });
                                                    }}
                                                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                                                      link.embedType === 'music'
                                                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                                                        : 'bg-slate-950/50 text-slate-400 border-white/5 hover:border-white/10 hover:text-white'
                                                    }`}
                                                  >
                                                    <Music size={15} className={link.embedType === 'music' ? 'text-emerald-400' : ''} />
                                                    {isYouTubeUrl(link.url) ? 'Minimal Music Card' : 'Compact Mini Bar'}
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Highlight Animation (Hidden when embed is active) */}
                                        {!link.embed && (
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                                              Highlight Animation
                                            </label>
                                            <div className="grid grid-cols-4 gap-1.5">
                                              {(['none', 'pulse', 'wobble', 'glow'] as const).map((anim) => {
                                                const isSelected = (link.animation || 'none') === anim;
                                                return (
                                                  <button
                                                    key={anim}
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      const newLinks = [...profile.links];
                                                      newLinks[idx] = { ...newLinks[idx], animation: anim };
                                                      setProfile({ ...profile, links: newLinks });
                                                    }}
                                                    className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                                                      isSelected
                                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                                                        : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                                                    }`}
                                                  >
                                                    {anim}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                          {!link.embed ? (
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Display Mode:</span>
                                              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-white/5 text-[10px]">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    const newLinks = [...profile.links];
                                                    newLinks[idx] = { ...newLinks[idx], display: 'card' };
                                                    setProfile({ ...profile, links: newLinks });
                                                  }}
                                                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                                                    link.display !== 'icon'
                                                      ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-sm'
                                                      : 'text-slate-400 hover:text-white'
                                                  }`}
                                                >
                                                  Card
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    const newLinks = [...profile.links];
                                                    newLinks[idx] = { ...newLinks[idx], display: 'icon' };
                                                    setProfile({ ...profile, links: newLinks });
                                                  }}
                                                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                                                    link.display === 'icon'
                                                      ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-sm'
                                                      : 'text-slate-400 hover:text-white'
                                                  }`}
                                                >
                                                  Icon
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                                              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                                              Player Mode (Card & Icon Hidden)
                                            </span>
                                          )}

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              const newLinks = profile.links.filter((_, i) => i !== idx);
                                              setProfile({ ...profile, links: newLinks });
                                            }}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/10 transition-all text-[11px] font-bold flex items-center gap-1.5"
                                          >
                                            <Trash2 size={13} />
                                            Delete Link
                                          </button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </section>
                    )}

                    {editorTab === 'profile' && (
                      <section className="bg-slate-900/30 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                            <User size={20} />
                          </div>
                          <h2 className="text-lg font-extrabold text-white tracking-tight font-sans">Profile Info</h2>
                        </div>

                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="relative group shrink-0">
                              <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                              <label
                                htmlFor="avatar-upload"
                                className={`block cursor-pointer relative ${isImageUploading ? 'pointer-events-none opacity-70' : ''}`}
                              >
                                <img
                                  src={profile.avatarUrl}
                                  alt="Avatar"
                                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 hover:border-indigo-500/40 transition-all shadow-md"
                                  referrerPolicy="no-referrer"
                                />
                                <div className={`absolute inset-0 rounded-2xl flex items-center justify-center transition-all ${isImageUploading ? 'opacity-100 bg-black/40' : 'opacity-0 bg-black/40 hover:opacity-100'}`}>
                                  {isImageUploading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
                                  )}
                                </div>
                              </label>
                            </div>
                            <div className="flex-1 space-y-4 w-full">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Display Name</label>
                                <input
                                  type="text"
                                  value={profile.displayName}
                                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                  className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 text-white rounded-2xl focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700 font-medium"
                                  placeholder="Your Name"
                                />
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-semibold tracking-wide">
                                  Your Public Link: <span className="font-bold text-indigo-400">link-flow-program.vercel.app/{profile.username}</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Bio</label>
                              <button
                                type="button"
                                onClick={() => setShowBioModal(true)}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-all active:scale-95"
                              >
                                <Sparkles size={12} className="text-indigo-400" />
                                <span>AI Bio Generator</span>
                              </button>
                            </div>
                            <textarea
                              value={profile.bio}
                              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 text-white rounded-2xl focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all h-28 resize-none placeholder:text-slate-700 text-sm leading-relaxed"
                              placeholder="Tell the world about yourself..."
                            />
                          </div>
                        </div>
                      </section>
                    )}

                    {editorTab === 'appearance' && (
                      <div className="space-y-6">
                        {/* 1. Preset Templates */}
                        <section className="bg-slate-900/30 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                                <Palette size={20} />
                              </div>
                              <div>
                                <h2 className="text-lg font-extrabold text-white tracking-tight">Templates</h2>
                                <p className="text-xs text-slate-400">Curated premium profile themes</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowTemplateModal(true)}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                            >
                              <span>Explore All (20+)</span>
                              <Sparkles size={13} className="text-indigo-400" />
                            </button>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-3.5">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Featured Quick Select</label>
                              <span className="text-[11px] text-slate-500">Tap to apply instantly</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {TEMPLATES.slice(0, 4).map((tpl) => {
                                const active = isTemplateActive(tpl.theme, profile.theme);
                                return (
                                  <button
                                    key={tpl.id}
                                    type="button"
                                    onClick={() => setProfile({ ...profile, theme: { ...tpl.theme } })}
                                    className={`group relative flex flex-col items-center gap-2 p-2.5 rounded-2xl border transition-all text-left overflow-hidden ${
                                      active
                                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/40 shadow-lg'
                                        : 'border-white/10 bg-slate-950/40 hover:border-indigo-500/40 hover:bg-white/5'
                                    }`}
                                  >
                                    <div
                                      className="w-full aspect-[4/3] rounded-xl shadow-inner flex flex-col justify-center items-center gap-1.5 p-2 relative overflow-hidden border border-white/5"
                                      style={{ backgroundColor: tpl.theme.backgroundColor }}
                                    >
                                      {/* Floating Badge on top-left of preview */}
                                      {tpl.badge && (
                                        <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                                          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tight shadow-sm ${
                                            tpl.badge === 'Default'
                                              ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                              : 'bg-indigo-600 text-white shadow-indigo-600/30'
                                          }`}>
                                            {tpl.badge}
                                          </span>
                                        </div>
                                      )}
                                      {/* Mini Avatar dot */}
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-sm" />
                                      {/* Mini Link button bars */}
                                      <div
                                        className={`w-full h-2 shadow-sm ${getButtonStyleClasses(tpl.theme.buttonStyle)}`}
                                        style={{ backgroundColor: tpl.theme.buttonColor }}
                                      />
                                      <div
                                        className={`w-3/4 h-2 opacity-80 ${getButtonStyleClasses(tpl.theme.buttonStyle)}`}
                                        style={{ backgroundColor: tpl.theme.buttonColor }}
                                      />
                                    </div>
                                    <div className="w-full px-1 pt-0.5 text-center sm:text-left">
                                      <span className="text-xs font-bold text-white block truncate leading-tight" title={tpl.name}>
                                        {tpl.name}
                                      </span>
                                    </div>
                                    {active && (
                                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md ring-2 ring-slate-900 z-10">
                                        <Check size={11} />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </section>

                        {/* 2. Card & Button Shape */}
                        <section className="bg-slate-900/30 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                              <Sliders size={20} />
                            </div>
                            <div>
                              <h2 className="text-lg font-extrabold text-white tracking-tight">Card & Button Shape</h2>
                              <p className="text-xs text-slate-400">Geometry and outline for links & social icons</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {[
                              { id: 'rounded', name: 'Rounded', desc: 'Classic 12px', preview: 'rounded-xl' },
                              { id: 'pill', name: 'Pill', desc: 'Capsule Round', preview: 'rounded-full' },
                              { id: 'sharp', name: 'Sharp', desc: 'Modern Box', preview: 'rounded-none' },
                              { id: 'glass', name: 'Glass', desc: 'Frosted Outline', preview: 'rounded-2xl border-white/40' },
                              { id: 'shadow', name: 'Brutal', desc: '3D Pop Shadow', preview: 'rounded-xl shadow-[3px_3px_0px_#6366f1]' },
                            ].map((shape) => {
                              const isSelected = (profile.theme.buttonStyle || 'rounded') === shape.id;
                              return (
                                <button
                                  key={shape.id}
                                  type="button"
                                  onClick={() => setProfile({ ...profile, theme: { ...profile.theme, buttonStyle: shape.id as any } })}
                                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center group ${
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                                      : 'border-white/5 bg-slate-950/40 hover:border-white/20 hover:bg-white/5'
                                  }`}
                                >
                                  <div className="w-full h-8 flex items-center justify-center">
                                    <div className={`w-14 h-6 border-2 ${isSelected ? 'border-indigo-400 bg-indigo-500/30' : 'border-slate-500 bg-slate-800/60'} ${shape.preview} transition-all`} />
                                  </div>
                                  <span className={`text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>{shape.name}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">{shape.desc}</span>
                                </button>
                              );
                            })}
                          </div>
                        </section>

                        {/* 3. Custom Colors */}
                        <section className="bg-slate-900/30 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0 shadow-inner">
                              <Palette size={20} />
                            </div>
                            <div>
                              <h2 className="text-lg font-extrabold text-white tracking-tight">Custom Colors</h2>
                              <p className="text-xs text-slate-400">Fine-tune individual colors for your profile</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Background</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={profile.theme.backgroundColor}
                                  onChange={(e) => setProfile({ ...profile, theme: { ...profile.theme, backgroundColor: e.target.value } })}
                                  className="w-12 h-12 bg-slate-950/60 border border-white/10 p-1.5 rounded-2xl cursor-pointer hover:border-white/20 transition-all shrink-0"
                                />
                                <span className="text-xs font-mono text-slate-400 uppercase">{profile.theme.backgroundColor}</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Text Color</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={profile.theme.textColor}
                                  onChange={(e) => setProfile({ ...profile, theme: { ...profile.theme, textColor: e.target.value } })}
                                  className="w-12 h-12 bg-slate-950/60 border border-white/10 p-1.5 rounded-2xl cursor-pointer hover:border-white/20 transition-all shrink-0"
                                />
                                <span className="text-xs font-mono text-slate-400 uppercase">{profile.theme.textColor}</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Button Color</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={profile.theme.buttonColor}
                                  onChange={(e) => setProfile({ ...profile, theme: { ...profile.theme, buttonColor: e.target.value } })}
                                  className="w-12 h-12 bg-slate-950/60 border border-white/10 p-1.5 rounded-2xl cursor-pointer hover:border-white/20 transition-all shrink-0"
                                />
                                <span className="text-xs font-mono text-slate-400 uppercase">{profile.theme.buttonColor}</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Button Text</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={profile.theme.buttonTextColor}
                                  onChange={(e) => setProfile({ ...profile, theme: { ...profile.theme, buttonTextColor: e.target.value } })}
                                  className="w-12 h-12 bg-slate-950/60 border border-white/10 p-1.5 rounded-2xl cursor-pointer hover:border-white/20 transition-all shrink-0"
                                />
                                <span className="text-xs font-mono text-slate-400 uppercase">{profile.theme.buttonTextColor}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleGenerateAITheme();
                              }}
                              className="col-span-2 mt-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 border border-white/10 group"
                            >
                              <Sparkles size={14} className="group-hover:animate-spin-slow" />
                              <span>Inspire Me (AI Theme Generator)</span>
                            </button>
                          </div>
                        </section>

                        {/* 4. Custom Background Image & Backdrop Filters */}
                        <section className="bg-slate-900/30 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                          {/* Hidden file input */}
                          <input
                            type="file"
                            ref={backgroundFileInputRef}
                            onChange={handleBackgroundFileSelect}
                            accept="image/*"
                            className="hidden"
                          />

                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                                <ImageIcon size={20} />
                              </div>
                              <div>
                                <h2 className="text-lg font-extrabold text-white tracking-tight">Background Photo</h2>
                                <p className="text-xs text-slate-400">Upload, crop, and adjust your custom backdrop</p>
                              </div>
                            </div>
                            {profile.theme.backgroundImageUrl && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Active
                              </span>
                            )}
                          </div>

                          {profile.theme.backgroundImageUrl ? (
                            <div className="space-y-6">
                              {/* Current Image Card */}
                              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-slate-950/60 p-4 flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative w-28 h-40 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg bg-slate-900">
                                  <img
                                    src={profile.theme.backgroundImageUrl}
                                    alt="Background Preview"
                                    className="w-full h-full object-cover transition-all"
                                    style={{
                                      filter: profile.theme.backgroundBlur ? `blur(${profile.theme.backgroundBlur}px)` : 'none',
                                      transform: profile.theme.backgroundBlur ? 'scale(1.08)' : 'none',
                                    }}
                                  />
                                  <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundColor: '#000000',
                                      opacity: typeof profile.theme.backgroundOverlay === 'number' ? profile.theme.backgroundOverlay : 0.35,
                                    }}
                                  />
                                  <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono text-white/80">
                                    9:16
                                  </div>
                                </div>

                                <div className="flex-1 w-full space-y-3">
                                  <div>
                                    <h4 className="text-sm font-bold text-white">Custom Backdrop Active</h4>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                      High-res mobile crop saved. Visible on live preview and shared public link.
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => backgroundFileInputRef.current?.click()}
                                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95"
                                    >
                                      <Upload size={13} />
                                      <span>Change Photo</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProfile({
                                          ...profile,
                                          theme: {
                                            ...profile.theme,
                                            backgroundImageUrl: '',
                                          },
                                        });
                                      }}
                                      className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                                    >
                                      <Trash2 size={13} />
                                      <span>Remove Photo</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Sliders for Backdrop Blur and Dimmer */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                {/* Dimmer Overlay Slider */}
                                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                      Dimmer / Overlay
                                    </label>
                                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                                      {Math.round((profile.theme.backgroundOverlay ?? 0.35) * 100)}%
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="0.85"
                                    step="0.05"
                                    value={profile.theme.backgroundOverlay ?? 0.35}
                                    onChange={(e) =>
                                      setProfile({
                                        ...profile,
                                        theme: {
                                          ...profile.theme,
                                          backgroundOverlay: parseFloat(e.target.value),
                                        },
                                      })
                                    }
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                  />
                                  <p className="text-[11px] text-slate-500 leading-tight">
                                    Darkens background so white text and buttons remain easy to read.
                                  </p>
                                </div>

                                {/* Blur Slider */}
                                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                      Backdrop Blur
                                    </label>
                                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                                      {profile.theme.backgroundBlur ?? 0}px
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="16"
                                    step="1"
                                    value={profile.theme.backgroundBlur ?? 0}
                                    onChange={(e) =>
                                      setProfile({
                                        ...profile,
                                        theme: {
                                          ...profile.theme,
                                          backgroundBlur: parseInt(e.target.value, 10),
                                        },
                                      })
                                    }
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                  />
                                  <p className="text-[11px] text-slate-500 leading-tight">
                                    Adds smooth frosted glass blur to soften busy background details.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Empty Upload Dropzone */
                            <div
                              onClick={() => backgroundFileInputRef.current?.click()}
                              className="group cursor-pointer rounded-2xl border-2 border-dashed border-white/15 hover:border-indigo-500/50 bg-slate-950/30 hover:bg-indigo-500/5 p-8 transition-all flex flex-col items-center justify-center text-center gap-3"
                            >
                              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all shadow-inner">
                                <Crop size={24} />
                              </div>
                              <div>
                                <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors block">
                                  Upload & Crop Background Photo
                                </span>
                                <span className="text-xs text-slate-400 mt-1 block max-w-sm">
                                  Choose any photo. Our interactive 9:16 mobile cropper lets you pan, zoom, and frame the perfect shot.
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                  JPG • PNG • WEBP
                                </span>
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                                  HD 1080×1920
                                </span>
                              </div>
                            </div>
                          )}
                        </section>
                      </div>
                    )}

                    {editorTab === 'analytics' && (
                      <section className="bg-slate-900/30 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                        {/* Neon Glow Effects */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-[80px] group-hover:bg-indigo-500/15 transition-all duration-300 pointer-events-none" />

                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                              <TrendingUp size={20} />
                            </div>
                            <div>
                              <h2 className="text-lg font-extrabold text-white tracking-tight">Real-time Analytics</h2>
                              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5 animate-pulse">● Live Tracking Active</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleRefreshAnalytics}
                              disabled={isRefreshingAnalytics}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 active:scale-95 transition-all disabled:opacity-50"
                              title="Refresh Analytics"
                            >
                              <RotateCw size={12} className={isRefreshingAnalytics ? 'animate-spin' : ''} />
                              <span>{isRefreshingAnalytics ? 'Syncing...' : 'Refresh'}</span>
                            </button>
                            <button
                              onClick={() => setShowResetConfirmModal(true)}
                              disabled={isResettingAnalytics}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 active:scale-95 transition-all disabled:opacity-50"
                              title="Reset Analytics"
                            >
                              <RotateCcw size={12} className={isResettingAnalytics ? 'animate-spin' : ''} />
                              <span>{isResettingAnalytics ? 'Resetting...' : 'Reset'}</span>
                            </button>
                          </div>
                        </div>

                        {(() => {
                          const totalClicks = profile.links.reduce((sum, l) => sum + (l.clicks || 0), 0);
                          const topLink = [...profile.links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];

                          return (
                            <div className="space-y-6">
                              {/* Summary Grid */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 shadow-inner">
                                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Clicks</span>
                                  <span className="text-3xl font-black text-white tracking-tight">
                                    {totalClicks}
                                  </span>
                                </div>
                                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 shadow-inner">
                                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Top Performing Link</span>
                                  <span className="text-xs font-bold text-indigo-400 truncate block mt-2">
                                    {topLink && topLink.clicks ? `${topLink.title} (${topLink.clicks} clicks)` : 'No clicks yet'}
                                  </span>
                                </div>
                              </div>

                              {/* Detailed Link Clicks Breakdown List */}
                              <div className="space-y-3.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Clicks Breakdown</label>
                                {profile.links.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No links added to your profile yet.</p>
                                ) : (
                                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                    {profile.links.map((link, i) => {
                                      const clicks = link.clicks || 0;
                                      const LinkIcon = ICON_MAP[link.icon] || Globe;

                                      return (
                                        <div key={link.id || i} className="flex items-center justify-between bg-slate-950/20 px-3.5 py-3 rounded-xl border border-white/5 hover:bg-slate-950/40 transition-colors">
                                          <div className="flex items-center gap-2 text-slate-300">
                                            <LinkIcon size={14} className="text-indigo-400 shrink-0" />
                                            <span className="truncate max-w-[150px] sm:max-w-[200px] font-bold text-slate-200">{link.title || 'Untitled Link'}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-white font-extrabold bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/25 text-[11px] min-w-[20px] text-center">{clicks} clicks</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </section>
                    )}

                    {editorTab === 'settings' && (
                      <section className="bg-slate-900/30 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                            <Settings size={20} />
                          </div>
                          <h2 className="text-lg font-extrabold text-white tracking-tight">Account Settings</h2>
                        </div>

                        <div className="divide-y divide-white/5">
                          {/* Public Status Toggle */}
                          <div className="py-4 flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-slate-200">Public Link Status</h3>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {profile.isActive !== false
                                  ? 'Your profile is online and searchable.'
                                  : 'Your profile is offline and hidden.'}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const updated = { ...profile, isActive: profile.isActive === false ? true : false };
                                  setProfile(updated);
                              }}
                              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${profile.isActive !== false ? 'bg-indigo-600' : 'bg-slate-950 border border-white/5'
                                }`}
                            >
                              <span
                                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${profile.isActive !== false ? 'translate-x-6' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>

                          {/* Email Capture & Newsletter Section */}
                          <div className="py-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-sm font-bold text-slate-200">Email Capture Widget</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Allow visitors on your profile to subscribe with their email address.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setProfile({
                                    ...profile,
                                    emailCaptureEnabled: !profile.emailCaptureEnabled,
                                  });
                                }}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                                  profile.emailCaptureEnabled ? 'bg-indigo-600' : 'bg-slate-950 border border-white/5'
                                }`}
                              >
                                <span
                                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${
                                    profile.emailCaptureEnabled ? 'translate-x-6' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            {profile.emailCaptureEnabled && (
                              <div className="pt-2 p-4 rounded-2xl bg-slate-950/40 border border-white/5">
                                <EmailEditorPanel
                                  username={profile.username}
                                  getAuthToken={async () => (await user?.getIdToken()) || ''}
                                />
                              </div>
                            )}
                          </div>

                          {/* Danger Zone: Delete Account */}
                          <div className="py-4">
                            <h3 className="text-sm font-bold text-red-400 mb-1">Danger Zone</h3>
                            <p className="text-xs text-slate-400 mb-3">
                              Permanently delete your profile and all associated links. This action is irreversible.
                            </p>
                            <button
                              onClick={handleDeleteAccount}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 active:scale-95 animate-pulse hover:animate-none"
                            >
                              <Trash2 size={14} />
                              Delete My Account
                            </button>
                          </div>
                        </div>
                      </section>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Preview */}
        {(isLargeScreen || view === 'preview') && (
          <div className={`lg:sticky lg:top-20 lg:self-start flex items-start justify-center pt-4 ${view === 'edit' ? 'hidden lg:flex' : 'flex w-full'}`}>
          {(() => {
            const previewProfile = debouncedProfile;
            return (
              <div className="relative w-full max-w-full lg:max-w-[360px] xl:max-w-[400px] h-[calc(100vh-8rem)] lg:h-auto lg:aspect-[9/19] bg-slate-950/20 lg:bg-slate-950 rounded-[2rem] lg:rounded-[3rem] border-0 lg:border-[12px] border-slate-950 shadow-2xl shadow-indigo-500/5 overflow-hidden ring-0 lg:ring-4 ring-indigo-500/10">
                {/* Dynamic Island / Notch Mockup */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-slate-900 rounded-full z-20 hidden lg:flex items-center justify-between px-2 shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-slate-800/80"></div>
                  <div className="w-3 h-3 rounded-full bg-indigo-900/40 border border-slate-700/50"></div>
                </div>

                <div
                  className="w-full h-full overflow-y-auto px-3 sm:px-8 pt-8 lg:pt-16 text-center scrollbar-hide relative"
                  style={{ backgroundColor: previewProfile.theme.backgroundColor, color: previewProfile.theme.textColor }}
                >
                  {/* Background Image Layer if present */}
                  {previewProfile.theme.backgroundImageUrl && (
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                        style={{
                          backgroundImage: `url(${previewProfile.theme.backgroundImageUrl})`,
                          filter: previewProfile.theme.backgroundBlur ? `blur(${previewProfile.theme.backgroundBlur}px)` : 'none',
                          transform: previewProfile.theme.backgroundBlur ? 'scale(1.08)' : 'none',
                        }}
                      />
                      {/* Dimmer overlay */}
                      <div
                        className="absolute inset-0 transition-opacity duration-300"
                        style={{
                          backgroundColor: '#000000',
                          opacity: typeof previewProfile.theme.backgroundOverlay === 'number' ? previewProfile.theme.backgroundOverlay : 0.35,
                        }}
                      />
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-spin-slow opacity-30 blur-md"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-spin-slow"></div>
                    <motion.img
                      key={previewProfile.avatarUrl}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.5 }}
                      src={previewProfile.avatarUrl}
                      alt="Avatar"
                      className="absolute inset-[3px] w-[calc(100%-6px)] h-[calc(100%-6px)] rounded-full object-cover shadow-xl"
                      style={{ border: `3px solid ${previewProfile.theme.backgroundColor}` }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <motion.h1
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="text-xl font-extrabold mb-1 tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient"
                  >
                    {previewProfile.displayName}
                  </motion.h1>
                  <motion.p
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-xs opacity-60 mb-4 font-semibold tracking-wide"
                  >
                    @{previewProfile.username}
                  </motion.p>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="text-sm opacity-80 mb-6 max-w-xs mx-auto leading-relaxed whitespace-pre-wrap select-none"
                    style={{ color: previewProfile.theme.textColor }}
                  >
                    {previewProfile.bio || "Your bio will appear here..."}
                  </motion.p>
                  <div className="space-y-4 relative z-10">
                    {/* Social Icons Row */}
                    {previewProfile.links.filter(l => l.isActive !== false && !l.embed && (l.display === 'icon' || (l.display !== 'card' && previewProfile.socialLinksStyle === 'grid' && l.icon !== 'globe'))).length > 0 && (
                      <div className="flex flex-wrap justify-center gap-3 mb-6">
                        {previewProfile.links
                          .filter(l => l.isActive !== false && !l.embed && (l.display === 'icon' || (l.display !== 'card' && previewProfile.socialLinksStyle === 'grid' && l.icon !== 'globe')))
                          .map((link, idx) => {
                            const Icon = ICON_MAP[link.icon] || Globe;
                            const animProps = getAnimationProps(link.animation, previewProfile.theme.buttonColor);
                            return (
                              <motion.a
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.15, y: -2, boxShadow: "0 8px 12px -3px rgba(99, 102, 241, 0.25)" }}
                                {...animProps}
                                href={link.url}
                                target={/^(mailto:|tel:)/.test(link.url) ? '_self' : '_blank'}
                                rel="noopener noreferrer"
                                className={`w-10 h-10 flex items-center justify-center relative overflow-hidden group transition-all ${getSocialIconStyleClasses(previewProfile.theme.buttonStyle)}`}
                                style={{ backgroundColor: previewProfile.theme.buttonColor, color: previewProfile.theme.buttonTextColor }}
                              >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                {link.thumbnailUrl ? (
                                  <img src={link.thumbnailUrl} alt={link.title} className="w-5 h-5 rounded-full object-cover relative z-10" />
                                ) : (
                                  <Icon size={18} className="relative z-10" />
                                )}
                              </motion.a>
                            );
                          })}
                      </div>
                    )}

                    {/* Primary Links & Bar Socials */}
                    <div className="space-y-2.5">
                      <AnimatePresence mode="popLayout">
                        {previewProfile.links
                          .filter(l => l.isActive !== false && (l.embed || l.display === 'card' || (l.display !== 'icon' && (previewProfile.socialLinksStyle === 'list' || l.icon === 'globe'))))
                          .map((link, idx) => {
                            const Icon = ICON_MAP[link.icon] || Globe;
                            const animProps = getAnimationProps(link.animation, previewProfile.theme.buttonColor);

                            // If interactive player is enabled, show ONLY the player without the card and icon
                            if (link.embed && isEmbeddableUrl(link.url)) {
                              return (
                                <div key={link.id || idx} className="w-full my-1">
                                  <MediaEmbed url={link.url} title={link.title} autoplay={link.autoplay} embedType={link.embedType} />
                                </div>
                              );
                            }

                            return (
                              <motion.a
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                whileHover={{ 
                                  scale: 1.02, 
                                  y: -2,
                                  boxShadow: "0 10px 20px -5px rgba(99, 102, 241, 0.2), 0 8px 10px -6px rgba(99, 102, 241, 0.2)",
                                  borderColor: "rgba(99, 102, 241, 0.35)"
                                }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ delay: 0.3 + idx * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                                {...animProps}
                                href={link.url}
                                target={/^(mailto:|tel:)/.test(link.url) ? '_self' : '_blank'}
                                rel="noopener noreferrer"
                                className={`block w-full px-3.5 py-4 transition-all flex items-center justify-between group overflow-hidden relative ${getButtonStyleClasses(previewProfile.theme.buttonStyle)}`}
                                style={{ backgroundColor: previewProfile.theme.buttonColor, color: previewProfile.theme.buttonTextColor }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                <div className="flex items-center gap-3 relative z-10 w-full min-w-0">
                                  {link.thumbnailUrl ? (
                                    <img src={link.thumbnailUrl} alt={link.title} className="w-7 h-7 rounded-lg object-cover shadow-sm shrink-0" />
                                  ) : (
                                    <Icon size={18} className="drop-shadow-sm shrink-0" />
                                  )}
                                  <div className="text-left min-w-0 flex-1 overflow-hidden">
                                    <p className="font-bold text-sm tracking-tight drop-shadow-sm leading-tight truncate">{link.title}</p>
                                    {link.description && (
                                      <p className="text-[11.5px] text-white/80 mt-1 whitespace-pre-wrap leading-tight text-left break-words">{link.description}</p>
                                    )}
                                  </div>
                                  <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity relative z-10 shrink-0 ml-auto" />
                                </div>
                              </motion.a>
                            );
                          })}
                      </AnimatePresence>
                    </div>

                    {/* Email Capture Widget in Preview */}
                    {previewProfile.emailCaptureEnabled && (
                      <div className="mt-6 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <p className="text-xs font-bold mb-2.5 text-center opacity-90">
                          Join my newsletter & updates
                        </p>
                        <EmailCaptureWidget
                          username={previewProfile.username}
                          buttonColor={previewProfile.theme.buttonColor}
                          buttonTextColor={previewProfile.theme.buttonTextColor}
                          buttonStyle={previewProfile.theme.buttonStyle}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex justify-center gap-4 opacity-60">
                      {previewProfile.links.filter(l => l.isActive !== false).slice(0, 5).map((link, idx) => {
                        const Icon = ICON_MAP[link.icon] || Globe;
                        return <Icon key={idx} size={20} />;
                      })}
                    </div>
                    <a
                      href="https://link-flow-program.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] mt-4 uppercase tracking-widest opacity-40 hover:opacity-80 transition-opacity cursor-pointer inline-block hover:underline"
                    >
                      Powered by LinkFlow
                    </a>
                  </div>
                  </div>
                </div>
              </div>
            );
          })()}
          </div>
        )}
      </main>

      {/* Template Selection Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplateModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              {/* Modal Top Header */}
              <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight">
                      Template Gallery
                    </h2>
                    <p className="text-xs text-slate-400">Choose from 20+ aesthetic themes or keep your default classic</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <Plus size={22} className="rotate-45" />
                </button>
              </div>

              {/* Controls Bar: Search & Category Pills */}
              <div className="p-4 sm:px-6 bg-slate-950/60 border-b border-white/5 space-y-3 shrink-0">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    placeholder="Search templates by name, vibe (e.g., dark, minimal, pink)..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all"
                  />
                  {templateSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTemplateSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
                  {TEMPLATE_CATEGORIES.map((cat) => {
                    const isSelected = selectedTemplateCategory === cat;
                    const count = cat === 'All' ? TEMPLATES.length : TEMPLATES.filter(t => t.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedTemplateCategory(cat)}
                        className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 text-xs font-semibold ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-900 text-slate-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Templates Grid Content */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                {(() => {
                  const filtered = TEMPLATES.filter((tpl) => {
                    const matchCategory = selectedTemplateCategory === 'All' || tpl.category === selectedTemplateCategory;
                    const query = templateSearchQuery.trim().toLowerCase();
                    const matchQuery =
                      !query ||
                      tpl.name.toLowerCase().includes(query) ||
                      tpl.description.toLowerCase().includes(query) ||
                      tpl.category.toLowerCase().includes(query);
                    return matchCategory && matchQuery;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-16 text-center">
                        <Palette size={32} className="mx-auto text-slate-600 mb-2" />
                        <p className="text-sm font-bold text-slate-300">No templates found</p>
                        <p className="text-xs text-slate-500 mt-1">Try another search term or select another category</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplateCategory('All');
                            setTemplateSearchQuery('');
                          }}
                          className="mt-4 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-400 rounded-xl"
                        >
                          Reset Filters
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filtered.map((tpl) => {
                        const active = isTemplateActive(tpl.theme, profile.theme);
                        return (
                          <div
                            key={tpl.id}
                            className={`group relative rounded-2xl border transition-all flex flex-col justify-between overflow-hidden p-3.5 ${
                              active
                                ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/50 shadow-xl'
                                : 'border-white/10 bg-slate-950/50 hover:border-indigo-500/40 hover:bg-slate-950/80 hover:shadow-lg'
                            }`}
                          >
                            <div>
                              {/* Realistic Mini Preview Phone */}
                              <div
                                className="w-full aspect-[16/10] rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 shadow-inner border border-white/5 relative overflow-hidden mb-3"
                                style={{ backgroundColor: tpl.theme.backgroundColor }}
                              >
                                {/* Mini Avatar dot with gradient border */}
                                <div className="w-5 h-5 rounded-full p-[1px] bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-sm">
                                  <div className="w-full h-full rounded-full bg-slate-900/60" />
                                </div>
                                {/* Mini username bar */}
                                <div
                                  className="w-16 h-1.5 rounded-full opacity-70 mb-0.5"
                                  style={{ backgroundColor: tpl.theme.textColor }}
                                />
                                {/* 3 Mini Link button bars */}
                                <div
                                  className={`w-full h-2.5 shadow-sm flex items-center px-1.5 ${getButtonStyleClasses(tpl.theme.buttonStyle)}`}
                                  style={{ backgroundColor: tpl.theme.buttonColor }}
                                >
                                  <div className="w-8 h-1 rounded-full opacity-60" style={{ backgroundColor: tpl.theme.buttonTextColor }} />
                                </div>
                                <div
                                  className={`w-full h-2.5 shadow-sm flex items-center px-1.5 opacity-90 ${getButtonStyleClasses(tpl.theme.buttonStyle)}`}
                                  style={{ backgroundColor: tpl.theme.buttonColor }}
                                >
                                  <div className="w-12 h-1 rounded-full opacity-60" style={{ backgroundColor: tpl.theme.buttonTextColor }} />
                                </div>
                                <div
                                  className={`w-3/4 h-2.5 shadow-sm flex items-center px-1.5 opacity-80 ${getButtonStyleClasses(tpl.theme.buttonStyle)}`}
                                  style={{ backgroundColor: tpl.theme.buttonColor }}
                                >
                                  <div className="w-10 h-1 rounded-full opacity-60" style={{ backgroundColor: tpl.theme.buttonTextColor }} />
                                </div>
                              </div>

                              {/* Template Info */}
                              <div className="space-y-1 mb-3">
                                <div className="flex items-center justify-between gap-1">
                                  <h3 className="text-sm font-extrabold text-white truncate">{tpl.name}</h3>
                                  {tpl.badge && (
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tight shrink-0 ${
                                      tpl.badge === 'Default'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    }`}>
                                      {tpl.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <span className="font-semibold text-indigo-400">{tpl.category}</span>
                                  <span>•</span>
                                  <span className="capitalize">{tpl.theme.buttonStyle || 'rounded'} shape</span>
                                </div>
                                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                  {tpl.description}
                                </p>
                              </div>
                            </div>

                            {/* Action Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setProfile({ ...profile, theme: { ...tpl.theme } });
                                setShowTemplateModal(false);
                              }}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                active
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-300 border border-white/10'
                              }`}
                            >
                              {active ? (
                                <>
                                  <Check size={13} />
                                  <span>Active Theme</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={13} />
                                  <span>Apply Theme</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:px-6 bg-slate-950/60 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>{TEMPLATES.length} pre-designed aesthetic themes available</span>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Choose Username Modal */}
      {!loading && !isFetching && user && profile.username && profile.username === user.uid && (
        <div className="fixed inset-0 z-[110] bg-[#090d16] flex items-center justify-center p-4 overflow-hidden">
          {/* Radial Mesh Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/30 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/30 blur-[120px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-slate-900/40 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <User size={32} />
            </div>

            <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Choose your Handle</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Create your unique custom link to share your social profiles and projects with the world.
            </p>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Desired Username</label>
                <div className="relative flex items-center bg-slate-950/60 border border-white/10 rounded-2xl focus-within:border-indigo-500/50 transition-all p-3 shadow-inner">
                  <span className="text-slate-600 font-bold select-none text-xs pr-1">link-flow-program.vercel.app/</span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^\w-]/g, '');
                      setNewUsername(val);
                    }}
                    placeholder="your-name"
                    className="bg-transparent border-0 outline-none w-full text-white font-extrabold placeholder:text-slate-800 focus:ring-0 p-0 text-xs"
                  />
                </div>
              </div>

              {/* Availability Status Indicators */}
              <div className="min-h-[24px] px-1 text-xs">
                {usernameStatus === 'checking' && (
                  <span className="text-indigo-400 flex items-center gap-1.5 font-semibold animate-pulse">
                    <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                    Checking availability...
                  </span>
                )}
                {usernameStatus === 'available' && (
                  <span className="text-green-400 flex items-center gap-1.5 font-bold">
                    <Check size={14} className="stroke-[3]" />
                    Username is available!
                  </span>
                )}
                {usernameStatus === 'taken' && (
                  <span className="text-red-400 flex items-center gap-1.5 font-bold">
                    <AlertCircle size={14} className="stroke-[2.5]" />
                    Username is already taken.
                  </span>
                )}
                {usernameStatus === 'invalid' && (
                  <span className="text-amber-400 flex items-center gap-1.5 font-semibold">
                    <AlertCircle size={14} />
                    Min 3 characters, letters & hyphens only.
                  </span>
                )}
              </div>

              <button
                onClick={handleSaveUsername}
                disabled={usernameStatus !== 'available' || isSaving}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100 disabled:pointer-events-none mt-2"
              >
                {isSaving ? 'Configuring account...' : 'Claim & Launch Dashboard →'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

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

      {/* Custom Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
            {/* Radial Mesh Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/10 blur-[120px]" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900/40 border border-red-500/20 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
                <Trash2 size={32} className="animate-pulse" />
              </div>

              <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Wipe Your Account?</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                This will permanently delete your shortlink, links, stats, and configurations from our systems. <strong>This cannot be undone.</strong>
              </p>

              <div className="space-y-4 mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-left">
                  Type <span className="text-red-500 font-black">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-slate-700 text-center tracking-widest uppercase transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold py-3.5 px-6 rounded-2xl border border-white/5 transition-all active:scale-95 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteAccount}
                  disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-600/20 disabled:pointer-events-none text-sm"
                >
                  Wipe Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Reset Analytics Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
            {/* Radial Mesh Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-900/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/10 blur-[120px]" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900/40 border border-rose-500/20 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
                <RotateCcw size={32} className={isResettingAnalytics ? "animate-spin" : "animate-pulse"} />
              </div>

              <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight font-sans">Reset Click Counts?</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed font-sans">
                This will permanently reset all click analytics for your links to zero. <strong>This cannot be undone.</strong>
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="flex-1 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold py-3.5 px-6 rounded-2xl border border-white/5 transition-all active:scale-95 text-sm font-sans"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleResetAnalytics();
                    setShowResetConfirmModal(false);
                  }}
                  disabled={isResettingAnalytics}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-95 shadow-lg shadow-rose-600/20 disabled:pointer-events-none text-sm font-sans"
                >
                  {isResettingAnalytics ? 'Resetting...' : 'Reset All'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Deleted Success Toast */}
      <AnimatePresence>
        {showDeleteToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-500/20 max-w-md w-[calc(100%-2rem)]"
          >
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center shrink-0">
              <Trash2 size={18} className="text-red-500 animate-bounce" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-white">Account Permanently Deleted</span>
              <span className="text-[11px] text-slate-400 mt-0.5 font-medium leading-normal">All your profile configurations have been securely wiped. You can register as a new user.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claimed Taken Warning Toast */}
      <AnimatePresence>
        {claimedTakenAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-500/20 max-w-md w-[calc(100%-2rem)]"
          >
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-amber-500 animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-white">Handle Already Claimed</span>
              <span className="text-[11px] text-slate-400 mt-0.5 font-medium leading-normal">{claimedTakenAlert}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Interactive Crop & Frame Modal */}
      <BackgroundCropModal
        isOpen={showCropModal}
        onClose={() => {
          setShowCropModal(false);
          setRawCropImage(null);
        }}
        rawImage={rawCropImage}
        onUploadSuccess={(url) => {
          setProfile((prev) => ({
            ...prev,
            theme: {
              ...prev.theme,
              backgroundImageUrl: url,
            },
          }));
          setShowCropModal(false);
          setRawCropImage(null);
        }}
        cloudName={import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dg41yztls'}
        uploadPreset={import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'linkflow_avatars'}
        oldImageUrl={profile.theme.backgroundImageUrl}
      />

      {/* QR Code Generator Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        username={profile.username}
        profileUrl={`${window.location.origin}/${profile.username}`}
      />

      {/* AI Bio Generator Modal */}
      <BioGeneratorModal
        isOpen={showBioModal}
        onClose={() => setShowBioModal(false)}
        displayName={profile.displayName}
        onApplyBio={(newBio) => {
          setProfile((prev) => ({ ...prev, bio: newBio }));
        }}
      />
    </div>
  );
}

