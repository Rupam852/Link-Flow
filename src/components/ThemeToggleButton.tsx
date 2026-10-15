import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useThemeMode } from '../context/ThemeContext';

interface ThemeToggleButtonProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggleButton({ className = '', showLabel = false }: ThemeToggleButtonProps) {
  const { isDark, toggleTheme } = useThemeMode();

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 font-bold text-xs select-none ${
        isDark
          ? 'bg-slate-900/90 text-amber-400 border border-white/10 hover:border-amber-400/40 hover:bg-slate-800 shadow-lg shadow-amber-500/5'
          : 'bg-white text-indigo-600 border border-slate-200/90 hover:border-indigo-400/50 hover:bg-slate-50 shadow-md shadow-slate-200/70'
      } ${className}`}
    >
      {/* Animated Icon Container */}
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <motion.div
          key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? (
            <Moon size={15} className="text-amber-400 fill-amber-400/20" />
          ) : (
            <Sun size={15} className="text-amber-500 fill-amber-500/20" />
          )}
        </motion.div>
      </div>

      {showLabel && (
        <span className={`tracking-wider uppercase text-[10px] font-extrabold transition-colors ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}>
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </motion.button>
  );
}
