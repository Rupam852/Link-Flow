import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Download, X, Copy, Check, Sparkles, Image as ImageIcon, Share2 } from 'lucide-react';
import QRCode from 'qrcode';

export interface QRTheme {
  id: string;
  name: string;
  gradient: [string, string];
  glow: string;
  bgDark: string;
}

export const QR_THEMES: QRTheme[] = [
  { id: 'indigo', name: 'Cyber Indigo', gradient: ['#6366f1', '#06b6d4'], glow: 'rgba(99, 102, 241, 0.45)', bgDark: '#080d1a' },
  { id: 'sunset', name: 'Neon Sunset', gradient: ['#ec4899', '#f97316'], glow: 'rgba(236, 72, 153, 0.45)', bgDark: '#120814' },
  { id: 'emerald', name: 'Emerald Luxe', gradient: ['#10b981', '#14b8a6'], glow: 'rgba(16, 185, 129, 0.45)', bgDark: '#071410' },
  { id: 'violet', name: 'Royal Violet', gradient: ['#8b5cf6', '#d946ef'], glow: 'rgba(139, 92, 246, 0.45)', bgDark: '#0f0a1c' },
  { id: 'platinum', name: 'Pure Platinum', gradient: ['#f8fafc', '#94a3b8'], glow: 'rgba(248, 250, 252, 0.35)', bgDark: '#0b0f19' },
];

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  profileUrl: string;
  avatarUrl?: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  username,
  profileUrl,
  avatarUrl,
}: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTheme, setSelectedTheme] = useState<QRTheme>(QR_THEMES[0]);
  const [centerBadge, setCenterBadge] = useState<'app_logo' | 'avatar' | 'none'>('app_logo');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Draw the custom unique QR code on the canvas
  const drawQRCode = async (
    targetCanvas: HTMLCanvasElement,
    size: number = 600,
    forExport: boolean = false
  ): Promise<void> => {
    return new Promise((resolve) => {
      targetCanvas.width = size;
      targetCanvas.height = size;
      const ctx = targetCanvas.getContext('2d');
      if (!ctx) {
        resolve();
        return;
      }

      // Generate raw QR matrix using high error correction (H allows up to 30% center overlay without scan loss)
      const qr = QRCode.create(profileUrl, { errorCorrectionLevel: 'H' });
      const moduleCount = qr.modules.size;
      const padding = size * 0.085;
      const usableSize = size - padding * 2;
      const moduleSize = usableSize / moduleCount;

      // 1. Dark canvas background with rounded squircle
      ctx.fillStyle = selectedTheme.bgDark;
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = '#0d1326';
      ctx.beginPath();
      ctx.roundRect(padding * 0.4, padding * 0.4, size - padding * 0.8, size - padding * 0.8, size * 0.06);
      ctx.fill();

      // 2. Linear Gradient for the dots and eyes
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, selectedTheme.gradient[0]);
      grad.addColorStop(1, selectedTheme.gradient[1]);
      ctx.fillStyle = grad;

      // Finder eye check (7x7 in 3 corners)
      const isFinder = (r: number, c: number) => {
        if (r < 7 && c < 7) return true;
        if (r < 7 && c >= moduleCount - 7) return true;
        if (r >= moduleCount - 7 && c < 7) return true;
        return false;
      };

      // Center logo clearance zone
      const centerIdx = (moduleCount - 1) / 2;
      const centerRadiusModules = centerBadge !== 'none' ? 4.4 : 0;
      const isCenterZone = (r: number, c: number) => {
        if (centerBadge === 'none') return false;
        return Math.hypot(r - centerIdx, c - centerIdx) <= centerRadiusModules;
      };

      // 3. Draw smooth rounded micro-dots for modules
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (isFinder(r, c) || isCenterZone(r, c)) continue;
          if (qr.modules.get(r, c)) {
            const cx = padding + c * moduleSize + moduleSize / 2;
            const cy = padding + r * moduleSize + moduleSize / 2;
            const dotRadius = (moduleSize / 2) * 0.88;
            ctx.beginPath();
            ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 4. Draw modern rounded corner eyes (position finder patterns)
      const drawEye = (startRow: number, startCol: number) => {
        const eyeX = padding + startCol * moduleSize;
        const eyeY = padding + startRow * moduleSize;
        const eyeSize = 7 * moduleSize;

        // Outer smooth squircle
        ctx.lineWidth = moduleSize * 0.95;
        ctx.strokeStyle = selectedTheme.gradient[0];
        ctx.beginPath();
        ctx.roundRect(
          eyeX + moduleSize * 0.5,
          eyeY + moduleSize * 0.5,
          eyeSize - moduleSize,
          eyeSize - moduleSize,
          moduleSize * 2.2
        );
        ctx.stroke();

        // Inner eye iris pill
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(
          eyeX + moduleSize * 2,
          eyeY + moduleSize * 2,
          moduleSize * 3,
          moduleSize * 3,
          moduleSize * 1.3
        );
        ctx.fill();
      };

      drawEye(0, 0); // Top-left
      drawEye(0, moduleCount - 7); // Top-right
      drawEye(moduleCount - 7, 0); // Bottom-left

      // 5. Center Badge with App Logo or User Avatar
      if (centerBadge === 'none') {
        resolve();
        return;
      }

      const centerX = size / 2;
      const centerY = size / 2;
      const badgeDiameter = moduleSize * 8.4;
      const badgeRadius = badgeDiameter / 2;

      // Outer badge circle with glow
      ctx.save();
      ctx.shadowColor = selectedTheme.glow;
      ctx.shadowBlur = size * 0.035;
      ctx.beginPath();
      ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#080d1a';
      ctx.fill();

      ctx.lineWidth = size * 0.007;
      ctx.strokeStyle = grad;
      ctx.stroke();
      ctx.restore();

      // Load logo image
      const imgUrl = centerBadge === 'avatar' && avatarUrl ? avatarUrl : '/favicon.png';
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius * 0.88, 0, Math.PI * 2);
        ctx.clip();

        const innerSize = badgeRadius * 1.76;
        ctx.drawImage(
          logoImg,
          centerX - innerSize / 2,
          centerY - innerSize / 2,
          innerSize,
          innerSize
        );
        ctx.restore();
        resolve();
      };
      logoImg.onerror = () => {
        // Fallback: infinity loop / electric symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(badgeRadius * 0.9)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', centerX, centerY);
        resolve();
      };
      logoImg.src = imgUrl;
    });
  };

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    drawQRCode(canvasRef.current, 600);
  }, [isOpen, profileUrl, selectedTheme, centerBadge, avatarUrl]);

  // Download high-resolution branded poster card
  const handleDownloadPoster = async () => {
    setIsDownloading(true);

    const posterCanvas = document.createElement('canvas');
    posterCanvas.width = 800;
    posterCanvas.height = 1040;
    const ctx = posterCanvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    ctx.fillStyle = '#070a13';
    ctx.fillRect(0, 0, 800, 1040);

    // Ambient radial glow behind card
    const radialGlow = ctx.createRadialGradient(400, 480, 50, 400, 480, 450);
    radialGlow.addColorStop(0, selectedTheme.glow);
    radialGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, 800, 1040);

    // Poster Frame Card
    ctx.fillStyle = '#0b0f19';
    ctx.beginPath();
    ctx.roundRect(40, 40, 720, 960, 36);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // App Branding Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LinkFlow', 400, 110);

    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
    ctx.fillText(`@${username}`, 400, 160);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText('Scan with camera to connect instantly', 400, 195);

    // Draw the QR Code in the middle
    const qrCanvas = document.createElement('canvas');
    await drawQRCode(qrCanvas, 520, true);
    ctx.drawImage(qrCanvas, 140, 240, 520, 520);

    // Profile URL pill badge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(140, 800, 520, 52, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 16px monospace, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(profileUrl, 400, 832);

    // Footer signature
    ctx.fillStyle = '#64748b';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText('⚡ POWERED BY LINKFLOW • ALL-IN-ONE BIO LINK', 400, 940);

    // Trigger download
    const link = document.createElement('a');
    link.download = `linkflow-qr-card-${username}.png`;
    link.href = posterCanvas.toDataURL('image/png');
    link.click();

    setTimeout(() => setIsDownloading(false), 800);
  };

  // Download raw standalone QR code PNG
  const handleDownloadQROnly = async () => {
    setIsDownloading(true);
    const qrCanvas = document.createElement('canvas');
    await drawQRCode(qrCanvas, 800, true);

    const link = document.createElement('a');
    link.download = `linkflow-qr-${username}.png`;
    link.href = qrCanvas.toDataURL('image/png');
    link.click();

    setTimeout(() => setIsDownloading(false), 800);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(profileUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${selectedTheme.gradient[0]}, ${selectedTheme.gradient[1]})`,
                  }}
                >
                  <QrCode size={20} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                    <span>Premium QR Code</span>
                    <Sparkles size={14} className="text-amber-400" />
                  </h2>
                  <p className="text-[11px] text-slate-400">Unique branded QR for @{username}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Center Canvas Display with Laser Scanner Beam */}
              <div className="flex justify-center">
                <div
                  className="relative p-3.5 rounded-3xl border shadow-2xl transition-all duration-300 overflow-hidden"
                  style={{
                    backgroundColor: selectedTheme.bgDark,
                    borderColor: `${selectedTheme.gradient[0]}40`,
                    boxShadow: `0 20px 40px -10px ${selectedTheme.glow}`,
                  }}
                >
                  {/* Modern corner bracket accents */}
                  <div
                    className="absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 rounded-tl-xl pointer-events-none"
                    style={{ borderColor: selectedTheme.gradient[0] }}
                  />
                  <div
                    className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 rounded-tr-xl pointer-events-none"
                    style={{ borderColor: selectedTheme.gradient[1] }}
                  />
                  <div
                    className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 rounded-bl-xl pointer-events-none"
                    style={{ borderColor: selectedTheme.gradient[0] }}
                  />
                  <div
                    className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 rounded-br-xl pointer-events-none"
                    style={{ borderColor: selectedTheme.gradient[1] }}
                  />

                  {/* Canvas Output */}
                  <canvas
                    ref={canvasRef}
                    className="rounded-2xl block w-[240px] h-[240px] sm:w-[270px] sm:h-[270px]"
                  />

                  {/* Ambient laser scanner line */}
                  <motion.div
                    animate={{ y: [0, 240, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="absolute left-4 right-4 h-0.5 opacity-60 pointer-events-none"
                    style={{
                      background: `linear-gradient(to right, transparent, ${selectedTheme.gradient[0]}, ${selectedTheme.gradient[1]}, transparent)`,
                      boxShadow: `0 0 12px ${selectedTheme.gradient[0]}`,
                    }}
                  />
                </div>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span>🎨</span> Choose Color Palette
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {QR_THEMES.map((theme) => {
                    const isSelected = selectedTheme.id === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedTheme(theme)}
                        className={`h-10 rounded-xl p-1 transition-all flex items-center justify-center relative border ${
                          isSelected
                            ? 'border-white scale-105 shadow-md shadow-indigo-500/30'
                            : 'border-white/10 hover:border-white/30 opacity-75 hover:opacity-100'
                        }`}
                        title={theme.name}
                      >
                        <div
                          className="w-full h-full rounded-lg"
                          style={{
                            background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Center Logo Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span>⚡</span> Center Badge
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCenterBadge('app_logo')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      centerBadge === 'app_logo'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <img src="/favicon.png" alt="App Logo" className="w-3.5 h-3.5 rounded object-cover" />
                    <span>App Logo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCenterBadge('avatar')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      centerBadge === 'avatar'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <ImageIcon size={13} />
                    <span>My Avatar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCenterBadge('none')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      centerBadge === 'none'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <span>Clean</span>
                  </button>
                </div>
              </div>

              {/* Profile Link Display + Copy */}
              <div className="flex items-center gap-2 w-full bg-slate-950/60 border border-white/8 rounded-2xl px-4 py-2.5">
                <span className="flex-1 text-xs text-indigo-300 font-mono truncate">{profileUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                  title="Copy Profile Link"
                >
                  {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Download Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleDownloadPoster}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-2xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all shadow-xl active:scale-95 disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${selectedTheme.gradient[0]}, ${selectedTheme.gradient[1]})`,
                    boxShadow: `0 10px 25px -5px ${selectedTheme.glow}`,
                  }}
                >
                  <Download size={16} />
                  <span>{isDownloading ? 'Generating Card...' : 'Download Branded Card Poster'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQROnly}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
                >
                  <QrCode size={14} />
                  <span>Download Standalone QR Only (PNG)</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
