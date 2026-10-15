import React from 'react';
import { motion } from 'motion/react';

export default function PublicProfileSkeleton() {
  return (
    <motion.div
      key="public-profile-skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 0.45, ease: 'easeInOut' } }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen w-full overflow-y-auto px-3 sm:px-4 py-8 sm:py-16 flex flex-col items-center justify-start relative overflow-x-hidden bg-[#090d16] text-white selection:bg-indigo-500"
    >
      {/* Dynamic Background Radial Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[55%] aspect-square rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[-10%] w-[50%] aspect-square rounded-full bg-purple-600/8 blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-50" />

      <div className="w-full max-w-md text-center relative z-10">
        {/* Avatar Skeleton */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full animate-spin-slow opacity-60 blur-md" />
          <div className="w-full h-full rounded-full border-2 border-white/10 bg-slate-900/80 backdrop-blur-md relative overflow-hidden flex items-center justify-center shadow-2xl">
            {/* Shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
          </div>
        </div>

        {/* Display Name Skeleton */}
        <div className="h-6 w-44 mx-auto rounded-full bg-white/10 relative overflow-hidden mb-2">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Username Handle Skeleton */}
        <div className="h-3.5 w-24 mx-auto rounded-full bg-white/5 relative overflow-hidden mb-4">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Bio Skeleton */}
        <div className="space-y-2 mb-6 max-w-xs mx-auto">
          <div className="h-3 w-64 mx-auto rounded-full bg-white/5 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="h-3 w-40 mx-auto rounded-full bg-white/5 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>

        {/* Quick Social Icons Row Skeleton */}
        <div className="flex justify-center gap-3 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/5 relative overflow-hidden flex items-center justify-center shadow-lg"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="w-4 h-4 rounded-md bg-white/10" />
            </div>
          ))}
        </div>

        {/* Primary Links Skeleton Stack */}
        <div className="space-y-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full h-16 rounded-2xl bg-slate-900/40 border border-white/5 px-4 flex items-center justify-between relative overflow-hidden shadow-xl backdrop-blur-md"
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

              <div className="flex items-center gap-3.5 relative z-10 w-full">
                {/* Icon placeholder */}
                <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/5 shrink-0 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-md bg-white/10" />
                </div>

                {/* Text lines */}
                <div className="flex-1 text-left space-y-1.5">
                  <div
                    className="h-3.5 rounded-full bg-white/15 relative overflow-hidden"
                    style={{ width: `${60 + (i * 12) % 35}%` }}
                  />
                  <div
                    className="h-2.5 rounded-full bg-white/5 relative overflow-hidden"
                    style={{ width: `${35 + (i * 15) % 30}%` }}
                  />
                </div>

                {/* Right arrow placeholder */}
                <div className="w-4 h-4 rounded-full bg-white/5 shrink-0" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <div className="h-3 w-28 mx-auto rounded-full bg-white/5 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
