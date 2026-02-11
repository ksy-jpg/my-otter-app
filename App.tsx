/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Stats, GameStatus, Choice, Scenario, StatKey, Character, OtterType } from './types';
import { SCENARIOS, INITIAL_STATS } from './constants';
import { GoogleGenAI } from "@google/genai";

// --- Audio Controller ---
class AudioController {
  private ctx: AudioContext | null = null;
  private bgNodes: AudioNode[] = [];
  private isMusicPlaying = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startBackgroundMusic() {
    this.init();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    const masterGain = this.ctx!.createGain();
    masterGain.gain.setValueAtTime(0, this.ctx!.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.25, this.ctx!.currentTime + 3);
    masterGain.connect(this.ctx!.destination);
    this.bgNodes.push(masterGain);

    const rootFreqs = [220, 277.18, 329.63, 415.30]; 

    rootFreqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000 + (i * 200), this.ctx!.currentTime);
      filter.Q.setValueAtTime(1, this.ctx!.currentTime);

      g.gain.setValueAtTime(0, this.ctx!.currentTime);
      g.gain.linearRampToValueAtTime(0.02, this.ctx!.currentTime + 4 + i);

      const swell = () => {
        if (!this.isMusicPlaying) return;
        const now = this.ctx!.currentTime;
        g.gain.exponentialRampToValueAtTime(0.04, now + 4);
        g.gain.exponentialRampToValueAtTime(0.01, now + 8);
        setTimeout(swell, 8000);
      };
      swell();

      osc.connect(filter);
      filter.connect(g);
      g.connect(masterGain);
      osc.start();
      this.bgNodes.push(osc);
    });

    const pulseOsc = this.ctx!.createOscillator();
    const pulseGain = this.ctx!.createGain();
    pulseOsc.type = 'sine';
    pulseOsc.frequency.setValueAtTime(220, this.ctx!.currentTime); 
    pulseGain.gain.setValueAtTime(0, this.ctx!.currentTime);
    pulseOsc.connect(pulseGain);
    pulseGain.connect(masterGain);
    pulseOsc.start();
    this.bgNodes.push(pulseOsc);

    const playPulse = () => {
      if (!this.isMusicPlaying) return;
      const now = this.ctx!.currentTime;
      pulseGain.gain.cancelScheduledValues(now);
      pulseGain.gain.setValueAtTime(0, now);
      pulseGain.gain.linearRampToValueAtTime(0.04, now + 0.05);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      setTimeout(playPulse, 500);
    };
    playPulse();

    const crystalNotes = [880, 987.77, 1108.73, 1318.51, 1661.22]; 
    const scheduleSpark = () => {
      if (!this.isMusicPlaying) return;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      const delay = this.ctx!.createDelay();
      const feedback = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(crystalNotes[Math.floor(Math.random() * crystalNotes.length)], this.ctx!.currentTime);
      
      g.gain.setValueAtTime(0, this.ctx!.currentTime);
      g.gain.linearRampToValueAtTime(0.015, this.ctx!.currentTime + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 1.5);

      delay.delayTime.setValueAtTime(0.4, this.ctx!.currentTime);
      feedback.gain.setValueAtTime(0.4, this.ctx!.currentTime);

      osc.connect(g);
      g.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(masterGain);
      g.connect(masterGain);

      osc.start();
      osc.stop(this.ctx!.currentTime + 2);
      setTimeout(scheduleSpark, 2000 + Math.random() * 4000);
    };
    scheduleSpark();
  }

  playWhoosh() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1500, this.ctx!.currentTime + 0.4);
    gain.gain.setValueAtTime(0, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx!.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.4);
    osc.connect(gain); gain.connect(this.ctx!.destination);
    osc.start(); osc.stop(this.ctx!.currentTime + 0.4);
  }

  playStatChange() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx!.currentTime + 0.05);
    gain.gain.setValueAtTime(0.03, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.1);
    osc.connect(gain); gain.connect(this.ctx!.destination);
    osc.start(); osc.stop(this.ctx!.currentTime + 0.1);
  }

  playDing() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx!.currentTime + 0.3);
    gain.gain.setValueAtTime(0, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.ctx!.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.3);
    osc.connect(gain); gain.connect(this.ctx!.destination);
    osc.start(); osc.stop(this.ctx!.currentTime + 0.3);
  }

  playThud() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, this.ctx!.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx!.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.3);
    osc.connect(gain); gain.connect(this.ctx!.destination);
    osc.start(); osc.stop(this.ctx!.currentTime + 0.3);
  }
}

