// Vercel Fresh Clean Trigger
import React, { useState, useEffect } from 'react';
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
  HardDrive,
  Link,
  Phone,
  ShoppingBag,
  Coffee,
  Music
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, getRedirectResult } from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import LandingPage from './components/LandingPage';

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
  };
  socialLinksStyle: 'grid' | 'list';
  isActive?: boolean;
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
  },
  socialLinksStyle: 'grid',
  isActive: true
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
  },
  {
    name: 'Ocean',
    theme: {
      backgroundColor: '#075985',
      textColor: '#f0f9ff',
      buttonColor: '#0ea5e9',
      buttonTextColor: '#ffffff',
    }
  },
  {
    name: 'Solarized',
    theme: {
      backgroundColor: '#002b36',
      textColor: '#839496',
      buttonColor: '#268bd2',
      buttonTextColor: '#ffffff',
    }
  },
  {
    name: 'Rose Gold',
    theme: {
      backgroundColor: '#fff1f2',
      textColor: '#881337',
      buttonColor: '#fb7185',
      buttonTextColor: '#ffffff',
    }
  },
  {
    name: 'Nord',
    theme: {
      backgroundColor: '#2e3440',
      textColor: '#eceff4',
      buttonColor: '#5e81ac',
      buttonTextColor: '#eceff4',
    }
  },
  {
    name: 'Emerald',
    theme: {
      backgroundColor: '#064e3b',
      textColor: '#ecfdf5',
      buttonColor: '#10b981',
      buttonTextColor: '#ffffff',
    }
  },
  {
    name: 'Dracula',
    theme: {
      backgroundColor: '#282a36',
      textColor: '#f8f8f2',
      buttonColor: '#bd93f9',
      buttonTextColor: '#282a36',
    }
  },
  {
    name: 'Royal',
    theme: {
      backgroundColor: '#2e1065',
      textColor: '#f5f3ff',
      buttonColor: '#fbbf24',
      buttonTextColor: '#2e1065',
    }
  },
  {
    name: 'Coffee',
    theme: {
      backgroundColor: '#27272a',
      textColor: '#fdfcfb',
      buttonColor: '#8a5e3c',
      buttonTextColor: '#ffffff',
    }
  }
];

