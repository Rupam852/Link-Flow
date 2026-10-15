import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  ExternalLink,
  Youtube,
  Sliders,
  Globe,
  Sparkles,
} from 'lucide-react';
import { isYouTubeUrl, isEmbeddableUrl } from './MediaEmbed';
import { ICON_MAP, detectIcon } from '../App';
import type { Link } from '../App';

interface ReorderableLinkCardProps {
  key?: React.Key;
  link: Link;
  idx: number;
  totalLinks: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updatedLink: Link) => void;
  onDelete: () => void;
  onMove?: (fromIndex: number, toIndex: number) => void;
  activeIconPickerIdx: number | null;
  setActiveIconPickerIdx: (idx: number | null) => void;
}

export default function ReorderableLinkCard({
  link,
  idx,
  totalLinks,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onMove,
  activeIconPickerIdx,
  setActiveIconPickerIdx,
}: ReorderableLinkCardProps) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef(false);

  // Auto-scroll handler: when dragging near top or bottom edges of the screen
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent) => {
    let clientY: number | null = null;
    if ('touches' in event && event.touches && event.touches.length > 0) {
      clientY = event.touches[0].clientY;
    } else if ('clientY' in event && typeof (event as any).clientY === 'number') {
      clientY = (event as any).clientY;
    }

    if (clientY === null) return;

    const threshold = 140; // 140px zone from top or bottom of viewport
    const vh = window.innerHeight;

    if (clientY < threshold) {
      // Near top of screen: scroll up smoothly
      const ratio = Math.max(0.1, (threshold - clientY) / threshold);
      const speed = Math.round(ratio * 22) + 4;
      window.scrollBy({ top: -speed, behavior: 'instant' as any });
    } else if (clientY > vh - threshold) {
      // Near bottom of screen: scroll down smoothly
      const ratio = Math.max(0.1, (clientY - (vh - threshold)) / threshold);
      const speed = Math.round(ratio * 22) + 4;
      window.scrollBy({ top: speed, behavior: 'instant' as any });
    }
  };

  // Touch and hold / long-press handler for mobile reordering
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isExpanded) return; // Don't initiate drag if expanded for editing
    isLongPressActive.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActive.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40); // Haptic feedback indicating reorder mode
      }
      dragControls.start(e);
    }, 220); // 220ms long press threshold
  };

  const handleTouchMove = () => {
    // If user is just scrolling the page, cancel the long press timer
    if (!isLongPressActive.current && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCardClick = () => {
    // If just finished a long-press drag, don't trigger expand
    if (isLongPressActive.current) {
      isLongPressActive.current = false;
      return;
    }
    onToggleExpand();
  };

  const IconComp = ICON_MAP[link.icon] || Globe;

  return (
    <Reorder.Item
      value={link}
      id={link.id || `link-${idx}`}
      dragListener={false}
      dragControls={dragControls}
      onDrag={handleDrag}
      onDragStart={() => {
        setIsDragging(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(25);
        }
      }}
      onDragEnd={() => {
        setIsDragging(false);
        isLongPressActive.current = false;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(20);
        }
      }}
      whileDrag={{
        scale: 1.025,
        zIndex: 99,
        boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.45), 0 0 0 2px rgba(129, 140, 248, 0.8)',
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        cursor: 'grabbing',
      }}
      className={`rounded-2xl border transition-colors duration-200 group relative ${
        isDragging
          ? 'bg-slate-900 border-indigo-500 shadow-2xl z-50'
          : 'bg-slate-950/30 border-white/5 hover:border-white/10'
      } p-4`}
    >
      <div
        className="flex items-center justify-between gap-3 cursor-pointer select-none"
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Dedicated Drag Handle */}
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              dragControls.start(e);
            }}
            className="p-1.5 text-slate-500 hover:text-indigo-400 cursor-grab active:cursor-grabbing rounded-lg hover:bg-white/5 transition-colors touch-none shrink-0"
            title="Press and drag to reorder"
          >
            <GripVertical size={18} />
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
              <IconComp size={16} />
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
                          onUpdate({ ...link, icon: iconName });
                          setActiveIconPickerIdx(null);
                        }}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          link.icon === iconName
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
              onUpdate({ ...link, isActive: link.isActive !== false ? false : true });
            }}
            className={`relative w-8 h-4 rounded-full transition-colors duration-150 focus:outline-none ${
              link.isActive !== false ? 'bg-green-500' : 'bg-slate-800'
            }`}
            title={link.isActive !== false ? 'Hide Link' : 'Show Link'}
          >
            <span
              className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-150 ${
                link.isActive !== false ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>

          {/* Expand indicator */}
          <div
            onClick={handleCardClick}
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
                placeholder={
                  link.embed
                    ? link.embedType === 'music'
                      ? "e.g. Song Name (defaults to 'YouTube Audio Track')"
                      : 'e.g. Video Title'
                    : 'e.g. My Website'
                }
                onChange={(e) => onUpdate({ ...link, title: e.target.value })}
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
                    onUpdate({
                      ...link,
                      url: newUrl,
                      icon: detectIcon(newUrl),
                    });
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && !/^(https?:\/\/|mailto:|tel:)/.test(val) && !val.startsWith('/')) {
                      const formatted = `https://${val}`;
                      onUpdate({
                        ...link,
                        url: formatted,
                        icon: detectIcon(formatted),
                      });
                    }
                  }}
                  className={`w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 text-white rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none text-sm font-semibold ${
                    link.url && !/^(https?:\/\/|mailto:|tel:)/.test(link.url)
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
                  onChange={(e) => onUpdate({ ...link, description: e.target.value })}
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
                      onUpdate({ ...link, embed: !link.embed });
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
                        onUpdate({ ...link, autoplay: !link.autoplay });
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

                {/* Sub-toggle: Player Style (Minimal Music Card vs Video Player) */}
                {link.embed && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>🎧</span> {isYouTubeUrl(link.url) ? 'YouTube Player Style' : 'Spotify Player Style'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isYouTubeUrl(link.url)
                            ? (link.embedType || 'video') === 'music'
                              ? 'Minimal music card with soundwave & thumbnail (no large video box)'
                              : 'Full 16:9 interactive YouTube video player'
                            : link.embedType === 'music'
                            ? 'Compact 80px minimal audio bar'
                            : 'Standard Spotify interactive music player'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onUpdate({ ...link, embedType: 'video' });
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
                          onUpdate({ ...link, embedType: 'music' });
                        }}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                          link.embedType === 'music'
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/40 ring-1 ring-rose-400'
                            : 'bg-slate-950/50 text-slate-400 border-white/5 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <span>🎵</span>
                        {isYouTubeUrl(link.url) ? 'Minimal Music Card' : 'Compact Audio Bar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Animation Selector (Hidden when interactive embed is active) */}
            {!link.embed && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Button Animation
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'pulse', 'wobble', 'glow'] as const).map((anim) => {
                    const isSelected = (link.animation || 'none') === anim;
                    return (
                      <button
                        key={anim}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onUpdate({ ...link, animation: anim });
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          isSelected
                            ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white border-indigo-400 shadow-md'
                            : 'bg-slate-950/50 text-slate-400 border-white/5 hover:border-white/10 hover:text-white'
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
                        onUpdate({ ...link, display: 'card' });
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
                        onUpdate({ ...link, display: 'icon' });
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
                  onDelete();
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
    </Reorder.Item>
  );
}