const audio = new AudioController();

const CharacterPortrait: React.FC<{ char: Character, className?: string }> = ({ char, className }) => {
  return (
    <div className={`relative overflow-hidden bg-slate-900/60 border border-sky-400/40 rounded-sm ${className} shadow-[0_0_15px_rgba(56,189,248,0.2)] flex items-center justify-center`}>
      <svg viewBox="0 0 100 120" className="w-full h-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        
        {/* Background Aura */}
        <circle cx="50" cy="50" r="45" fill="rgba(56,189,248,0.05)" />
        
        {/* 1. Otter Base Shape (Dark Fur) */}
        <path d="M50 15 Q75 15 80 45 L80 105 Q80 115 50 115 Q20 115 20 105 L20 45 Q25 15 50 15" fill="#5d4037" />
        
        {/* 2. Light Tan Patch (Face/Chest area) */}
        <path d="M50 22 Q70 22 72 45 L70 75 Q70 95 50 95 Q30 95 28 75 L28 45 Q30 22 50 22" fill="#d7ccc8" />

        {/* 3. Ears */}
        <circle cx="28" cy="25" r="7" fill="#5d4037" />
        <circle cx="72" cy="25" r="7" fill="#5d4037" />
        <circle cx="28" cy="25" r="3.5" fill="#3e2723" />
        <circle cx="72" cy="25" r="3.5" fill="#3e2723" />
        
        {/* 4. Muzzle Area (Lightest Cream) */}
        <ellipse cx="50" cy="55" rx="14" ry="11" fill="#f5f5f5" />
        
        {/* 5. Whiskers */}
        <g stroke="#ffffff" strokeWidth="0.5" opacity="0.6">
          <line x1="38" y1="52" x2="15" y2="45" />
          <line x1="38" y1="55" x2="12" y2="55" />
          <line x1="38" y1="58" x2="15" y2="65" />
          <line x1="62" y1="52" x2="85" y2="45" />
          <line x1="62" y1="55" x2="88" y2="55" />
          <line x1="62" y1="58" x2="85" y2="65" />
        </g>
        
        {/* 6. Nose */}
        <path d="M46 50 Q50 48 54 50 Q54 53 50 55 Q46 53 46 50" fill="#212121" />
        <circle cx="48" cy="50.5" r="0.8" fill="white" opacity="0.4" />

        {/* 7. EJC Tailored Uniform */}
        {/* White Shirt Base */}
        <path d="M22 80 Q50 72 78 80 L78 102 Q50 108 22 102 Z" fill="#ffffff" />
        
        {/* Navy Tie (Behind Collars) */}
        <path d="M47 80 L53 80 L54 102 L50 106 L46 102 Z" fill="#1e3a8a" filter="url(#glow)" />
        <rect x="47" y="80" width="6" height="4" fill="#112255" />

        {/* Improved Collar Flaps */}
        {/* Left Collar Flap (Viewer's Left) */}
        <path d="M48 80 L25 82 Q30 88 43 91 Z" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.2" />
        {/* Right Collar Flap (Viewer's Right) */}
        <path d="M52 80 L75 82 Q70 88 57 91 Z" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.2" />

        {/* EJC COLLAR PIN on the Right Collar (Viewer's Right) */}
        <g transform="translate(68, 85)">
          {/* Outer Gold/Bronze Ring */}
          <circle r="1.8" fill="#d4af37" stroke="#b8860b" strokeWidth="0.1" />
          {/* Dark Inner Circle */}
          <circle r="1.2" fill="#1e293b" />
          {/* Tiny Metallic Highlight */}
          <circle cx="-0.4" cy="-0.4" r="0.3" fill="white" opacity="0.6" />
        </g>

        {/* Grey Bottoms */}
        <path d="M22 102 Q50 108 78 102 L78 112 Q50 118 22 112 Z" fill="#4b5563" />
        
        {/* 8. Emotions */}
        {(() => {
          switch (char.otterType) {
            case 'EXCITED':
              return (
                <>
                  <circle cx="40" cy="40" r="5" fill="#111" />
                  <circle cx="60" cy="40" r="5" fill="#111" />
                  <circle cx="42" cy="38" r="2" fill="white" />
                  <circle cx="62" cy="38" r="2" fill="white" />
                  <path d="M42 58 Q50 64 58 58" fill="none" stroke="#212121" strokeWidth="1.5" />
                  <path d="M35 30 Q40 25 45 30" fill="none" stroke="#212121" strokeWidth="1" />
                  <path d="M55 30 Q60 25 65 30" fill="none" stroke="#212121" strokeWidth="1" />
                </>
              );
            case 'INSPIRED':
              return (
                <>
                  <path d="M40 34 L41 39 L46 40 L41 41 L40 46 L39 41 L34 40 L39 39 Z" fill="#fcd34d" filter="url(#glow)" />
                  <path d="M60 34 L61 39 L66 40 L61 41 L60 46 L59 41 L54 40 L59 39 Z" fill="#fcd34d" filter="url(#glow)" />
                  <path d="M45 57 Q50 61 55 57" fill="none" stroke="#212121" strokeWidth="1.5" />
                </>
              );
            case 'HAPPY':
              return (
                <>
                  <path d="M35 42 Q40 37 45 42" fill="none" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M55 42 Q60 37 65 42" fill="none" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M43 56 Q50 62 57 56" fill="none" stroke="#212121" strokeWidth="2" />
                  <circle cx="32" cy="48" r="4" fill="#ffcdd2" opacity="0.5" />
                  <circle cx="68" cy="48" r="4" fill="#ffcdd2" opacity="0.5" />
                </>
              );
            case 'DETERMINED':
              return (
                <>
                  <circle cx="40" cy="42" r="4.5" fill="#111" />
                  <circle cx="60" cy="42" r="4.5" fill="#111" />
                  <circle cx="41.5" cy="40.5" r="1.5" fill="white" />
                  <circle cx="61.5" cy="40.5" r="1.5" fill="white" />
                  <line x1="34" y1="34" x2="46" y2="38" stroke="#212121" strokeWidth="3" />
                  <line x1="66" y1="34" x2="54" y2="38" stroke="#212121" strokeWidth="3" />
                  <path d="M46 58 L54 58" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />
                </>
              );
          }
        })()}
      </svg>
      {/* HUD Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
    </div>
  );
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('START');
  const [character, setCharacter] = useState<Character>({
    name: "EU-OTTER 01",
    otterType: 'HAPPY'
  });
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<'REST_BONUS' | 'GRIND_PENALTY' | null>(null);
  const [lastModifier, setLastModifier] = useState<Partial<Record<StatKey, number>> | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isSurging, setIsSurging] = useState<boolean>(false);
  
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const currentScenario = SCENARIOS[currentIdx];

  const sanityColor = useMemo(() => {
    if (stats.sanity > 65) return 'sky';
    if (stats.sanity > 35) return 'amber';
    return 'rose';
  }, [stats.sanity]);

  const handleChoice = useCallback((choice: Choice) => {
    if (status !== 'PLAYING' || feedback || isExiting || isEntering) return;

    const newStats = { ...stats };
    let hasBigDrop = false;

    Object.entries(choice.modifiers).forEach(([key, val]) => {
      const k = key as StatKey;
      const numVal = Number(val) || 0;
      newStats[k] = Math.max(0, Math.min(100, newStats[k] + numVal));
      if (numVal <= -20) hasBigDrop = true;
    });

    audio.playStatChange();
    setIsSurging(true);
    setTimeout(() => setIsSurging(false), 800);

    if (hasBigDrop) {
      audio.playThud();
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 500);
    } else {
      audio.playDing();
    }

    setStats(newStats);
    setLastModifier(choice.modifiers);
    setFeedback(choice.feedback);
    if (choice.specialTag) setActiveTag(choice.specialTag);
  }, [status, stats, feedback, isExiting, isEntering]);

  const handleProceed = useCallback(() => {
    if (!feedback || isExiting) return;
    
    setIsExiting(true);
    audio.playWhoosh();
    
    setTimeout(() => {
      if (currentIdx < SCENARIOS.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setFeedback(null);
        setActiveTag(null);
        setLastModifier(null);
        setIsExiting(false);
        setIsEntering(true);
        setTimeout(() => setIsEntering(false), 600);
      } else {
        setStatus('GRADUATION');
      }
    }, 500);
  }, [feedback, currentIdx, isExiting]);

  const handleBack = useCallback(() => {
    if (!feedback || !lastModifier || isExiting) return;

    // Revert stat changes
    const revertedStats = { ...stats };
    Object.entries(lastModifier).forEach(([key, val]) => {
      const k = key as StatKey;
      const numVal = Number(val) || 0;
      revertedStats[k] = Math.max(0, Math.min(100, revertedStats[k] - numVal));
    });

    audio.playWhoosh();
    setStats(revertedStats);
    setFeedback(null);
    setLastModifier(null);
    setActiveTag(null);
  }, [feedback, lastModifier, stats, isExiting]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === 'START') {
        if (e.key === 'Enter' || e.key === ' ') { 
          setStatus('CUSTOMIZATION'); 
          audio.playDing();
          audio.startBackgroundMusic();
        }
        return;
      }
      if (status === 'PLAYING') {
        if (!feedback && !isExiting && !isEntering) {
          if (e.key === 'ArrowLeft') handleChoice(currentScenario.optionA);
          if (e.key === 'ArrowRight') handleChoice(currentScenario.optionB);
        } else if (feedback && !isExiting) {
          if (e.key === 'Enter' || e.key === ' ') handleProceed();
          if (e.key === 'Backspace' || e.key === 'Escape') handleBack();
        }
      }
      if (status === 'GRADUATION' && e.key === 'r') {
        window.location.reload();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, currentScenario, handleChoice, handleProceed, handleBack, feedback, isExiting, isEntering]);

  const StatBar = ({ name, value, icon, color }: { name: string, value: number, icon: string, color: string }) => (
    <div className="flex flex-col flex-1 gap-1 group min-w-0">
      <div className="flex justify-between items-end px-1">
        <span className="text-[7px] md:text-[9px] font-black uppercase tracking-tight text-sky-400 group-hover:text-amber-400 truncate pr-1">
          {icon} {name}
        </span>
        <span className="text-[8px] md:text-[10px] font-mono font-bold text-sky-500">
          {value}%
        </span>
      </div>
      <div className="h-1.5 md:h-2 w-full bg-slate-900/50 border border-sky-900/30 p-0.5 overflow-hidden backdrop-blur-sm relative">
        <div className={`h-full transition-[width] duration-1000 cubic-bezier(0.16, 1, 0.3, 1) relative ${color} opacity-80`} style={{ width: `${value}%` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-sky-track" />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans flex flex-col overflow-hidden select-none bg-black text-sky-50 ${isFlashing ? 'bg-rose-950/50' : ''}`}>
      
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 bg-cover bg-center scale-110 animate-hologram-pulse transition-opacity duration-1000 ${isSurging ? 'opacity-80 scale-125 saturate-200' : 'opacity-50'}`}
          style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Eunoia_Junior_College_campus.jpg/1600px-Eunoia_Junior_College_campus.jpg')", filter: "brightness(0.3) contrast(2.5) saturate(0)", mixBlendMode: 'screen' }} />
        
        <div className="absolute bottom-0 left-0 w-full h-full perspective-[1000px] overflow-hidden opacity-40">
           <div className={`absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 border-t rotate-x-60 origin-top animate-grid-scroll transition-colors duration-1000 ${sanityColor === 'sky' ? 'border-sky-500/30' : sanityColor === 'amber' ? 'border-amber-500/30' : 'border-rose-500/50'}`}
                style={{ backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
        </div>

        <div className={`absolute inset-0 bg-gradient-to-t from-transparent via-sky-500/10 to-transparent transition-transform duration-700 ${isSurging ? 'translate-y-full opacity-100' : '-translate-y-full opacity-0'}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950/80 to-black opacity-90" />
        
        <div className={`absolute top-0 left-0 w-full h-[2px] shadow-[0_0_15px_rgba(56,189,248,0.5)] animate-scan-pulse z-10 transition-colors duration-1000 ${sanityColor === 'sky' ? 'bg-sky-400/20' : sanityColor === 'amber' ? 'bg-amber-400/20' : 'bg-rose-400/40'}`} 
             style={{ animationDuration: stats.sanity < 40 ? '5s' : '10s' }} />
      </div>

      <div className="fixed inset-0 pointer-events-none z-40 border-[8px] md:border-[15px] border-black/80 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
      <div className={`fixed inset-3 md:inset-5 pointer-events-none z-40 border rounded-sm transition-colors duration-1000 ${sanityColor === 'sky' ? 'border-sky-400/30' : sanityColor === 'amber' ? 'border-amber-400/30' : 'border-rose-400/40'}`}>
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]" />
      </div>

      {status === 'START' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10 animate-fade-in">
          <div className="mb-6 border-y border-sky-500/30 py-16 px-12 md:px-32 backdrop-blur-xl bg-black/40 relative group">
             <div className="text-sky-400 text-[10px] md:text-[12px] font-black tracking-[1.2em] mb-4 uppercase opacity-90 animate-pulse">Eunoia Junior College</div>
             <h1 className="text-5xl md:text-9xl font-black text-white tracking-tighter leading-none mb-2 drop-shadow-[0_0_50px_rgba(56,189,248,0.6)]">
               THRIVING IN<br/><span className="text-sky-400 italic font-thin tracking-[0.3em]">EUNOIA</span>
             </h1>
             <div className="text-white/60 text-[10px] md:text-sm font-black tracking-[0.8em] uppercase mt-6">The Eunoia Navigator</div>
          </div>
          <button className="group relative bg-black/80 border-2 border-sky-400 text-sky-400 text-lg md:text-2xl font-black px-20 py-5 rounded-none overflow-hidden transition-all hover:border-white hover:text-white shadow-[0_0_40px_rgba(56,189,248,0.3)]" onClick={() => {setStatus('CUSTOMIZATION'); audio.playDing(); audio.startBackgroundMusic();}}>
            <span className="relative z-10 tracking-[0.8em] uppercase">INITIATE</span>
          </button>
        </div>
      )}

      {status === 'CUSTOMIZATION' && (
        <div className="flex-1 flex items-center justify-center z-10 p-4 md:p-8 animate-fade-in overflow-y-auto">
          <div className="bg-black/90 border border-sky-500/30 backdrop-blur-3xl p-8 md:p-16 max-w-5xl w-full flex flex-col md:flex-row gap-16 relative shadow-2xl">
            <div className="w-full md:w-1/3 flex flex-col items-center gap-8">
              <CharacterPortrait char={character} className="w-56 h-72 md:w-72 md:h-96" />
              <input type="text" value={character.name} onChange={(e) => setCharacter({...character, name: e.target.value.toUpperCase()})}
                className="bg-black/50 border-b-2 border-sky-400 text-sky-400 text-center font-black tracking-[0.3em] outline-none py-3 w-full text-xl" placeholder="TRAVELER ID" />
            </div>
            <div className="flex-1 space-y-12">
              <div>
                <h3 className="text-white text-sm font-black uppercase tracking-[0.5em] mb-6 border-l-4 border-sky-400 pl-4">Neural Config: I Am Feeling...</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(['EXCITED', 'INSPIRED', 'HAPPY', 'DETERMINED'] as const).map(ot => (
                    <button key={ot} onClick={() => {setCharacter({...character, otterType: ot}); audio.playStatChange();}}
                      className={`py-6 flex flex-col items-center gap-2 text-xs font-black tracking-widest uppercase border-2 transition-all ${character.otterType === ot ? 'bg-sky-400 text-black border-sky-400 scale-105 shadow-[0_0_20px_rgba(56,189,248,0.3)]' : 'bg-slate-900/50 text-sky-400 border-sky-900 hover:border-sky-700'}`}>
                        <span>{ot}</span>
                        <div className={`w-8 h-[2px] bg-current opacity-30 ${character.otterType === ot ? 'animate-pulse' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-sky-900/20 border border-sky-500/20 p-6">
                <p className="text-sky-300 text-[10px] md:text-xs leading-relaxed font-mono uppercase tracking-wider">
                  Subject identified: Eunoian Otter. <br/>
                  Uniform synced: White Shirt, Navy Blue Tie, Grey Bottoms. <br/>
                  Emotional frequency: {character.otterType} <br/>
                  Deployment: Eunoia Performance Sim.
                </p>
              </div>
              <button className="w-full py-6 bg-sky-500 text-black font-black tracking-[1em] uppercase hover:bg-white transition-all shadow-[0_0_50px_rgba(56,189,248,0.4)] text-xl"
                onClick={() => {setStatus('PLAYING'); audio.playDing();}}>SYNC & COMMENCE</button>
            </div>
          </div>
        </div>
      )}

      {status === 'PLAYING' && (
        <>
          <div className="w-full flex flex-col md:flex-row gap-4 p-4 bg-black/95 border-b border-sky-400/30 z-20 backdrop-blur-3xl">
            <div className="flex items-center gap-6 bg-slate-900/60 p-3 border-r border-sky-400/30 min-w-[200px]">
               <CharacterPortrait char={character} className="w-14 h-16 border border-sky-500/50" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-sky-400 tracking-[0.2em] opacity-60 uppercase">Traveler ID</span>
                  <span className="text-base font-black text-white truncate uppercase tracking-widest">{character.name}</span>
               </div>
            </div>
            <div className="flex-1 grid grid-cols-5 gap-2 md:gap-4">
              <StatBar name="Academic Adventure" value={stats.grades} icon="⌬" color="bg-sky-500" />
              <StatBar name="Well-being" value={stats.sanity} icon="◈" color="bg-emerald-500" />
              <StatBar name="Leadership Journey" value={stats.leadership} icon="◬" color="bg-amber-500" />
              <StatBar name="CCA Impact" value={stats.skills} icon="⎔" color="bg-indigo-500" />
              <StatBar name="Community Service" value={stats.service} icon="⧉" color="bg-rose-500" />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 relative overflow-y-auto">
            <div className={`w-full max-w-[95%] xl:max-w-6xl transition-all duration-1000 ${feedback ? 'scale-95 opacity-20 blur-2xl' : 'scale-100 opacity-100'} ${isExiting ? 'animate-slide-out' : ''} ${isEntering ? 'animate-slide-in' : ''}`}>
               <div className="bg-black/90 border-2 border-sky-500/30 backdrop-blur-3xl p-6 md:p-12 lg:p-16 text-center relative shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-lg">
                 <div className="text-sky-500 text-[10px] font-black tracking-[0.8em] mb-6 uppercase opacity-60">Sequence Node {currentIdx + 1}</div>
                 <h2 className="text-2xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tighter uppercase text-white leading-none">{currentScenario.title}</h2>
                 <p className="text-base md:text-2xl lg:text-3xl font-extralight text-sky-100 leading-tight italic mb-10 max-w-4xl mx-auto font-serif">"{currentScenario.description}"</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
                   <button onClick={() => handleChoice(currentScenario.optionA)} className="group relative bg-slate-900/60 border-2 border-white/5 p-6 md:p-10 transition-all hover:border-sky-400 hover:bg-sky-400/10 text-left min-h-[140px] md:min-h-[180px] flex flex-col justify-center">
                     <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-3 opacity-50">Choice A</span>
                     <div className="text-lg md:text-2xl lg:text-3xl font-bold text-white group-hover:text-sky-300 leading-tight transition-colors">{currentScenario.optionA.text}</div>
                     <div className="mt-4 h-[1px] w-0 group-hover:w-full bg-sky-400 transition-all duration-700" />
                   </button>
                   <button onClick={() => handleChoice(currentScenario.optionB)} className="group relative bg-slate-900/60 border-2 border-white/5 p-6 md:p-10 transition-all hover:border-sky-400 hover:bg-sky-400/10 text-left min-h-[140px] md:min-h-[180px] flex flex-col justify-center">
                     <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-3 opacity-50">Choice B</span>
                     <div className="text-lg md:text-2xl lg:text-3xl font-bold text-white group-hover:text-sky-300 leading-tight transition-colors">{currentScenario.optionB.text}</div>
                     <div className="mt-4 h-[1px] w-0 group-hover:w-full bg-sky-400 transition-all duration-700" />
                   </button>
                 </div>
               </div>
            </div>
            {feedback && !isExiting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-30 animate-scale-up px-6 md:px-8 py-4 overflow-y-auto">
                <div className="bg-black/98 text-sky-50 p-8 md:p-16 lg:p-20 border-2 border-sky-400 shadow-[0_0_200px_rgba(56,189,248,0.2)] max-w-5xl w-full text-center backdrop-blur-3xl flex flex-col items-center">
                  <div className="text-sky-400 text-[10px] font-black tracking-[1em] mb-8 uppercase animate-pulse">Syncing Log</div>
                  <p className="text-xl md:text-3xl lg:text-4xl font-light leading-snug text-white font-serif italic mb-12">{feedback}</p>
                  
                  <div className="flex flex-col md:flex-row gap-4 lg:gap-6 w-full max-w-3xl">
                    <button 
                      onClick={handleBack}
                      className="flex-1 group relative bg-transparent border-2 border-sky-400/50 text-sky-400 px-8 py-4 lg:py-6 font-black tracking-[0.5em] uppercase transition-all hover:border-sky-400 hover:bg-sky-400/10 active:scale-95 shadow-sm"
                    >
                      <span className="relative z-10">Back</span>
                    </button>
                    
                    <button 
                      onClick={handleProceed}
                      className="flex-[2] group relative bg-sky-500 text-black px-8 py-4 lg:py-6 font-black tracking-[0.5em] uppercase transition-all hover:bg-white hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(56,189,248,0.3)]"
                    >
                      <span className="relative z-10">Proceed to Next Node</span>
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                      {/* Inner scanline decoration */}
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-white/40 animate-scan-pulse pointer-events-none" />
                    </button>
                  </div>
                  
                  <div className="w-24 h-[1px] bg-sky-400/40 mt-10 mx-auto" />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {status === 'GRADUATION' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 z-10 bg-black/98 overflow-y-auto animate-fade-in">
          <div className="max-w-4xl w-full text-center">
            {/* 1. The Otter Graphic */}
            <CharacterPortrait char={character} className="w-40 h-52 md:w-64 md:h-80 border-4 border-sky-500 mx-auto mb-10 shadow-[0_0_50px_rgba(56,189,248,0.4)]" />
            
            {/* 2. EU ARE THE OTTER OF YOUR JOURNEY */}
            <h1 className="text-4xl md:text-7xl font-black mb-6 text-white uppercase tracking-tighter leading-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              EU ARE THE OTTER<br/>OF YOUR JOURNEY
            </h1>
            
            {/* 3. WHAT IS NEXT FOR YOU? */}
            <h2 className="text-sky-400 text-2xl md:text-4xl font-black tracking-[0.3em] mb-12 uppercase opacity-90">
              WHAT IS NEXT FOR YOU?
            </h2>

            <button 
              onClick={() => {window.location.reload(); audio.playDing();}} 
              className="mt-8 border-2 border-sky-400/50 text-sky-400/70 text-sm md:text-lg font-black py-4 px-12 hover:bg-sky-400 hover:text-black hover:border-sky-400 transition-all uppercase tracking-[0.6em]"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sky-track { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
        @keyframes scan-pulse { from { transform: translateY(0vh); opacity: 0; } 50% { opacity: 0.8; } to { transform: translateY(100vh); opacity: 0; } }
        @keyframes grid-scroll { from { transform: translate(-50%, -50%) rotateX(60deg) translateY(0); } to { transform: translate(-50%, -50%) rotateX(60deg) translateY(80px); } }
        @keyframes hologram-pulse { 0%, 100% { opacity: 0.4; transform: scale(1.1); } 50% { opacity: 0.7; transform: scale(1.15); } }
        @keyframes scale-up { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fade-in { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes slide-out { 0% { transform: translateX(0) scale(1); opacity: 1; } 100% { transform: translateX(-100%) scale(0.9); opacity: 0; } }
        @keyframes slide-in { 0% { transform: translateX(100%) scale(0.9); opacity: 0; } 100% { transform: translateX(0) scale(1); opacity: 1; } }
        
        .animate-sky-track { animation: sky-track 4s linear infinite; }
        .animate-scan-pulse { animation: scan-pulse 10s linear infinite; }
        .animate-grid-scroll { animation: grid-scroll 3s linear infinite; }
        .animate-hologram-pulse { animation: hologram-pulse 15s ease-in-out infinite; }
        .animate-scale-up { animation: scale-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-out { animation: slide-out 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-in { animation: slide-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .perspective-[1000px] { perspective: 1000px; }
        .rotate-x-60 { transform: rotateX(60deg); }

        /* Hide scrollbars but keep functionality */
        .overflow-y-auto::-webkit-scrollbar {
          display: none;
        }
        .overflow-y-auto {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default App;