export default function App() {
  const [view, setView] = useState<'preview' | 'edit' | 'public'>('edit');
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
  const [isCopying, setIsCopying] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
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
  const [isRefreshingAnalytics, setIsRefreshingAnalytics] = useState(false);

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
    const cacheKey = `linkflow_profile_cache_${isUid ? 'uid_' : ''}${id}`;

    // 1. Try loading instantly from localStorage cache (SWR Strategy)
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
        setProfile(parsed);
        setLoading(false);
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
        // 2. Save fresh version to cache
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } else if (res.status === 404) {
        // Clear stale local storage cache
        localStorage.removeItem(cacheKey);

        if (!isUid) {
          setProfileNotFound(true);
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
      }
    } catch (err) {
      console.error('Fetch profile failed:', err);
    } finally {
      setIsFetching(false);
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
        const endpoint = `/api/profiles/${profile.username}`;
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
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
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
    if (profileNotFound) {
      return (
        <div
          className="min-h-screen w-full overflow-hidden flex items-center justify-center p-6 bg-[#090d16]"
        >
          {/* Radial Mesh Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/10 blur-[120px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center p-8 bg-slate-900/30 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10"
          >
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
          </motion.div>
        </div>
      );
    }

    if (profile.isActive === false) {
      return (
        <div
          className="min-h-screen w-full overflow-hidden flex items-center justify-center p-6 bg-[#090d16]"
        >
          {/* Radial Mesh Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/40 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/40 blur-[120px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center p-8 bg-slate-900/30 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10"
          >
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
          </motion.div>
        </div>
      );
    }

    return (
      <div
        className="min-h-screen w-full overflow-y-auto px-3 sm:px-4 py-8 sm:py-16 flex flex-col items-center justify-start"
        style={{ backgroundColor: profile.theme.backgroundColor, color: profile.theme.textColor }}
      >
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
            {profile.links.filter(l => l.isActive !== false && (l.display === 'icon' || (l.display !== 'card' && profile.socialLinksStyle === 'grid' && l.icon !== 'globe'))).length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {profile.links
                  .filter(l => l.isActive !== false && (l.display === 'icon' || (l.display !== 'card' && profile.socialLinksStyle === 'grid' && l.icon !== 'globe')))
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
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md border border-white/10 transition-all relative group overflow-hidden"
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
                .filter(l => l.isActive !== false && (l.display === 'card' || (l.display !== 'icon' && (profile.socialLinksStyle === 'list' || l.icon === 'globe'))))
                .map((link, idx) => {
                  const Icon = ICON_MAP[link.icon] || Globe;
                  const animProps = getAnimationProps(link.animation, profile.theme.buttonColor);
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
                      className="block w-full px-3.5 py-4 rounded-xl transition-all flex items-center justify-between group shadow-xl backdrop-blur-md border border-white/10 overflow-hidden relative"
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
          </div>

          <div className="mt-20 pt-12 border-t border-white/10">
            <div className="flex justify-center gap-6 opacity-60 mb-6">
              {profile.links.filter(l => l.isActive !== false).slice(0, 5).map((link, idx) => {
                const Icon = ICON_MAP[link.icon] || Globe;
                return <Icon key={idx} size={24} />;
              })}
            </div>
            <p className="text-xs uppercase tracking-[0.2em] opacity-40 font-extrabold relative z-10">Powered by LinkFlow</p>
          </div>
        </div>
      </div>
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

  if (!user) {
    return (
      <LandingPage 
        onLogin={handleLogin} 
        loginError={loginError || undefined} 
        clearLoginError={() => setLoginError(null)} 
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[#070a13] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Dynamic Background Radial Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] aspect-square rounded-full bg-purple-900/8 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293703_1px,transparent_1px),linear-gradient(to_bottom,#1f293703_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-40" />

      <nav className="fixed top-0 left-0 right-0 h-20 bg-slate-950/60 border-b border-white/5 backdrop-blur-xl z-50 px-6 flex items-center justify-between shadow-lg">
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
              <button
                onClick={handleCopyLink}
                className="bg-slate-900 border border-white/10 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
              >
                {isCopying ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
                <span>{isCopying ? 'Copied!' : 'Share'}</span>
              </button>
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

      <main className="pt-24 pb-12 px-4 lg:px-8 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-24">
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

              <div className={`space-y-8 transition-all duration-300 ${isFetching ? 'opacity-20 pointer-events-none scale-[0.98] blur-[2px]' : 'opacity-100'}`}>
                <section className="bg-slate-900/30 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                      <Palette size={20} />
                    </div>
                    <h2 className="text-lg font-extrabold text-white tracking-tight">Templates</h2>
                  </div>

                  <div className="space-y-6">

                    {/* Preset Templates */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top Templates</label>
                        <button
                          onClick={() => setShowTemplateModal(true)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        >
                          More Templates <Sparkles size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {TEMPLATES.slice(0, 3).map((tpl) => (
                          <button
                            key={tpl.name}
                            onClick={() => setProfile({ ...profile, theme: tpl.theme })}
                            className="group relative flex flex-col items-center gap-2 p-2 rounded-xl border border-white/5 bg-slate-950/40 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
                          >
                            <div
                              className="w-full aspect-video rounded-lg shadow-sm flex flex-col gap-1 p-1.5"
                              style={{ backgroundColor: tpl.theme.backgroundColor }}
                            >
                              <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: tpl.theme.buttonColor }} />
                              <div className="w-2/3 h-1.5 rounded-full" style={{ backgroundColor: tpl.theme.buttonColor }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{tpl.name}</span>
                            {JSON.stringify(profile.theme) === JSON.stringify(tpl.theme) && (
                              <div className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                                <Check size={10} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-slate-900/30 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                      <User size={20} />
                    </div>
                    <h2 className="text-lg font-extrabold text-white tracking-tight">Profile Info</h2>
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

                <section className="bg-slate-900/30 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                        <Layout size={20} />
                      </div>
                      <h2 className="text-lg font-extrabold text-white tracking-tight">Links</h2>
                    </div>
                    <button
                      onClick={() => setProfile({ ...profile, links: [...profile.links, { id: `link-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`, title: 'New Link', url: '', icon: 'globe', isActive: true, display: 'card' }] })}
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
                      {profile.links.map((link, idx) => (
                        <motion.div
                          layout
                          key={link.id || `link-${idx}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="p-4 sm:p-5 bg-slate-950/30 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-200 group relative select-none"
                        >
                          <div className="flex items-start gap-2.5 sm:gap-4">
                            {/* Up & Down Reorder Buttons */}
                            <div className="flex flex-col items-center gap-1 shrink-0 self-center">
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
                                className={`p-1 rounded-md transition-colors ${idx === 0
                                    ? 'text-slate-800 cursor-not-allowed opacity-20'
                                    : 'text-slate-400 hover:text-indigo-400 hover:bg-white/5 active:scale-90'
                                  }`}
                                title="Move Up"
                              >
                                <ChevronUp size={16} />
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
                                className={`p-1 rounded-md transition-colors ${idx === profile.links.length - 1
                                    ? 'text-slate-800 cursor-not-allowed opacity-20'
                                    : 'text-slate-400 hover:text-indigo-400 hover:bg-white/5 active:scale-90'
                                  }`}
                                title="Move Down"
                              >
                                <ChevronDown size={16} />
                              </button>
                            </div>

                            {/* Icon Selector Button & Dropdown Container */}
                            <div className="relative shrink-0 mt-1">
                              <button
                                onClick={() => {
                                  const currentOpen = activeIconPickerIdx === idx ? null : idx;
                                  setActiveIconPickerIdx(currentOpen);
                                }}
                                className="w-12 h-12 rounded-xl bg-slate-950/60 border border-white/10 hover:border-indigo-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md group/iconbtn active:scale-95"
                                title="Choose Custom Icon"
                              >
                                {(() => {
                                  const IconComp = ICON_MAP[link.icon] || Globe;
                                  return <IconComp size={20} className="group-hover/iconbtn:scale-110 transition-transform" />;
                                })()}
                              </button>

                              {/* Floating icon selector picker */}
                              {activeIconPickerIdx === idx && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setActiveIconPickerIdx(null)}
                                  />
                                  <div className="absolute left-0 mt-2 p-2 bg-slate-950 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl z-20 w-72 grid grid-cols-6 gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
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

                            <div className="flex-1 space-y-3 pr-8 sm:pr-0">
                              <input
                                type="text"
                                value={link.title}
                                placeholder="Link Title (e.g. My Website)"
                                onChange={(e) => {
                                  const newLinks = [...profile.links];
                                  newLinks[idx].title = e.target.value;
                                  setProfile({ ...profile, links: newLinks });
                                }}
                                className="w-full bg-transparent font-bold text-white focus:outline-none placeholder:text-slate-700 text-base"
                              />
                              <textarea
                                value={link.description || ''}
                                placeholder="Short description (optional)"
                                onChange={(e) => {
                                  const newLinks = [...profile.links];
                                  newLinks[idx].description = e.target.value;
                                  setProfile({ ...profile, links: newLinks });
                                }}
                                rows={2}
                                className="w-full bg-slate-950/60 text-xs text-white font-bold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 border border-white/5 focus:border-indigo-500/40 px-3.5 py-2.5 rounded-xl transition-all shadow-inner mt-1 block resize-none min-h-[3rem]"
                              />
                              <div className="relative">
                                <input
                                  type="text"
                                  value={link.url}
                                  placeholder="URL (https://...)"
                                  onChange={(e) => {
                                    const newUrl = e.target.value;
                                    const newLinks = [...profile.links];
                                    newLinks[idx].url = newUrl;
                                    // Auto-detect icon
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
                                  className={`w-full bg-transparent text-sm focus:outline-none transition-colors placeholder:text-slate-700 font-semibold ${link.url && !/^(https?:\/\/|mailto:|tel:)/.test(link.url)
                                    ? 'text-red-400 placeholder:text-red-300'
                                    : 'text-indigo-400/90'
                                    }`}
                                />
                                {link.url && !/^(https?:\/\/|mailto:|tel:)/.test(link.url) && (
                                  <p className="text-[10px] text-red-400 mt-1 font-medium animate-pulse">
                                    URL must start with http://, https://, or mailto:
                                  </p>
                                )}
                              </div>
                              {/* Secondary Features Control Row */}
                              <div className="flex flex-wrap items-center gap-2.5 pt-2.5 border-t border-white/5 text-[10px]">
                                {/* 1. Toggle Switch (Visibility) */}
                                <div className="flex items-center gap-1.5 bg-slate-950/40 px-2 py-1 rounded-lg border border-white/5">
                                  <span className="font-bold text-slate-500 uppercase tracking-wider">Show Link</span>
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
                                </div>

                                {/* 2. Display Mode Selector (Wide Card vs Top Icon) */}
                                <div className="flex items-center gap-1.5 bg-slate-950/40 px-2 py-1 rounded-lg border border-white/5">
                                  <span className="font-bold text-slate-500 uppercase tracking-wider">Display</span>
                                  <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-white/5">
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
                              </div>
                            </div>
                          </div>

                          {/* Absolutely positioned Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const newLinks = profile.links.filter((_, i) => i !== idx);
                              setProfile({ ...profile, links: newLinks });
                            }}
                            className="absolute top-4 right-4 text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl border border-white/5 transition-all active:scale-90 z-20"
                            title="Delete Link"
                          >
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </section>

                <section className="bg-slate-900/30 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                      <Palette size={20} />
                    </div>
                    <h2 className="text-lg font-extrabold text-white tracking-tight">Appearance</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Background</label>
                      <input
                        type="color"
                        value={profile.theme.backgroundColor}
                        onChange={(e) => setProfile({ ...profile, theme: { ...profile.theme, backgroundColor: e.target.value } })}
                        className="w-full h-12 bg-slate-950/60 border border-white/10 p-1.5 rounded-2xl cursor-pointer hover:border-white/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Text Color</label>
                      <input
                        type="color"
                        value={profile.theme.textColor}
                        onChange={(e) => setProfile({ ...profile, theme: { ...profile.theme, textColor: e.target.value } })}
                        className="w-full h-12 bg-slate-950/60 border border-white/10 p-1.5 rounded-2xl cursor-pointer hover:border-white/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Button Color</label>
                      <input
                        type="color"
                        value={profile.theme.buttonColor}
                        onChange={(e) => setProfile({ ...profile, theme: { ...profile.theme, buttonColor: e.target.value } })}
                        className="w-full h-12 bg-slate-950/60 border border-white/10 p-1.5 rounded-2xl cursor-pointer hover:border-white/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Button Text</label>
                      <input
                        type="color"
                        value={profile.theme.buttonTextColor}
                        onChange={(e) => setProfile({ ...profile, theme: { ...profile.theme, buttonTextColor: e.target.value } })}
                        className="w-full h-12 bg-slate-950/60 border border-white/10 p-1.5 rounded-2xl cursor-pointer hover:border-white/20 transition-all"
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleGenerateAITheme();
                      }}
                      className="col-span-2 mt-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 border border-white/10 group"
                    >
                      <Sparkles size={14} className="group-hover:animate-spin-slow" />
                      <span>Inspire Me (AI Theme)</span>
                    </button>
                  </div>
                </section>

                {/* Dedicated Real-time Analytics Section */}
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
                    <button
                      onClick={handleRefreshAnalytics}
                      disabled={isRefreshingAnalytics}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 active:scale-95 transition-all disabled:opacity-50"
                      title="Refresh Analytics"
                    >
                      <RotateCw size={12} className={isRefreshingAnalytics ? 'animate-spin' : ''} />
                      <span>{isRefreshingAnalytics ? 'Syncing...' : 'Refresh'}</span>
                    </button>
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

                {/* Account Settings Card: Public Link Toggle & Danger Zone */}
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
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Preview */}
        <div className={`lg:sticky lg:top-24 lg:self-start flex items-start justify-center pt-4 ${view === 'edit' ? 'hidden lg:flex' : 'flex w-full'}`}>
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
                    {previewProfile.links.filter(l => l.isActive !== false && (l.display === 'icon' || (l.display !== 'card' && previewProfile.socialLinksStyle === 'grid' && l.icon !== 'globe'))).length > 0 && (
                      <div className="flex flex-wrap justify-center gap-3 mb-6">
                        {previewProfile.links
                          .filter(l => l.isActive !== false && (l.display === 'icon' || (l.display !== 'card' && previewProfile.socialLinksStyle === 'grid' && l.icon !== 'globe')))
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
                                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm border border-white/10 relative overflow-hidden group"
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
                          .filter(l => l.isActive !== false && (l.display === 'card' || (l.display !== 'icon' && (previewProfile.socialLinksStyle === 'list' || l.icon === 'globe'))))
                          .map((link, idx) => {
                            const Icon = ICON_MAP[link.icon] || Globe;
                            const animProps = getAnimationProps(link.animation, previewProfile.theme.buttonColor);
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
                                className="block w-full px-3.5 py-4 rounded-xl transition-all flex items-center justify-between group shadow-md backdrop-blur-sm border border-white/10 overflow-hidden relative"
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
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex justify-center gap-4 opacity-60">
                      {previewProfile.links.filter(l => l.isActive !== false).slice(0, 5).map((link, idx) => {
                        const Icon = ICON_MAP[link.icon] || Globe;
                        return <Icon key={idx} size={20} />;
                      })}
                    </div>
                    <p className="text-[10px] mt-4 uppercase tracking-widest opacity-40">Powered by LinkFlow</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </main>

      {/* Template Selection Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplateModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Choose a Template</h2>
                  <p className="text-sm text-slate-500">Select a pre-designed theme for your profile</p>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Plus size={24} className="rotate-45 text-slate-400" />
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      onClick={() => {
                        setProfile({ ...profile, theme: tpl.theme });
                        setShowTemplateModal(false);
                      }}
                      className="group relative flex flex-col items-center gap-3 p-3 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left"
                    >
                      <div
                        className="w-full aspect-[4/3] rounded-xl shadow-sm flex flex-col gap-2 p-3"
                        style={{ backgroundColor: tpl.theme.backgroundColor }}
                      >
                        <div className="w-1/2 h-2 rounded-full" style={{ backgroundColor: tpl.theme.buttonColor }} />
                        <div className="w-full h-2 rounded-full" style={{ backgroundColor: tpl.theme.buttonColor }} />
                        <div className="w-3/4 h-2 rounded-full" style={{ backgroundColor: tpl.theme.buttonColor }} />
                      </div>
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{tpl.name}</span>
                        {JSON.stringify(profile.theme) === JSON.stringify(tpl.theme) && (
                          <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Close
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
    </div>
  );
}

