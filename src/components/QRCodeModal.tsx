import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Download, X, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  profileUrl: string;
}

export default function QRCodeModal({ isOpen, onClose, username, profileUrl }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, profileUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#ffffff',
        light: '#0f172a',
      },
      errorCorrectionLevel: 'H',
    });
  }, [isOpen, profileUrl]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    setIsDownloading(true);

    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = 400;
    downloadCanvas.height = 480;
    const ctx = downloadCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 400, 480);

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(10, 10, 380, 460, 24);
    ctx.stroke();

    ctx.drawImage(canvasRef.current, 60, 60, 280, 280);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`@${username}`, 200, 390);

    ctx.fillStyle = '#6366f1';
    ctx.font = '14px system-ui';
    ctx.fillText(profileUrl, 200, 420);

    ctx.fillStyle = '#475569';
    ctx.font = '12px system-ui';
    ctx.fillText('Made with LinkFlow', 200, 455);

    const link = document.createElement('a');
    link.download = `linkflow-qr-${username}.png`;
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();

    setTimeout(() => setIsDownloading(false), 1000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(profileUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
                  <QrCode size={18} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight">QR Code</h2>
                  <p className="text-[11px] text-slate-400">Share your profile instantly</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-5 p-6">
              <div className="relative p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 shadow-xl shadow-indigo-500/10">
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-indigo-500 rounded-tl-lg" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-indigo-500 rounded-tr-lg" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-indigo-500 rounded-bl-lg" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-indigo-500 rounded-br-lg" />
                <canvas ref={canvasRef} className="rounded-xl block" />
              </div>

              <div className="flex items-center gap-2 w-full bg-slate-950/60 border border-white/8 rounded-2xl px-4 py-3">
                <span className="flex-1 text-xs text-indigo-300 font-mono truncate">{profileUrl}</span>
                <button
                  onClick={handleCopyUrl}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                >
                  {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              <p className="text-sm font-bold text-slate-300">
                Scan to visit <span className="text-indigo-400">@{username}</span>
              </p>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 active:scale-95 disabled:opacity-60"
              >
                <Download size={15} />
                <span>{isDownloading ? 'Downloading...' : 'Download QR Code'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
