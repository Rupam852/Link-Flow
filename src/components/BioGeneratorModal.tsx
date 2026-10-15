import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Check, RefreshCw, Wand2, Copy } from 'lucide-react';

interface BioGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  onApplyBio: (bio: string) => void;
}

const ROLES = [
  'Developer / Engineer',
  'Content Creator',
  'UI/UX Designer',
  'Founder / Entrepreneur',
  'Musician / Artist',
  'Fitness / Wellness',
  'Writer / Blogger',
  'Student / Learner',
];

const TONES = [
  { id: 'creative', label: '🎨 Aesthetic & Creative' },
  { id: 'professional', label: '💼 Professional & Crisp' },
  { id: 'casual', label: '⚡ Casual & Witty' },
  { id: 'minimal', label: '✨ Minimalist & Punchy' },
];

const TEMPLATES: Record<string, Record<string, string[]>> = {
  'Developer / Engineer': {
    creative: [
      "Crafting digital experiences pixel by pixel ⚡ Turning caffeine into code & open-source tools.",
      "Full-stack explorer 🚀 Building modern web apps, tinkering with AI, and documenting the journey.",
      "Engineering clean systems & aesthetic interfaces ✨ Always shipping something new.",
    ],
    professional: [
      "Full-Stack Software Engineer specializing in scalable web architecture & cloud solutions.",
      "Software Developer passionate about crafting resilient, high-performance distributed systems.",
      "Tech enthusiast & engineer. Building products that bridge design and engineering.",
    ],
    casual: [
      "I turn bugs into features and coffee into commits ☕💻 Check out what I'm building below!",
      "Writing code, breaking production (and fixing it fast) 🔨 Let's connect!",
      "Just another human building cool stuff on the internet 🌐",
    ],
    minimal: [
      "Building software. Shipping daily.",
      "Code • Systems • Products.",
      "Engineer & creator. Welcome to my corner of the web.",
    ],
  },
  'Content Creator': {
    creative: [
      "Storyteller through lens & words 📸 Sharing daily inspiration, tech discoveries & honest thoughts.",
      "Creating aesthetic visual stories ✨ Join my community & explore my latest work below.",
      "Documenting life, creative experiments, and the art of staying curious 🎨",
    ],
    professional: [
      "Digital Content Creator & Media Strategist helping brands build genuine community engagement.",
      "Creator focusing on technology, productivity, and lifestyle insights. Open for collaborations.",
      "Producing actionable content on entrepreneurship and personal growth.",
    ],
    casual: [
      "Making videos, memes & questionable life choices ✨ Grab some popcorn and explore!",
      "Overthinking everything so you don't have to 🎬 Tap the links below for the good stuff.",
      "Creating cool stuff on the internet. Welcome to the crew ✌️",
    ],
    minimal: [
      "Visuals & stories. Let's create together.",
      "Creating daily. Sharing always.",
      "Curator of moments & ideas.",
    ],
  },
  'UI/UX Designer': {
    creative: [
      "Designing interfaces humans love to use 🎨 obsessed with micro-interactions, dark mode & typography.",
      "Shaping ideas into fluid interactive realities ✨ Design systems fanatic & pixel perfectionist.",
      "Where aesthetics meet usability. Crafting digital products with heart and precision.",
    ],
    professional: [
      "Product Designer specializing in intuitive design systems, mobile UX, and user-centric web applications.",
      "Senior UX/UI Designer crafting elegant, scalable interfaces for global tech products.",
      "Bridging user empathy and business goals through thoughtful interface architecture.",
    ],
    casual: [
      "Moving pixels around until they look pretty (and actually work) ✏️",
      "Obsessed with Figma shortcuts and clean layouts. Take a look at my portfolio below!",
      "Design nerd trying to make software feel less robotic 🤖",
    ],
    minimal: [
      "Design systems & thoughtful interfaces.",
      "Less noise, more signal. Product Designer.",
      "Pixels with purpose.",
    ],
  },
  'Founder / Entrepreneur': {
    creative: [
      "Building the future of digital tools 🚀 Passionate about bootstrapping, community & bold ideas.",
      "Zero to one journey ✨ Solving real problems with lean teams & relentless iteration.",
      "Innovator at heart. Building products that empower creators worldwide.",
    ],
    professional: [
      "Founder & Product Builder. Scaling modern digital products from zero to market leadership.",
      "Tech Entrepreneur focused on high-growth SaaS, developer tools, and community-led products.",
      "Building sustainable businesses and sharing transparent lessons along the way.",
    ],
    casual: [
      "Bootstrapping cool startups and having way too much fun doing it 💼 Let's chat!",
      "Turning late-night ideas into live products 🌙 Founder journey in progress.",
      "Building things people actually want to use. Follow the ride 🚀",
    ],
    minimal: [
      "Founder. Builder. Investor.",
      "Shipping products from scratch.",
      "Ideas into reality. Welcome.",
    ],
  },
  'Musician / Artist': {
    creative: [
      "Sound waves & emotional frequencies 🎵 Producing beats, writing melodies & sharing the vibe.",
      "Creating sonic landscapes that speak when words fail ✨ Stream my latest tracks below.",
      "Independent musician blending analog warmth with futuristic beats 🎧",
    ],
    professional: [
      "Music Producer & Sound Designer. Available for mixing, mastering, and scoring projects.",
      "Recording Artist & Songwriter. Stream on Spotify, Apple Music & YouTube.",
      "Composer crafting emotive soundscapes for films, games, and modern media.",
    ],
    casual: [
      "Making noise in my bedroom until it sounds like music 🎸 Turn up the volume below!",
      "Fueled by basslines and late-night inspiration 🎹 Let's vibe.",
      "Singer, songwriter, professional coffee drinker ☕",
    ],
    minimal: [
      "Music & frequencies. Listen below.",
      "Sound • Emotion • Melody.",
      "Independent artist. Stream now.",
    ],
  },
  'Fitness / Wellness': {
    creative: [
      "Empowering minds & transforming bodies 🌿 Mindful movement, holistic health & daily discipline.",
      "Sweat, smiles, and sustainable progress 💪 Helping you build the strongest version of yourself.",
      "Wellness advocate guiding your journey towards mental clarity & physical strength ✨",
    ],
    professional: [
      "Certified Personal Trainer & Nutrition Coach helping busy professionals achieve sustainable health.",
      "Strength & Conditioning Specialist. Custom coaching programs & workout plans available below.",
      "Holistic wellness mentor with 8+ years experience guiding client transformations.",
    ],
    casual: [
      "Lifting heavy things and putting them back down 🏋️‍♂️ Join my fitness journey below!",
      "No gimmicks, just discipline and good workouts 🥗 Let's get moving together.",
      "Healthy habits without the boring routine. Let's work out! 🏃‍♂️",
    ],
    minimal: [
      "Strength • Nutrition • Discipline.",
      "Move daily. Live well.",
      "Mind & body transformation.",
    ],
  },
  'Writer / Blogger': {
    creative: [
      "Weaving words into worlds 🖋️ Writing on philosophy, personal growth, and modern living.",
      "Finding magic in everyday sentences ✨ Essays, thoughts, and weekly newsletters below.",
      "Curator of thoughtful essays and candid reflections on navigating life & creativity.",
    ],
    professional: [
      "Freelance Journalist & Technical Writer simplifying complex ideas for global audiences.",
      "Author & Essayist exploring tech, culture, and human behavior. Read my latest publications.",
      "Copywriter & Content Strategist delivering high-conversion narratives for growing brands.",
    ],
    casual: [
      "Typing out my chaotic thoughts so they make sense on paper 📝 Grab a tea and read along.",
      "Words, caffeine, and lots of deleted drafts ☕ Enjoy my latest articles below!",
      "Writing about life, tech, and everything in between.",
    ],
    minimal: [
      "Words & ideas. Read my stories.",
      "Essayist. Thinker. Reader.",
      "Clear thinking through writing.",
    ],
  },
  'Student / Learner': {
    creative: [
      "Curious mind exploring tech, design & science 📚 Learning in public & sharing the highlights.",
      "Student by day, builder by night ✨ Documenting my learning journey one project at a time.",
      "Passionate learner on a mission to master computer science & creative problem solving 💡",
    ],
    professional: [
      "Computer Science Student passionate about AI research, distributed systems, and open-source.",
      "Undergraduate researcher focused on data analytics, software engineering, and innovation.",
      "Aspiring Software Engineer seeking opportunities to build impactful tools.",
    ],
    casual: [
      "Currently surviving on coffee and lecture slides ☕ Check out my study notes & projects!",
      "Learning something new every single day 🚀 Follow along with my college journey.",
      "Student, builder, and eternal beginner 📖",
    ],
    minimal: [
      "Learning in public. Student & builder.",
      "Curiosity driven. Welcome.",
      "Study • Build • Repeat.",
    ],
  },
};

