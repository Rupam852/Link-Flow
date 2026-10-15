import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ZoomIn, ZoomOut, RotateCcw, Sparkles, Move, Check, AlertCircle } from 'lucide-react';

interface BackgroundCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawImage: string | null;
  onUploadSuccess: (url: string) => void;
  cloudName: string;
  uploadPreset: string;
  oldImageUrl?: string; // purana background URL (delete karne ke liye)
}

export default function BackgroundCropModal({
  isOpen,
  onClose,
  rawImage,
  onUploadSuccess,
  cloudName,
  uploadPreset,
  oldImageUrl,
}: BackgroundCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [naturalDim, setNaturalDim] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const initialPan = useRef({ x: 0, y: 0 });

  // Viewport dimensions (9:16 aspect ratio: 240 x 426)
  const FRAME_W = 240;
  const FRAME_H = 426;

  useEffect(() => {
    if (rawImage) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setErrorMessage(null);
      const img = new Image();
      img.onload = () => {
        setNaturalDim({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = rawImage;
    }
  }, [rawImage, isOpen]);

  if (!isOpen || !rawImage) return null;

  // Cover calculations
  const baseScale = naturalDim.width && naturalDim.height
    ? Math.max(FRAME_W / naturalDim.width, FRAME_H / naturalDim.height)
    : 1;

  const currentScale = baseScale * zoom;
  const displayW = naturalDim.width * currentScale;
  const displayH = naturalDim.height * currentScale;

  const baseX = (FRAME_W - displayW) / 2;
  const baseY = (FRAME_H - displayH) / 2;

  const finalX = baseX + pan.x;
  const finalY = baseY + pan.y;

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    initialPan.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setPan({
      x: initialPan.current.x + dx,
      y: initialPan.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.min(3, Math.max(1, prev - e.deltaY * 0.002)));
  };

  // Crop & upload to Cloudinary
  const handleApplyCrop = async () => {
    if (!naturalDim.width || !naturalDim.height) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      // 1. Offscreen canvas at 1080 x 1920 HD mobile resolution
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas rendering context failed');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = rawImage;
      });

      // Calculate slice coordinates from source image
      const sx = -finalX / currentScale;
      const sy = -finalY / currentScale;
      const sw = FRAME_W / currentScale;
      const sh = FRAME_H / currentScale;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      // 2. Export canvas as blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.92);
      });

      if (!blob) throw new Error('Failed to create image blob');

      // 3. Upload new image to Cloudinary
      const formData = new FormData();
      formData.append('file', blob, 'background.jpg');
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!data.secure_url) {
        throw new Error(data.error?.message || 'Cloudinary upload failed');
      }

      // 4. Naya URL milte hi purana background delete karo (silently)
      if (oldImageUrl && oldImageUrl.includes('cloudinary.com')) {
        try {
          await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: oldImageUrl }),
          });
        } catch (deleteErr) {
          // Delete fail hone pe upload cancel mat karo — silently ignore
          console.warn('Old background delete failed (non-critical):', deleteErr);
        }
      }

      onUploadSuccess(data.secure_url);
      onClose();
    } catch (err: any) {
      console.error('Crop and upload error:', err);
      setErrorMessage(err.message || 'Failed to crop and upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] z-10"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-md">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  Frame Background
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    9:16 Mobile
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Drag to position and zoom to select your focal area</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white disabled:opacity-50"
            >
              <Plus size={22} className="rotate-45" />
            </button>
          </div>

          {/* Interactive Cropper Area */}
          <div className="p-4 sm:p-6 flex flex-col items-center bg-slate-950/30 overflow-y-auto">
            {/* 9:16 Framing Container */}
            <div
              className="relative rounded-2xl overflow-hidden border-2 border-indigo-500/80 shadow-2xl shadow-indigo-500/20 cursor-grab active:cursor-grabbing select-none touch-none"
              style={{ width: `${FRAME_W}px`, height: `${FRAME_H}px` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
            >
              {/* Image */}
              {naturalDim.width > 0 && (
                <img
                  ref={imgRef}
                  src={rawImage}
                  alt="Crop preview"
                  draggable={false}
                  className="absolute pointer-events-none max-w-none transition-none"
                  style={{
                    width: `${displayW}px`,
                    height: `${displayH}px`,
                    left: `${finalX}px`,
                    top: `${finalY}px`,
                  }}
                />
              )}

              {/* Rule of thirds grid overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-white/15" />
                <div className="border-r border-white/15" />
                <div />
              </div>

              {/* Instruction chip */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none bg-slate-950/80 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-md">
                <Move size={11} className="text-indigo-400" />
                <span className="text-[10px] font-semibold text-slate-300">Drag to re-frame</span>
              </div>
            </div>

            {/* Zoom Slider and Controls */}
            <div className="w-full max-w-xs mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
                  <ZoomIn size={12} className="text-indigo-400" /> Zoom
                </span>
                <span className="font-mono text-[11px] text-indigo-300">{zoom.toFixed(2)}x</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ZoomOut size={16} className="text-slate-400 shrink-0" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <ZoomIn size={16} className="text-slate-400 shrink-0" />
              </div>

              {/* Reset Button */}
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  <RotateCcw size={12} /> Reset Position
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-3 p-2.5 w-full bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:px-6 bg-slate-950/60 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isUploading}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Apply & Set Background</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