export default function BioGeneratorModal({
  isOpen,
  onClose,
  displayName,
  onApplyBio,
}: BioGeneratorModalProps) {
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [selectedTone, setSelectedTone] = useState(TONES[0].id);
  const [customKeywords, setCustomKeywords] = useState('');
  const [generatedBios, setGeneratedBios] = useState<string[]>([]);
  const [selectedBio, setSelectedBio] = useState<string | null>(null);
  const [copiedBio, setCopiedBio] = useState<string | null>(null);

  // Generate suggestions
  const handleGenerate = () => {
    const roleTemplates = TEMPLATES[selectedRole] || TEMPLATES['Developer / Engineer'];
    const toneTemplates = roleTemplates[selectedTone] || roleTemplates['creative'];

    let results = [...toneTemplates];
    if (customKeywords.trim()) {
      const kw = customKeywords.trim();
      results = results.map(b => `${b} Focus: ${kw}.`);
    }

    if (displayName) {
      results = results.map(b => (Math.random() > 0.5 ? `Hi, I'm ${displayName}! ${b}` : b));
    }

    setGeneratedBios(results);
    setSelectedBio(results[0] || null);
  };

  React.useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen, selectedRole, selectedTone]);

  const handleCopy = (bio: string) => {
    navigator.clipboard.writeText(bio);
    setCopiedBio(bio);
    setTimeout(() => setCopiedBio(null), 2000);
  };

  const handleApply = () => {
    if (selectedBio) {
      onApplyBio(selectedBio);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white tracking-tight">AI Bio Generator</h2>
                  <p className="text-xs text-slate-400">Generate aesthetic, high-converting bios in 1 click</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Role selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Select Your Role / Persona
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        selectedRole === role
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-950/60 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Choose Vibe / Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(tone => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setSelectedTone(tone.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border ${
                        selectedTone === tone.id
                          ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300'
                          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional custom keywords */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Specific Topics / Interests (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customKeywords}
                    onChange={(e) => setCustomKeywords(e.target.value)}
                    placeholder="e.g. React, Web3, Coffee, Travel..."
                    className="flex-1 px-4 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw size={13} />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Results */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Generated Options (Click to select)
                </label>
                <div className="space-y-2.5">
                  {generatedBios.map((bio, index) => {
                    const isCurrent = selectedBio === bio;
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedBio(bio)}
                        className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/30'
                            : 'bg-slate-950/40 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <p className="text-xs text-slate-200 leading-relaxed pr-16">{bio}</p>
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(bio);
                            }}
                            className="p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white border border-white/5 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedBio === bio ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                          {isCurrent && (
                            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:px-6 bg-slate-950/60 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!selectedBio}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-40"
              >
                <Wand2 size={14} />
                <span>Apply to Profile</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
