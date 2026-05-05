import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Heart, Volume2, VolumeX,
  ListMusic, Sliders, X, Gauge, Timer,
  GripVertical, RotateCcw, Radio, Sparkles, Tag,
  MessageCircle, Download, Share2, Moon,
  Mic2, Info, Zap, Music2, Plus, Search,
  Check, Copy, Link, ExternalLink, Loader2
} from 'lucide-react';

import { FaWhatsapp, FaFacebookF } from "react-icons/fa";
import { SiX } from "react-icons/si"; // pour Twitter (X)
import { useMediaSession, useWakeLock, useAppBadge, useOfflineDetection, useAudioCache } from '../../hooks/usePWA';

const API = 'https://moozik-gft1.onrender.com';


// ════════════════════════════════════════════
// EQ CONFIG
// ════════════════════════════════════════════
export const EQ_BANDS_12 = [
  { hz: 32,    label: '32',   type: 'lowshelf'  },
  { hz: 64,    label: '64',   type: 'peaking'   },
  { hz: 125,   label: '125',  type: 'peaking'   },
  { hz: 250,   label: '250',  type: 'peaking'   },
  { hz: 500,   label: '500',  type: 'peaking'   },
  { hz: 1000,  label: '1k',   type: 'peaking'   },
  { hz: 2000,  label: '2k',   type: 'peaking'   },
  { hz: 3500,  label: '3.5k', type: 'peaking'   },
  { hz: 6000,  label: '6k',   type: 'peaking'   },
  { hz: 8000,  label: '8k',   type: 'peaking'   },
  { hz: 12000, label: '12k',  type: 'peaking'   },
  { hz: 16000, label: '16k',  type: 'highshelf' },
];

export const EQ_PRESETS_12 = {
  Flat:      [0,0,0,0,0,0,0,0,0,0,0,0],
  Bass:      [9,7,5,3,1,0,0,0,0,0,0,0],
  Treble:    [0,0,0,0,0,0,2,3,5,6,8,9],
  Vocal:     [-2,-1,0,2,5,6,5,3,1,0,-1,-2],
  Pop:       [-1,0,2,4,5,4,3,2,1,0,-1,-1],
  Rock:      [6,5,3,1,-1,0,1,3,5,6,6,5],
  Jazz:      [3,2,1,3,4,4,3,2,2,3,3,2],
  Club:      [0,0,5,5,4,3,3,4,5,5,0,0],
  Classical: [0,0,0,0,0,0,0,0,-2,-3,-4,-5],
  Dance:     [7,5,2,0,-1,-2,0,3,5,6,6,5],
  Latin:     [4,3,0,0,-1,-1,0,1,3,4,5,4],
  Lounge:    [-3,-2,0,2,3,2,1,0,-1,-2,-2,-3],
};

export const initEQ12 = (audioRef, eqFiltersRef, audioContextRef, onReady) => {
  if (audioContextRef.current || !audioRef.current) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const filters = EQ_BANDS_12.map(band => {
      const f = ctx.createBiquadFilter();
      f.type = band.type;
      f.frequency.value = band.hz;
      f.gain.value = 0;
      if (band.type === 'peaking') f.Q.value = 1.2;
      return f;
    });
    src.connect(filters[0]);
    filters.forEach((f, i) => { if (i < filters.length - 1) f.connect(filters[i + 1]); });
    filters[filters.length - 1].connect(analyser);
    analyser.connect(ctx.destination);
    eqFiltersRef.current = filters;
    audioContextRef.current = { ctx, analyser };
    onReady?.();
  } catch (e) { console.warn('AudioContext init failed:', e); }
};

// ════════════════════════════════════════════
// COLOR EXTRACTOR
// ════════════════════════════════════════════
const extractDominantColor = (imgSrc, callback) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 50;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 16) {
        const pr = data[i], pg = data[i+1], pb = data[i+2];
        const brightness = (pr + pg + pb) / 3;
        const saturation = Math.max(pr, pg, pb) - Math.min(pr, pg, pb);
        if (brightness > 20 && brightness < 230 && saturation > 30) {
          r += pr; g += pg; b += pb; count++;
        }
      }
      if (count > 0) callback({ r: Math.round(r/count), g: Math.round(g/count), b: Math.round(b/count) });
      else callback({ r: 180, g: 30, b: 30 });
    } catch { callback({ r: 180, g: 30, b: 30 }); }
  };
  img.onerror = () => callback({ r: 180, g: 30, b: 30 });
  img.src = imgSrc;
};

// ════════════════════════════════════════════
// STYLES GLOBAUX — animations fluides améliorées
// ════════════════════════════════════════════
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

  :root {
    --fp-accent: 220, 38, 38;
    --fp-accent2: 239, 68, 68;
    --fp-glow: rgba(220, 38, 38, 0.35);
    --fp-font: 'Outfit', sans-serif;
    --fp-mono: 'JetBrains Mono', monospace;
  }

  .fp-root * { box-sizing: border-box; }
  .fp-root { font-family: var(--fp-font); }

  @keyframes fp-spin        { to { transform: rotate(360deg); } }
  @keyframes fp-float       { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-10px) scale(1.025)} }
  @keyframes fp-fade-in     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fp-fade-slide  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fp-slide-up    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fp-scale-in    { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
  @keyframes fp-pulse       { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
  @keyframes fp-eq-dance    { 0%,100%{height:3px} 50%{height:100%} }
  @keyframes fp-wave-bounce { 0%,100%{transform:scaleY(.3)} 40%{transform:scaleY(1)} }
  @keyframes fp-ripple      { to{transform:scale(3);opacity:0} }
  @keyframes fp-heartbeat   { 0%,100%{transform:scale(1)} 20%{transform:scale(1.5)} 40%{transform:scale(1.2)} 60%{transform:scale(1.35)} }
  @keyframes fp-shimmer     { 0%{background-position:-400% 0} 100%{background-position:400% 0} }
  @keyframes fp-bg-breathe  { 0%,100%{opacity:.28} 50%{opacity:.42} }
  @keyframes fp-ring-expand { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(1.6);opacity:0} }
  @keyframes fp-modal-in    { from{opacity:0;transform:translateY(20px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes fp-toast-in    { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
  @keyframes fp-toast-out   { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(120%)} }

  /* Cover animation — more organic */
  .fp-playing .fp-cover-wrap { animation: fp-float 6s cubic-bezier(.45,0,.55,1) infinite; }
  .fp-cover-inner {
    position: relative; width: 100%; height: 100%;
    transition: transform .6s cubic-bezier(.34,1.56,.64,1), opacity .5s ease, box-shadow .5s ease;
  }
  .fp-playing .fp-cover-inner { transform: scale(1); opacity: 1; }
  .fp-paused .fp-cover-inner  { transform: scale(.88); opacity: .65; }

  /* Multi-layer glow */
  .fp-glow-layer-1 {
    position: absolute; inset: 8px; border-radius: 28px;
    filter: blur(55px) saturate(1.8);
    opacity: .7; transform: scale(.9) translateY(20px);
    transition: opacity .8s ease, transform .8s ease; pointer-events: none;
    animation: fp-bg-breathe 4s ease-in-out infinite;
  }
  .fp-glow-layer-2 {
    position: absolute; inset: 22px; border-radius: 24px;
    background: rgba(var(--fp-accent), .4);
    filter: blur(35px); transform: scale(.85) translateY(28px);
    opacity: .5; pointer-events: none; transition: all .8s ease;
  }
  .fp-playing .fp-glow-layer-1, .fp-playing .fp-glow-layer-2 { opacity: .85; }

  /* Progress */
  .fp-prog-track {
    position: relative; height: 4px; background: rgba(255,255,255,.1);
    border-radius: 99px; cursor: pointer; overflow: visible;
    transition: height .25s cubic-bezier(.34,1.56,.64,1);
  }
  .fp-prog-track:hover { height: 7px; }
  .fp-prog-fill {
    height: 100%; border-radius: 99px; position: relative;
    background: linear-gradient(90deg, rgba(var(--fp-accent),1), rgba(var(--fp-accent2),1));
    transition: width .09s linear;
    box-shadow: 0 0 12px rgba(var(--fp-accent), .5);
  }
  .fp-prog-thumb {
    position: absolute; right: -7px; top: 50%;
    transform: translateY(-50%) scale(0);
    width: 14px; height: 14px; border-radius: 50%;
    background: #fff; box-shadow: 0 0 16px var(--fp-glow);
    transition: transform .2s cubic-bezier(.34,1.56,.64,1); pointer-events: none;
  }
  .fp-prog-track:hover .fp-prog-thumb { transform: translateY(-50%) scale(1); }

  /* Volume */
  .fp-vol-track { flex: 1; height: 3px; background: rgba(255,255,255,.1); border-radius: 99px; position: relative; cursor: pointer; transition: height .2s; }
  .fp-vol-track:hover { height: 5px; }
  .fp-vol-fill  { height: 100%; border-radius: 99px; background: rgba(255,255,255,.5); pointer-events: none; transition: width .06s; }
  .fp-vol-input { position: absolute; inset: -12px 0; opacity: 0; cursor: pointer; width: 100%; height: calc(100% + 24px); }

  /* Play button — premium */
  .fp-play-btn {
    position: relative; border-radius: 50%; border: none; cursor: pointer;
    background: linear-gradient(135deg, rgba(var(--fp-accent2),1) 0%, rgba(var(--fp-accent),1) 100%);
    box-shadow: 0 8px 36px rgba(var(--fp-accent), .6), 0 2px 8px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.15);
    transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease;
    display: flex; align-items: center; justify-content: center;
  }
  .fp-play-btn:hover { transform: scale(1.08); box-shadow: 0 14px 44px rgba(var(--fp-accent), .75), 0 2px 8px rgba(0,0,0,.5); }
  .fp-play-btn:active { transform: scale(.93); transition-duration: .1s; }

  /* Expanding rings when playing */
  .fp-ring {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 1.5px solid rgba(var(--fp-accent), .5);
    opacity: 0; pointer-events: none;
  }
  .fp-playing .fp-ring-1 { animation: fp-ring-expand 2s ease-out infinite; }
  .fp-playing .fp-ring-2 { animation: fp-ring-expand 2s ease-out infinite .66s; }
  .fp-playing .fp-ring-3 { animation: fp-ring-expand 2s ease-out infinite 1.33s; }

  /* EQ */
  .fp-eq-wrap { position: relative; border-radius: 6px; overflow: hidden; background: rgba(255,255,255,.04); flex: 1; transition: background .2s; }
  .fp-eq-wrap:hover { background: rgba(255,255,255,.07); }
  .fp-eq-fill  { position: absolute; left: 0; right: 0; border-radius: 4px; transition: height .1s ease; }
  .fp-eq-zero  { position: absolute; left: 0; right: 0; height: 1px; background: rgba(255,255,255,.1); top: 50%; }
  .fp-eq-thumb {
    position: absolute; left: 50%; transform: translateX(-50%);
    width: 12px; height: 12px; border-radius: 50%;
    background: #fff; border: 2px solid rgba(255,255,255,.4);
    box-shadow: 0 2px 10px rgba(0,0,0,.6); pointer-events: none; z-index: 2;
    transition: top .12s cubic-bezier(.34,1.56,.64,1);
  }
  .fp-eq-input { position: absolute; inset: 0; opacity: 0; cursor: ns-resize; writing-mode: vertical-lr; direction: rtl; width: 100%; height: 100%; }

  /* Tabs */
  .fp-tab {
    flex: 1; padding: 14px 4px; font-family: var(--fp-font);
    font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: rgba(255,255,255,.28); transition: color .2s; border: none; background: none; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 5px; position: relative;
  }
  .fp-tab.on { color: rgba(255,255,255,.92); }
  .fp-tab.on::after {
    content: ''; position: absolute; bottom: 0; left: 20%; right: 20%;
    height: 2px; border-radius: 99px;
    background: linear-gradient(90deg, rgba(var(--fp-accent),1), rgba(var(--fp-accent2),1));
    box-shadow: 0 0 8px rgba(var(--fp-accent), .6);
  }

  /* Ctrl buttons */
  .fp-ctrl {
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; border: none; background: transparent;
    cursor: pointer; transition: transform .18s cubic-bezier(.34,1.56,.64,1), background .15s;
  }
  .fp-ctrl:hover  { background: rgba(255,255,255,.09); transform: scale(1.1); }
  .fp-ctrl:active { transform: scale(.85); }

  /* Skip buttons special */
  .fp-skip { transition: transform .15s cubic-bezier(.34,1.56,.64,1) !important; }
  .fp-skip:hover { transform: scale(1.12) !important; }
  .fp-skip:active { transform: scale(.88) !important; }

  /* Queue items */
  .fp-qi {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 14px;
    background: rgba(255,255,255,.03); border: 1px solid transparent;
    cursor: grab; transition: background .18s, border-color .18s, transform .15s;
  }
  .fp-qi:hover     { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.07); transform: translateX(3px); }
  .fp-qi.active    { background: rgba(var(--fp-accent),.12); border-color: rgba(var(--fp-accent),.3); }
  .fp-qi.drop-over { background: rgba(var(--fp-accent),.2); border-color: rgba(var(--fp-accent),.5); transform: scale(.98); }

  /* Preset pills */
  .fp-preset {
    padding: 5px 12px; border-radius: 99px; font-size: 10px; font-weight: 700;
    letter-spacing: .04em; border: 1px solid rgba(255,255,255,.09);
    background: rgba(255,255,255,.04); color: rgba(255,255,255,.35);
    cursor: pointer; transition: all .18s cubic-bezier(.34,1.56,.64,1); font-family: var(--fp-font);
  }
  .fp-preset:hover  { background: rgba(255,255,255,.1); color: rgba(255,255,255,.8); transform: scale(1.06); }
  .fp-preset.on     { background: rgba(var(--fp-accent),.22); border-color: rgba(var(--fp-accent),.5); color: #fff; box-shadow: 0 2px 14px rgba(var(--fp-accent),.4); transform: scale(1.04); }

  /* Action pills */
  .fp-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 99px; font-size: 11px; font-weight: 700;
    border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.5); cursor: pointer;
    transition: all .2s cubic-bezier(.34,1.56,.64,1);
    font-family: var(--fp-font);
  }
  .fp-pill:hover { background: rgba(255,255,255,.14); color: rgba(255,255,255,.9); border-color: rgba(255,255,255,.2); transform: scale(1.04) translateY(-1px); }
  .fp-pill:active { transform: scale(.96); }
  .fp-pill.liked { background: rgba(239,68,68,.18); border-color: rgba(239,68,68,.45); color: #fca5a5; }
  .fp-pill.sleep-on { background: rgba(59,130,246,.14); border-color: rgba(59,130,246,.38); color: #93c5fd; }
  .fp-pill.downloading { opacity: .6; pointer-events: none; }

  /* Mood tag */
  .fp-mood {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 99px;
    background: rgba(var(--fp-accent),.14); color: rgba(var(--fp-accent2),1);
    border: 1px solid rgba(var(--fp-accent),.25);
    transition: all .18s; cursor: default;
  }
  .fp-mood:hover { background: rgba(var(--fp-accent),.25); transform: scale(1.06); }

  /* Dancing bars — smoother */
  .fp-bar { width: 3px; border-radius: 2px; background: rgba(var(--fp-accent),1); transform-origin: bottom; }
  .fp-bar:nth-child(1) { animation: fp-eq-dance .65s cubic-bezier(.45,0,.55,1) infinite; }
  .fp-bar:nth-child(2) { animation: fp-eq-dance .65s cubic-bezier(.45,0,.55,1) infinite .13s; }
  .fp-bar:nth-child(3) { animation: fp-eq-dance .65s cubic-bezier(.45,0,.55,1) infinite .26s; }
  .fp-bar:nth-child(4) { animation: fp-eq-dance .65s cubic-bezier(.45,0,.55,1) infinite .08s; }

  /* Waveform */
  .fp-wave { width: 100%; height: 52px; cursor: pointer; border-radius: 10px; }

  /* Info card */
  .fp-ic { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 12px 15px; transition: background .18s; }
  .fp-ic:hover { background: rgba(255,255,255,.07); }
  .fp-ic-label { font-size: 9px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.2); margin-bottom: 3px; }
  .fp-ic-val   { font-size: 14px; font-weight: 700; color: rgba(255,255,255,.8); font-family: var(--fp-mono); }

  /* Section label */
  .fp-sec { font-size: 9px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; color: rgba(255,255,255,.22); display: flex; align-items: center; gap: 6px; }

  /* Scrollbar */
  .fp-scroll::-webkit-scrollbar { width: 3px; }
  .fp-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }

  /* Desktop right panel */
  .fp-right { display: none !important; }
  @media(min-width: 768px) { .fp-right { display: flex !important; } .fp-mobile-tabs { display: none !important; } }

  .fp-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 9px; font-weight: 800; letter-spacing: .08em;
    padding: 3px 8px; border-radius: 5px;
    background: rgba(var(--fp-accent),1); color: #fff;
  }

  /* Comment item */
  .fp-comment {
    display: flex; align-items: flex-start; gap: 10px; padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,.04);
    animation: fp-fade-slide .2s ease both;
    transition: background .15s;
  }
  .fp-comment:hover { background: rgba(255,255,255,.03); }
  .fp-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; background: rgba(var(--fp-accent),.25);
    color: rgba(var(--fp-accent2),1); border: 1px solid rgba(var(--fp-accent),.3);
  }
  .fp-ts-pill {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 5px;
    background: rgba(var(--fp-accent),.18); color: rgba(var(--fp-accent2),1);
    cursor: pointer; font-family: var(--fp-mono);
    transition: all .15s;
  }
  .fp-ts-pill:hover { background: rgba(var(--fp-accent),.32); transform: scale(1.05); }

  /* Ts markers on progress */
  .fp-ts-marker {
    position: absolute; top: 50%; transform: translate(-50%, -50%);
    border-radius: 50%; cursor: pointer; z-index: 5;
    transition: all .2s cubic-bezier(.34,1.56,.64,1);
  }
  .fp-ts-marker:hover { transform: translate(-50%, -50%) scale(1.5); box-shadow: 0 0 10px rgba(var(--fp-accent),.9); }

  .fp-eq-val { font-size: 8px; font-family: var(--fp-mono); color: rgba(255,255,255,.3); text-align: center; height: 13px; }
  .fp-eq-label { font-size: 8px; font-family: var(--fp-mono); color: rgba(255,255,255,.22); text-align: center; margin-top: 3px; }

  .fp-fade { animation: fp-fade-in .28s cubic-bezier(.4,0,.2,1) both; }
  .fp-slide { animation: fp-fade-slide .22s cubic-bezier(.4,0,.2,1) both; }
  .fp-scale { animation: fp-scale-in .24s cubic-bezier(.34,1.56,.64,1) both; }

  /* Share / Download modals */
  .fp-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.65);
    backdrop-filter: blur(12px); z-index: 300;
    display: flex; align-items: flex-end; justify-content: center;
    animation: fp-fade-in .2s ease both;
  }
  @media(min-width: 500px) { .fp-modal-overlay { align-items: center; } }
  .fp-modal-sheet {
    background: rgba(22,22,26,.95); border: 1px solid rgba(255,255,255,.1);
    border-radius: 28px 28px 0 0; width: 100%; max-width: 480px;
    padding: 8px 0 32px; animation: fp-modal-in .3s cubic-bezier(.34,1.56,.64,1) both;
    max-height: 80vh; overflow-y: auto;
  }
  @media(min-width: 500px) { .fp-modal-sheet { border-radius: 28px; } }

  /* Toast */
  .fp-toast {
    position: fixed; bottom: 90px; right: 16px; z-index: 400;
    display: flex; align-items: center; gap: 10px;
    background: rgba(20,20,24,.96); border: 1px solid rgba(255,255,255,.12);
    border-radius: 16px; padding: 12px 18px;
    font-family: var(--fp-font); font-size: 13px; font-weight: 600; color: #fff;
    box-shadow: 0 8px 32px rgba(0,0,0,.5);
    animation: fp-toast-in .3s cubic-bezier(.34,1.56,.64,1) both;
  }
  .fp-toast.out { animation: fp-toast-out .3s ease both; }

  /* Download progress */
  .fp-dl-prog {
    height: 3px; border-radius: 99px; background: rgba(255,255,255,.1);
    overflow: hidden; margin-top: 8px;
  }
  .fp-dl-prog-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, rgba(var(--fp-accent),1), rgba(var(--fp-accent2),1));
    transition: width .3s ease;
    box-shadow: 0 0 8px rgba(var(--fp-accent),.6);
  }

  /* Visualizer canvas bars */
  .fp-viz-canvas { display: block; }
`;

// ════════════════════════════════════════════
// TOAST COMPONENT
// ════════════════════════════════════════════
const Toast = ({ message, icon, onDone }) => {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setLeaving(true); setTimeout(onDone, 320); }, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`fp-toast${leaving ? ' out' : ''}`}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      {message}
    </div>
  );
};

// ════════════════════════════════════════════
// SHARE MODAL — liens sociaux + copie URL
// ════════════════════════════════════════════
const ShareModal = ({ song, onClose, onToast, token }) => {
  const [state, setState] = useState('idle');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    if (shareUrl) return;
    setState('loading');
    try {
      const data = await fetch(`${API}/songs/${song._id}/share`, { method: 'POST' }).then(r => r.json());
      const frontendUrl = window.location.origin;
      const shareToken = data.shareToken;
      setShareUrl(`${frontendUrl}/share/${shareToken}`);
      setState('idle');
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  useEffect(() => { generateLink(); }, []);

  const copyLink = async (e) => {
    e?.stopPropagation();
    const url = shareUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    onToast('Lien copié !', '✓');
    setTimeout(() => setCopied(false), 2500);
    onClose();
  };

  const shareNative = async () => {
    const url = shareUrl || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: song.titre, text: `Écoute "${song.titre}" par ${song.artiste}`, url });
        onToast('Partagé avec succès', '✓');
        onClose();
      } catch (e) { if (e.name !== 'AbortError') copyLink(); }
    } else { copyLink(); }
  };

  const openSocial = (platform) => {
    const url = encodeURIComponent(shareUrl || window.location.href);
    const text = encodeURIComponent(`🎵 Écoute "${song.titre}" par ${song.artiste}`);
    const links = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };
    if (links[platform]) window.open(links[platform], '_blank', 'width=600,height=400');
    onClose();
  };

  return (
    <div className="fp-modal-overlay" onClick={onClose}>
      <div className="fp-modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,.15)', margin: '0 auto 20px' }} />

        {/* Song preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <img src={song.image} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.titre}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', margin: 0 }}>{song.artiste}</p>
          </div>
          <Share2 size={18} style={{ color: 'rgba(255,255,255,.25)', flexShrink: 0 }} />
        </div>

        {/* Share URL */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <p className="fp-sec" style={{ marginBottom: 10 }}><Link size={10}/> Lien de partage</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 14px', fontSize: 11, color: 'rgba(255,255,255,.45)', fontFamily: 'var(--fp-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {state === 'loading' ? 'Génération du lien…' : state === 'error' ? 'Erreur de génération' : (shareUrl || 'Chargement…')}
            </div>
            <button onClick={copyLink} style={{ padding: '10px 16px', borderRadius: 12, background: copied ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.1)', border: `1px solid ${copied ? 'rgba(34,197,94,.4)' : 'rgba(255,255,255,.15)'}`, color: copied ? '#4ade80' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s', fontFamily: 'var(--fp-font)', flexShrink: 0 }}>
              {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>

        {/* Social buttons */}
        <div style={{ padding: '16px 20px 8px' }}>
          <p className="fp-sec" style={{ marginBottom: 12 }}><ExternalLink size={10}/> Partager sur</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
            {[
              { key: 'whatsapp', label: 'WhatsApp', bg: 'rgba(37,211,102,.15)', border: 'rgba(37,211,102,.3)', color: '#4ade80', icon: <FaWhatsapp /> },
              { key: 'twitter',  label: 'Twitter',  bg: 'rgba(29,155,240,.15)', border: 'rgba(29,155,240,.3)', color: '#60a5fa', icon: <SiX /> },
              { key: 'facebook', label: 'Facebook', bg: 'rgba(24,119,242,.15)', border: 'rgba(24,119,242,.3)', color: '#818cf8', icon: <FaFacebookF /> },
            ].map(({ key, label, bg, border, color, icon }) => (
              <button key={key} onClick={() => openSocial(key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '14px 8px', borderRadius: 16, background: bg, border: `1px solid ${border}`, color, cursor: 'pointer', fontFamily: 'var(--fp-font)', fontSize: 12, fontWeight: 700, transition: 'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
          <button onClick={shareNative} style={{ width: '100%', padding: '13px', borderRadius: 16, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontFamily: 'var(--fp-font)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}>
            <Share2 size={16}/> Partager via l'appareil
          </button>
        </div>
      </div>
    </div>
  );
};


// ════════════════════════════════════════════
// EQ BAR — with smoother transitions
// ════════════════════════════════════════════
const EQBar = React.memo(({ band, idx, value, onChange, accent }) => {
  const v = Math.max(-12, Math.min(12, isNaN(value) ? 0 : value));
  const thumbPct = 50 - (v / 12) * 47;
  const fillH = `${(Math.abs(v) / 12) * 47}%`;
  const color = accent || '#e02222';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flex:1, minWidth:0 }}>
      <div className="fp-eq-val" style={{ color: v !== 0 ? color : 'rgba(255,255,255,.2)' }}>
        {v !== 0 ? (v > 0 ? `+${v}` : String(v)) : '·'}
      </div>
      <div className="fp-eq-wrap" style={{ width:'100%', minHeight:92 }}>
        <div className="fp-eq-zero"/>
        {v > 0 && <div className="fp-eq-fill" style={{ background:`linear-gradient(to top,${color}dd,${color}33)`, bottom:'50%', height:fillH, boxShadow:`0 0 12px ${color}40` }}/>}
        {v < 0 && <div className="fp-eq-fill" style={{ background:`linear-gradient(to bottom,${color}77,${color}11)`, top:'50%', height:fillH }}/>}
        <div className="fp-eq-thumb" style={{ top:`${thumbPct}%`, borderColor:`${color}55`, boxShadow:`0 0 8px ${color}44, 0 2px 8px rgba(0,0,0,.5)` }}/>
        <input type="range" min="-12" max="12" step="1" value={v} onChange={e => onChange(idx, parseInt(e.target.value,10))} className="fp-eq-input"/>
      </div>
      <div className="fp-eq-label">{band.label}</div>
    </div>
  );
});

// ════════════════════════════════════════════
// EQ PANEL
// ════════════════════════════════════════════
const EQPanel = React.memo(({ safeEqGains, activePreset, applyPreset, smartMode, setSmartMode, smartQueueCount, currentMoods, playbackRate, setPlaybackRate, sleepTimer, setSleepTimer, sleepRemaining, handleEqBand, accentColor }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:20, padding:'16px 18px 28px' }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div className="fp-sec"><Sliders size={11} color={accentColor}/> Égaliseur 12 bandes</div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={()=>setSmartMode?.(v=>!v)} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:10, fontSize:10, fontWeight:700, border:'1px solid rgba(255,255,255,.07)', background: smartMode ? `rgba(255,255,255,.08)` : 'rgba(255,255,255,.04)', color: smartMode ? accentColor : 'rgba(255,255,255,.35)', cursor:'pointer', fontFamily:'var(--fp-font)', transition:'all .2s' }}>
          <Sparkles size={9}/> Smart{smartMode && smartQueueCount > 0 ? ` (${smartQueueCount})` : ''}
        </button>
        <button onClick={()=>applyPreset('Flat')} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:10, fontSize:10, fontWeight:700, border:'1px solid rgba(255,255,255,.07)', background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.35)', cursor:'pointer', fontFamily:'var(--fp-font)', transition:'all .2s' }}>
          <RotateCcw size={9}/> Reset
        </button>
      </div>
    </div>

    <div>
      <div className="fp-sec" style={{ marginBottom:8 }}><Zap size={10} color={accentColor}/> Presets</div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {Object.keys(EQ_PRESETS_12).map((name,i) => (
          <button key={name} onClick={()=>applyPreset(name)} className={`fp-preset${activePreset===name?' on':''}`} style={{ animationDelay:`${i*0.04}s` }}>{name}</button>
        ))}
      </div>
    </div>

    <div>
      <div className="fp-sec" style={{ marginBottom:10 }}><Music2 size={10} color={accentColor}/> Fréquences</div>
      <div style={{ display:'flex', gap:3, height:130 }}>
        {EQ_BANDS_12.map((band, idx) => (
          <EQBar key={band.hz} band={band} idx={idx} value={safeEqGains[idx]??0} onChange={handleEqBand} accent={accentColor}/>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, fontFamily:'var(--fp-mono)', color:'rgba(255,255,255,.15)', marginTop:4, padding:'0 2px' }}>
        <span>+12 dB</span><span>0</span><span>−12 dB</span>
      </div>
    </div>

    <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div className="fp-sec"><Gauge size={10} color="#4dc9f6"/> Vitesse</div>
        <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.55)', fontFamily:'var(--fp-mono)' }}>{playbackRate}×</span>
      </div>
      <div style={{ position:'relative' }}>
        <div style={{ height:4, background:'rgba(255,255,255,.07)', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${((playbackRate-.5)/1.5)*100}%`, background:'linear-gradient(90deg,#4dc9f6,#4d79f6)', borderRadius:99, transition:'width .2s ease', boxShadow:'0 0 8px rgba(77,201,246,.4)' }}/>
        </div>
        <input type="range" min=".5" max="2" step=".25" value={playbackRate} onChange={e=>setPlaybackRate(parseFloat(e.target.value))} style={{ position:'absolute', inset:'-9px 0', opacity:0, cursor:'pointer', width:'100%' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:9, color:'rgba(255,255,255,.15)', fontFamily:'var(--fp-mono)' }}>
        {['0.5×','0.75×','1×','1.25×','1.5×','1.75×','2×'].map(v=><span key={v}>{v}</span>)}
      </div>
    </div>

    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div className="fp-sec"><Timer size={10} color="#ffd93d"/> Minuterie veille</div>
        {sleepRemaining > 0 && <span style={{ fontSize:13, fontWeight:700, color:'#4ade80', fontFamily:'var(--fp-mono)' }}>{Math.floor(sleepRemaining/60)}:{String(sleepRemaining%60).padStart(2,'0')}</span>}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
        {[0,15,30,45,60].map(m=>(
          <button key={m} onClick={()=>setSleepTimer(m)} style={{ padding:'10px 0', borderRadius:12, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'var(--fp-font)', border:sleepTimer===m?'1px solid rgba(var(--fp-accent),.55)':'1px solid rgba(255,255,255,.07)', background:sleepTimer===m?'rgba(var(--fp-accent),.22)':'rgba(255,255,255,.04)', color:sleepTimer===m?accentColor:'rgba(255,255,255,.3)', transition:'all .2s cubic-bezier(.34,1.56,.64,1)' }}>
            {m===0?'Off':`${m}'`}
          </button>
        ))}
      </div>
    </div>
  </div>
));

// ════════════════════════════════════════════
// QUEUE PANEL
// ════════════════════════════════════════════
const QueuePanel = React.memo(({ queue, setQueue, currentSong, setCurrentSong, setIsPlaying, dragOver, onDragStart, onDragOver, onDrop, accentColor }) => (
  <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <ListMusic size={13} color={accentColor}/>
        <span className="fp-sec">File d'attente</span>
        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.4)' }}>{queue.length}</span>
      </div>
      {queue.length > 0 && (
        <button onClick={()=>setQueue([])} style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.22)', border:'none', background:'none', cursor:'pointer', padding:'4px 8px', borderRadius:8, transition:'color .15s', fontFamily:'var(--fp-font)' }}
          onMouseEnter={e=>e.currentTarget.style.color='#f87171'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.22)'}>
          Vider
        </button>
      )}
    </div>
    <div className="fp-scroll" style={{ flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:4, overscrollBehavior:'contain' }}>
      {queue.length===0 ? (
        <div style={{ textAlign:'center', padding:'52px 16px', color:'rgba(255,255,255,.12)' }}>
          <ListMusic size={40} style={{ margin:'0 auto 12px', display:'block', opacity:.15 }}/>
          <p style={{ fontSize:14, margin:0, fontWeight:600 }}>File vide</p>
          <p style={{ fontSize:11, margin:'4px 0 0', opacity:.5 }}>Les titres à venir apparaîtront ici</p>
        </div>
      ) : queue.map((s,i)=>(
        <div key={`${s._id}-${i}`} draggable onDragStart={()=>onDragStart(i)} onDragOver={e=>onDragOver(e,i)} onDrop={()=>onDrop(i)}
          onClick={()=>{ setQueue(prev=>prev.filter((_,j)=>j!==i)); setCurrentSong(s); setIsPlaying(true); }}
          className={`fp-qi${dragOver===i?' drop-over':''}`}
          style={{ animationDelay:`${i*0.03}s` }}>
          <GripVertical size={12} style={{ color:'rgba(255,255,255,.12)', flexShrink:0 }}/>
          <div style={{ position:'relative', width:36, height:36, flexShrink:0 }}>
            <img src={s.image} style={{ width:36, height:36, borderRadius:9, objectFit:'cover', display:'block' }} alt=""/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.82)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:'0 0 2px' }}>{s.titre}</p>
            <p style={{ fontSize:10, color:'rgba(255,255,255,.3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0 }}>{s.artiste}</p>
          </div>
          <button onClick={e=>{ e.stopPropagation(); setQueue(prev=>prev.filter((_,j)=>j!==i)); }}
            style={{ padding:5, borderRadius:8, border:'none', background:'transparent', color:'rgba(255,255,255,.18)', cursor:'pointer', flexShrink:0, transition:'all .15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(239,68,68,.12)'; e.currentTarget.style.color='#f87171'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,.18)'; }}>
            <X size={12}/>
          </button>
        </div>
      ))}
    </div>
  </div>
));

// ════════════════════════════════════════════
// INFOS PANEL — with better waveform
// ════════════════════════════════════════════
const InfosPanel = React.memo(({ currentSong, currentTime, duration, audioRef, accentColor }) => {
  const waveRef = useRef(null);
  const [waveData] = useState(() => Array.from({ length:80 }, (_,i) => .15 + Math.abs(Math.sin(i*.28+.7))*0.6*(.5+Math.random()*.5)));
  const animRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width; const H = canvas.height;
    ctx.clearRect(0,0,W,H);
    const bw = W / waveData.length;
    const p = duration > 0 ? currentTime/duration : 0;
    const parsed = accentColor.replace('#','').match(/.{2}/g)?.map(h=>parseInt(h,16)) || [220,38,38];
    const playedX = p * W;

    // Draw shadow for played section
    if (p > 0) {
      const grad = ctx.createLinearGradient(0,0,playedX,0);
      grad.addColorStop(0, `rgba(${parsed[0]},${parsed[1]},${parsed[2]},0)`);
      grad.addColorStop(1, `rgba(${parsed[0]},${parsed[1]},${parsed[2]},.08)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, playedX, H);
    }

    waveData.forEach((v,i) => {
      const x = i*bw, h = v*H*.82;
      const played = i/waveData.length < p;
      const alpha = played ? (.55+v*.45) : (.06+v*.07);
      if (played) {
        const g = ctx.createLinearGradient(0,(H-h)/2,0,(H+h)/2);
        g.addColorStop(0, `rgba(${parsed[0]},${parsed[1]},${parsed[2]},${alpha})`);
        g.addColorStop(1, `rgba(${parsed[0]},${parsed[1]},${parsed[2]},${alpha*.4})`);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      }
      ctx.beginPath();
      ctx.roundRect(x+1,(H-h)/2,Math.max(2,bw-2),h,2);
      ctx.fill();
    });

    // Playhead line
    if (p > 0) {
      ctx.strokeStyle = `rgba(${parsed[0]},${parsed[1]},${parsed[2]},0.8)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(playedX, 0);
      ctx.lineTo(playedX, H);
      ctx.stroke();
    }
  }, [currentTime, duration, waveData, accentColor]);

  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    draw();
  }, [draw]);

  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef?.current) audioRef.current.currentTime = ((e.clientX-r.left)/r.width)*duration;
  };

  const tags = [
    { label:'Format', value: currentSong?.format||'MP3' },
    { label:'Débit',  value: currentSong?.bitrate||'320 kbps' },
    { label:'Freq.',  value: currentSong?.sampleRate||'44.1 kHz' },
    { label:'Plays',  value: currentSong?.plays ? currentSong.plays.toLocaleString() : '—' },
    { label:'Sortie', value: currentSong?.annee||'—' },
    { label:'Label',  value: currentSong?.label||'—' },
  ];

  return (
    <div style={{ padding:'16px 18px 28px', display:'flex', flexDirection:'column', gap:16 }}>
      <div className="fp-sec"><Info size={10} color={accentColor}/> Informations audio</div>
      <div className="fp-ic" style={{ cursor: 'pointer' }} onClick={seek}>
        <div className="fp-ic-label">Forme d'onde · cliquer pour déplacer</div>
        <canvas ref={waveRef} className="fp-wave" style={{ marginTop:8, height:56 }}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {tags.map((t,i)=>(
          <div key={t.label} className="fp-ic fp-fade" style={{ animationDelay:`${i*0.05}s` }}>
            <div className="fp-ic-label">{t.label}</div>
            <div className="fp-ic-val" style={{ fontSize:12 }}>{t.value}</div>
          </div>
        ))}
      </div>
      {currentSong?.moods?.length > 0 && (
        <div className="fp-ic">
          <div className="fp-ic-label" style={{ marginBottom:8 }}>Moods</div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {currentSong.moods.map(m=><span key={m} className="fp-mood"><Tag size={8}/>{m}</span>)}
          </div>
        </div>
      )}
    </div>
  );
});

// ════════════════════════════════════════════
// COMMENTS PANEL
// ════════════════════════════════════════════
const CommentsPanel = React.memo(({ songId, currentTime, duration, onSeek, token, isLoggedIn, userId, isAdmin, userNom, onMarkersReady, accentColor}) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!songId) return;
    setLoading(true);
    fetch(`${API}/songs/${songId}/comments`)
      .then(r => r.json())
      .then(d => { setComments(Array.isArray(d) ? d : []); onMarkersReady?.(Array.isArray(d) ? d : []); })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [songId]);

  const post = async () => {
    if (!text.trim() || !token) return;
    try {
      const r = await fetch(`${API}/songs/${songId}/comments`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ text: text.trim(), timestamp: Math.floor(currentTime) }),
      });
      if (r.ok) { const c = await r.json(); setComments(p=>[c,...p]); setText(''); }
    } catch {}
  };

  const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {isLoggedIn && (
        <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&post()}
              placeholder={`Commenter à ${fmt(currentTime)}…`}
              style={{ flex:1, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, padding:'9px 13px', fontSize:12, color:'rgba(255,255,255,.85)', outline:'none', fontFamily:'var(--fp-font)', transition:'border-color .2s' }}
              onFocus={e=>e.target.style.borderColor='rgba(var(--fp-accent),.5)'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
            />
            <button onClick={post} style={{ width:36, height:36, borderRadius:10, background:`rgba(var(--fp-accent),1)`, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.12)';e.currentTarget.style.boxShadow='0 4px 16px rgba(var(--fp-accent),.6)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='none';}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
      <div className="fp-scroll" style={{ flex:1, overflowY:'auto', overscrollBehavior:'contain' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.18)', fontSize:12 }}>Chargement…</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign:'center', padding:'52px 16px', color:'rgba(255,255,255,.12)' }}>
            <MessageCircle size={40} style={{ margin:'0 auto 12px', display:'block', opacity:.15 }}/>
            <p style={{ fontSize:14, margin:0, fontWeight:600 }}>Aucun commentaire</p>
            <p style={{ fontSize:11, margin:'4px 0 0', opacity:.5 }}>Soyez le premier à commenter</p>
          </div>
        ) : comments.map(c => (
          <div key={c._id} className="fp-comment">
            <div className="fp-avatar">{(c.userNom||'?').slice(0,2).toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.75)' }}>{c.userNom||'Anonyme'}</span>
                {c.timestamp != null && (
                  <button className="fp-ts-pill" onClick={()=>onSeek?.(c.timestamp)}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    {fmt(c.timestamp)}
                  </button>
                )}
                <span style={{ fontSize:10, color:'rgba(255,255,255,.18)', marginLeft:'auto' }}>{c.createdAt ? new Date(c.createdAt).toLocaleString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : ''}</span>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.55)', margin:0, lineHeight:1.5 }}>{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════
const FullPlayerPage = ({
  currentSong, isPlaying, setIsPlaying,
  currentTime, duration,
  handleNext, handlePrev,
  isShuffle, setIsShuffle,
  repeatMode, setRepeatMode,
  toggleLike,
  volume, setVolume,
  queue, setQueue, musiques,
  audioRef, initAudioEngine, audioContextRef,
  eqGains, setEqGains, eqFiltersRef,
  playbackRate, setPlaybackRate,
  sleepTimer, setSleepTimer, sleepRemaining,
  formatTime, onClose, canvasRef,
  token, isLoggedIn, userId, isAdmin,
  onOpenListenParty,
  smartMode, setSmartMode,
}) => {
  const [activeTab, setActiveTab] = useState('player');
  const [activePreset, setActivePreset] = useState('Flat');
  const [tsComments, setTsComments] = useState([]);
  const [heartAnim, setHeartAnim] = useState(false);
  const [accentRGB, setAccentRGB] = useState({ r:220, g:38, b:38 });
  const [showShare, setShowShare] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [toast, setToast] = useState(null);
  const dragIdx = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const prevImgRef = useRef('');
  const rootRef = useRef(null);

  const prog = duration > 0 ? (currentTime/duration)*100 : 0;
  const role = typeof localStorage !== 'undefined' ? localStorage.getItem('moozik_role') : null;
  const isAdminLocal = isAdmin || role === 'admin';
  const userNom = typeof localStorage !== 'undefined' ? localStorage.getItem('moozik_nom') || '' : '';

  const accentHex = useMemo(() => {
    const { r,g,b } = accentRGB;
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }, [accentRGB]);

  const accentCSS = `${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}`;
  const { cacheAudio, removeCached, isAudioCached } = useAudioCache();

  // Extract color from cover
  useEffect(() => {
    if (!currentSong?.image || currentSong.image === prevImgRef.current) return;
    prevImgRef.current = currentSong.image;
    extractDominantColor(currentSong.image, col => setAccentRGB(col));
  }, [currentSong?.image]);

  // Inject styles
  useEffect(() => {
    if (!document.getElementById('fp-styles')) {
      const el = document.createElement('style');
      el.id = 'fp-styles'; el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // Update CSS vars
  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.style.setProperty('--fp-accent', accentCSS);
    const r2 = Math.min(255, accentRGB.r+30), g2 = Math.min(255, accentRGB.g+30), b2 = Math.min(255, accentRGB.b+30);
    rootRef.current.style.setProperty('--fp-accent2', `${r2}, ${g2}, ${b2}`);
    rootRef.current.style.setProperty('--fp-glow', `rgba(${accentCSS}, 0.4)`);
  }, [accentCSS]);

  const safeEqGains = useMemo(() => eqGains?.length===12 ? eqGains : Array(12).fill(0), [eqGains]);
  const currentMoods = currentSong?.moods || [];
  const smartQueueCount = useMemo(() => {
    if (!smartMode||!musiques?.length||!currentMoods.length) return 0;
    return musiques.filter(s=>s._id!==currentSong?._id&&s.moods?.some(m=>currentMoods.includes(m))).length;
  }, [smartMode, musiques, currentSong, currentMoods]);

  // Analytics
  const sentBuckets = useRef(new Set());
  useEffect(() => {
    if (!currentSong||!duration) return;
    const bucket = Math.floor((currentTime/duration)*20);
    if (bucket>=0&&bucket<20&&!sentBuckets.current.has(bucket)) {
      sentBuckets.current.add(bucket);
      fetch(`${API}/songs/${currentSong._id}/retention`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ bucket, totalTime:Math.round(currentTime), completed:currentTime/duration>.9, deviceId:typeof localStorage!=='undefined'?localStorage.getItem('moozik_device_id')||'':'' }) }).catch(()=>{});
    }
  }, [Math.floor(currentTime/5)]);
  useEffect(() => { sentBuckets.current.clear(); }, [currentSong?._id]);

  // Auto-queue
  useEffect(() => {
    if (!musiques?.length||!currentSong||queue.length>0) return;
    const idx = musiques.findIndex(s=>s._id===currentSong._id);
    if (idx!==-1) setQueue([...musiques.slice(idx+1),...musiques.slice(0,idx)]);
  }, [currentSong?._id]);

  const handleEqBand = useCallback((idx, value) => {
    setEqGains(prev=>{ const n=prev?.length===12?[...prev]:Array(12).fill(0); n[idx]=value; return n; });
    if (eqFiltersRef.current[idx]) eqFiltersRef.current[idx].gain.value=value;
    setActivePreset('');
  }, [setEqGains, eqFiltersRef]);

  const applyPreset = useCallback((name) => {
    const gains=EQ_PRESETS_12[name]||Array(12).fill(0);
    setEqGains([...gains]); setActivePreset(name);
    gains.forEach((v,i)=>{ if(eqFiltersRef.current[i]) eqFiltersRef.current[i].gain.value=v; });
  }, [setEqGains, eqFiltersRef]);

  const seek = useCallback((e) => {
    const r=e.currentTarget.getBoundingClientRect();
    if(audioRef.current) audioRef.current.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*duration;
  }, [audioRef, duration]);

  const seekTouch = useCallback((e) => {
    e.preventDefault();
    const r=e.currentTarget.getBoundingClientRect();
    if(audioRef.current) audioRef.current.currentTime=Math.max(0,Math.min(1,(e.touches[0].clientX-r.left)/r.width))*duration;
  }, [audioRef, duration]);

  const seekToTimestamp = useCallback((ts) => {
    if(audioRef.current){ audioRef.current.currentTime=ts; if(!isPlaying) setIsPlaying(true); }
    setActiveTab('player');
  }, [audioRef, isPlaying, setIsPlaying]);

  const handleLike = useCallback(() => {
    setHeartAnim(true); toggleLike(currentSong?._id);
    setTimeout(()=>setHeartAnim(false),550);
  }, [toggleLike, currentSong]);

  const showToast = useCallback((message, icon) => {
    setToast({ message, icon, key: Date.now() });
  }, []);

  const onDragStart = useCallback((i)=>{ dragIdx.current=i; },[]);
  const onDragOver  = useCallback((e,i)=>{ e.preventDefault(); setDragOver(i); },[]);
  const onDrop      = useCallback((i)=>{
    if(dragIdx.current===null||dragIdx.current===i){ setDragOver(null); return; }
    setQueue(prev=>{ const a=[...prev]; const [m]=a.splice(dragIdx.current,1); a.splice(i,0,m); return a; });
    dragIdx.current=null; setDragOver(null);
  },[setQueue]);

  const eqProps = useMemo(()=>({ safeEqGains, activePreset, applyPreset, smartMode, setSmartMode, smartQueueCount, currentMoods, playbackRate, setPlaybackRate, sleepTimer, setSleepTimer, sleepRemaining, handleEqBand, accentColor:accentHex }),[safeEqGains,activePreset,applyPreset,smartMode,setSmartMode,smartQueueCount,currentMoods,playbackRate,setPlaybackRate,sleepTimer,setSleepTimer,sleepRemaining,handleEqBand,accentHex]);
  const queueProps = useMemo(()=>({ queue, setQueue, currentSong, setCurrentSong:()=>{}, setIsPlaying, dragOver, onDragStart, onDragOver, onDrop, accentColor:accentHex }),[queue,setQueue,currentSong,setIsPlaying,dragOver,onDragStart,onDragOver,onDrop,accentHex]);

  const TABS_MOBILE = [
    { key:'player',   icon:<Play size={13}/>,         label:'Lecture' },
    { key:'eq',       icon:<Sliders size={13}/>,      label:'EQ' },
    { key:'queue',    icon:<ListMusic size={13}/>,    label:`File${queue.length>0?` (${queue.length})`:''}` },
    { key:'comments', icon:<MessageCircle size={13}/>,label:`Comms${tsComments.length>0?` (${tsComments.length})`:''}` },
    { key:'infos',    icon:<Info size={13}/>,         label:'Infos' },
  ];

  const TABS_DESKTOP = [
    { key:'eq',       icon:<Sliders size={12}/>,      label:'Égaliseur' },
    { key:'queue',    icon:<ListMusic size={12}/>,    label:`File (${queue.length})` },
    { key:'comments', icon:<MessageCircle size={12}/>,label:`Comms${tsComments.length>0?` (${tsComments.length})`:''}` },
    { key:'infos',    icon:<Info size={12}/>,         label:'Infos' },
  ];

  // ──────────────── PLAYER VIEW ────────────────
  const renderPlayer = () => (
    <div className={`fp-fade ${isPlaying ? 'fp-playing' : 'fp-paused'}`} style={{ display:'flex', flexDirection:'column', flex:1 }}>

      {/* COVER */}
      <div style={{ display:'flex', justifyContent:'center', padding:'12px 36px 14px', flexShrink:0 }}>
        <div style={{ position:'relative', width:'100%', maxWidth:248 }}>
          {/* Multi-layer glow */}
          {currentSong?.image && (<>
            <div className="fp-glow-layer-1" style={{ backgroundImage:`url(${currentSong.image})`, backgroundSize:'cover', backgroundPosition:'center' }}/>
            <div className="fp-glow-layer-2"/>
          </>)}
          <div className="fp-cover-wrap" style={{ position:'relative', aspectRatio:'1/1' }}>
            <div className="fp-cover-inner">
              <img
                src={currentSong?.image} alt={currentSong?.titre}
                style={{
                  width:'100%', height:'100%', borderRadius:24,
                  objectFit:'cover', display:'block',
                  boxShadow:`0 28px 72px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.08)`,
                }}
              />
              {/* Format badge */}
              {currentSong?.format && (
                <div className="fp-badge" style={{ position:'absolute', bottom:10, left:10 }}>{currentSong.format}</div>
              )}
              {/* Playing ring animation */}
              {isPlaying && (<>
                <div className="fp-ring fp-ring-1"/>
                <div className="fp-ring fp-ring-2"/>
                <div className="fp-ring fp-ring-3"/>
              </>)}
            </div>
          </div>
        </div>
      </div>

      {/* TITLE + META */}
      <div style={{ padding:'0 20px 10px', flexShrink:0 }}>
        {/* Stats */}
        {(currentSong?.plays || duration > 0) && (
          <div style={{ display:'flex', gap:18, marginBottom:10 }}>
            {currentSong?.plays > 0 && (
              <div>
                <div style={{ fontSize:16, fontWeight:900, color:`rgba(${accentCSS},1)`, fontFamily:'var(--fp-mono)', lineHeight:1 }}>{currentSong.plays >= 1000 ? `${(currentSong.plays/1000).toFixed(1)}K` : currentSong.plays}</div>
                <div style={{ fontSize:8, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.22)', marginTop:2 }}>Écoutes</div>
              </div>
            )}
            {duration > 0 && (
              <div>
                <div style={{ fontSize:16, fontWeight:900, color:`rgba(${accentCSS},.7)`, fontFamily:'var(--fp-mono)', lineHeight:1 }}>{formatTime(duration)}</div>
                <div style={{ fontSize:8, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.22)', marginTop:2 }}>Durée</div>
              </div>
            )}
            {currentSong?.annee && (
              <div>
                <div style={{ fontSize:16, fontWeight:900, color:`rgba(${accentCSS},.5)`, fontFamily:'var(--fp-mono)', lineHeight:1 }}>{currentSong.annee}</div>
                <div style={{ fontSize:8, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.22)', marginTop:2 }}>Année</div>
              </div>
            )}
          </div>
        )}

        <div style={{ display:'flex', alignItems:'flex-start' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <h2 style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-.03em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:'0 0 4px', lineHeight:1.1 }}>
              {currentSong?.titre}
            </h2>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:14, color:`rgba(${accentCSS},1)`, fontWeight:700 }}>{currentSong?.artiste}</span>
              {currentSong?.album && <span style={{ fontSize:11, color:'rgba(255,255,255,.25)' }}>· {currentSong.album}</span>}
            </div>
            {currentSong?.moods?.length > 0 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {currentSong.moods.map(m=><span key={m} className="fp-mood"><Tag size={7}/>{m}</span>)}
              </div>
            )}
          </div>
          {/* Like button with animation */}
          <button onClick={handleLike} style={{
            marginLeft:12, padding:10, borderRadius:'50%', border:'none',
            background: currentSong?.liked ? 'rgba(239,68,68,.15)' : 'rgba(255,255,255,.06)',
            cursor:'pointer', flexShrink:0,
            animation: heartAnim ? 'fp-heartbeat .5s cubic-bezier(.34,1.56,.64,1)' : 'none',
            transition: 'background .25s',
            boxShadow: currentSong?.liked ? '0 0 16px rgba(239,68,68,.3)' : 'none',
          }}>
            <Heart size={24} fill={currentSong?.liked?'#ef4444':'none'} color={currentSong?.liked?'#ef4444':'rgba(255,255,255,.28)'} style={{ transition:'all .25s' }}/>
          </button>
        </div>
      </div>

      {/* GENRE TAGS */}
      <div style={{ padding:'0 20px 8px', display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 }}>
        {currentSong?.genre && (
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:7, background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.45)', border:'1px solid rgba(255,255,255,.1)' }}>{currentSong.genre}</span>
        )}
        {currentSong?.format && (
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:7, background:`rgba(${accentCSS},.14)`, color:`rgba(${accentCSS},1)`, border:`1px solid rgba(${accentCSS},.28)` }}>{currentSong.format}</span>
        )}
      </div>

      {/* PROGRESS BAR */}
      <div style={{ padding:'0 20px 4px', flexShrink:0 }}>
        <div className="fp-prog-track" onClick={seek} onTouchMove={seekTouch}>
          <div className="fp-prog-fill" style={{ width:`${prog}%` }}>
            <div className="fp-prog-thumb"/>
          </div>
          {/* Timestamp comment markers */}
          {duration > 0 && tsComments.map(c => {
            const pct = Math.min(97, Math.max(2, (c.timestamp/duration)*100));
            const near = Math.abs(currentTime - c.timestamp) < 3;
            return (
              <div key={c._id} className="fp-ts-marker"
                style={{ left:`${pct}%`, width:near?10:7, height:near?10:7, background:near?`rgba(${accentCSS},1)`:'rgba(255,255,255,.5)', boxShadow:near?`0 0 10px rgba(${accentCSS},.9)`:'' }}
                onClick={e=>{ e.stopPropagation(); seekToTimestamp(c.timestamp); setActiveTab('comments'); }}
              />
            );
          })}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:9, fontSize:10, color:'rgba(255,255,255,.2)', fontFamily:'var(--fp-mono)' }}>
          <span>{formatTime(currentTime)}</span>
          {tsComments.length > 0 && (
            <button onClick={()=>setActiveTab('comments')} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:`rgba(${accentCSS},.6)`, border:'none', background:'none', cursor:'pointer', transition:'color .18s', fontFamily:'var(--fp-font)' }}
              onMouseEnter={e=>e.currentTarget.style.color=`rgba(${accentCSS},1)`} onMouseLeave={e=>e.currentTarget.style.color=`rgba(${accentCSS},.6)`}>
              <MessageCircle size={9}/> {tsComments.length}
            </button>
          )}
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px 6px', flexShrink:0 }}>
        {/* Party */}
        <button onClick={()=>onOpenListenParty?.()}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:99, fontSize:11, fontWeight:700, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.4)', cursor:'pointer', transition:'all .2s', fontFamily:'var(--fp-font)' }}
          onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,.1)'; e.currentTarget.style.color='rgba(255,255,255,.85)'; e.currentTarget.style.transform='scale(1.05)'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='rgba(255,255,255,.4)'; e.currentTarget.style.transform='scale(1)'; }}>
          <Radio size={13}/> Party
        </button>

        {/* Shuffle */}
        <button onClick={()=>setIsShuffle(v=>!v)} className="fp-ctrl"
          style={{ width:44, height:44, color:isShuffle?accentHex:'rgba(255,255,255,.3)', background:isShuffle?`rgba(${accentCSS},.14)`:'' }}>
          <Shuffle size={20}/>
        </button>

        {/* Prev */}
        <button onClick={handlePrev} className="fp-ctrl fp-skip" style={{ width:48, height:48, color:'rgba(255,255,255,.85)' }}>
          <SkipBack size={26} fill="rgba(255,255,255,.85)"/>
        </button>

        {/* Play — main button */}
        <button className="fp-play-btn"
          onClick={()=>{ initAudioEngine(); setIsPlaying(p=>!p); }}
          style={{ width:70, height:70 }}>
          {isPlaying ? <Pause fill="white" size={26} color="white"/> : <Play fill="white" size={26} color="white" style={{ marginLeft:3 }}/>}
        </button>

        {/* Next */}
        <button onClick={handleNext} className="fp-ctrl fp-skip" style={{ width:48, height:48, color:'rgba(255,255,255,.85)' }}>
          <SkipForward size={26} fill="rgba(255,255,255,.85)"/>
        </button>

        {/* Repeat */}
        <button onClick={()=>setRepeatMode(m=>(m+1)%3)} className="fp-ctrl"
          style={{ width:44, height:44, color:repeatMode>0?accentHex:'rgba(255,255,255,.3)', background:repeatMode>0?`rgba(${accentCSS},.14)`:'' }}>
          {repeatMode===2?<Repeat1 size={20}/>:<Repeat size={20}/>}
        </button>

        <div style={{ width:72 }}/>
      </div>

      {/* VOLUME */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 28px 12px', flexShrink:0 }}>
        <button onClick={()=>setVolume(v=>v>0?0:80)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
          {volume === 0 ? <VolumeX size={15} color="rgba(255,255,255,.2)"/> : <Volume2 size={15} color="rgba(255,255,255,.22)"/>}
        </button>
        <div className="fp-vol-track">
          <div className="fp-vol-fill" style={{ width:`${volume}%` }}/>
          <input type="range" min="0" max="100" value={volume} onChange={e=>setVolume(parseInt(e.target.value,10))} className="fp-vol-input"/>
        </div>
        <span style={{ fontSize:11, color:'rgba(255,255,255,.2)', fontFamily:'var(--fp-mono)', minWidth:32, textAlign:'right' }}>{volume}%</span>
      </div>

      {/* ACTION PILLS — with working Download & Share */}
      <div style={{ padding:'0 20px 16px', flexShrink:0 }}>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
          {/* Like */}
          <button onClick={handleLike} className={`fp-pill${currentSong?.liked?' liked':''}`}>
            <Heart size={12} fill={currentSong?.liked?'#f87171':'none'}/> {currentSong?.liked?'Aimé':'Aimer'}
          </button>

          {/* Download — FONCTIONNEL */}
          <button 
            className="fp-pill"
            style={isAudioCached(currentSong?._id) ? { color: '#4ade80', borderColor: 'rgba(74,222,128,.4)', background: 'rgba(74,222,128,.1)' } : {}}
            onClick={async () => {
              if (isAudioCached(currentSong?._id)) {
                await removeCached(currentSong);
              } else {
                await cacheAudio(currentSong);
              }
            }}>
            {isAudioCached(currentSong?._id)
              ? <><Check size={12}/> Téléchargé</>
              : <><Download size={12}/> Télécharger</>
            }
          </button>

          {/* Share — FONCTIONNEL */}
          <button className="fp-pill" onClick={()=>setShowShare(true)}>
            <Share2 size={12}/> Partager
          </button>

          {/* Sleep timer */}
          <button className={`fp-pill${sleepTimer>0?' sleep-on':''}`} onClick={()=>setSleepTimer(sleepTimer>0?0:30)}>
            <Moon size={12}/> {sleepTimer>0?`Veille ${sleepTimer}'`:'Veille'}
          </button>
        </div>
      </div>
    </div>
  );

  // ──────────────── MAIN RENDER ────────────────
  return (
    <div ref={rootRef} className="fp-root" style={{ '--fp-accent':accentCSS, position:'fixed', inset:0, zIndex:200, display:'flex', flexDirection:'row', overflow:'hidden', userSelect:'none', background:'#080808' }}>

      {/* BACKGROUND */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        {currentSong?.image && (
          <img src={currentSong.image} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transform:'scale(1.5)', filter:`blur(90px) saturate(2.2)`, opacity:.25, transition:'opacity 1.2s ease' }}/>
        )}
        {/* Gradient overlay */}
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(180deg, rgba(8,8,8,.8) 0%, rgba(8,8,8,.45) 35%, rgba(8,8,8,.9) 75%, rgba(8,8,8,.99) 100%)` }}/>
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to right, rgba(8,8,8,.55) 0%, transparent 30%, transparent 70%, rgba(8,8,8,.55) 100%)` }}/>
        {/* Accent radial glow */}
        <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:'70%', height:220, background:`radial-gradient(ellipse at center, rgba(${accentCSS},.16) 0%, transparent 70%)`, transition:'background 1.2s ease', pointerEvents:'none' }}/>
        {/* Top accent */}
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'50%', height:140, background:`radial-gradient(ellipse at center, rgba(${accentCSS},.08) 0%, transparent 70%)`, pointerEvents:'none' }}/>
        {/* Noise grain */}
        <div style={{ position:'absolute', inset:0, opacity:.022, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:'100px' }}/>
      </div>

      {/* ═══ MAIN COLUMN ═══ */}
      <div className={isPlaying?'fp-playing':'fp-paused'} style={{ position:'relative', display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden' }}>

        {/* Frequency visualizer canvas */}
        <canvas ref={canvasRef} width="1000" height="6" style={{ position:'absolute', top:0, left:0, width:'100%', height:3, zIndex:10, pointerEvents:'none', opacity:.85 }}/>

        {/* HEADER */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'46px 18px 8px', flexShrink:0, zIndex:10 }}>
          <button onClick={onClose} className="fp-ctrl" style={{ width:42, height:42 }}>
            <ChevronDown size={22} color="rgba(255,255,255,.55)"/>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:'.3em', textTransform:'uppercase', color:'rgba(255,255,255,.2)' }}>En cours</span>
            {smartMode && (
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, background:`rgba(${accentCSS},.18)`, color:accentHex, padding:'3px 8px', borderRadius:99, border:`1px solid rgba(${accentCSS},.3)` }}>
                <Sparkles size={8}/> Smart
              </span>
            )}
            {isPlaying && (
              <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:14 }}>
                <div className="fp-bar" style={{ height:4 }}/>
                <div className="fp-bar" style={{ height:9 }}/>
                <div className="fp-bar" style={{ height:6 }}/>
                <div className="fp-bar" style={{ height:4 }}/>
              </div>
            )}
          </div>
          {/* Quick action icons */}
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            {[
              { key:'eq',       icon:<Sliders size={15}/>,      badge:0 },
              { key:'queue',    icon:<ListMusic size={15}/>,    badge:queue.length },
              { key:'comments', icon:<MessageCircle size={15}/>,badge:tsComments.length },
            ].map(({ key, icon, badge }) => (
              <div key={key} style={{ position:'relative' }}>
                <button onClick={()=>setActiveTab(t=>t===key?'player':key)} className="fp-ctrl"
                  style={{ width:38, height:38, color:activeTab===key?accentHex:'rgba(255,255,255,.35)', background:activeTab===key?`rgba(${accentCSS},.16)`:undefined, border:`1px solid ${activeTab===key?`rgba(${accentCSS},.3)`:'transparent'}`, transition:'all .2s' }}>
                  {icon}
                </button>
                {badge > 0 && (
                  <span style={{ position:'absolute', top:-3, right:-3, width:16, height:16, background:`rgba(${accentCSS},1)`, borderRadius:'50%', fontSize:8, fontWeight:900, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', boxShadow:`0 2px 8px rgba(${accentCSS},.5)` }}>
                    {badge>9?'9+':badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* TABS (mobile) */}
        <div className="fp-mobile-tabs" style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
          {TABS_MOBILE.map(({ key, icon, label }) => (
            <button key={key} className={`fp-tab${activeTab===key?' on':''}`} onClick={()=>setActiveTab(key)}>
              {icon}<span>{label}</span>
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="fp-scroll" style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column', overscrollBehavior:'contain', WebkitOverflowScrolling:'touch' }}>
          {activeTab==='player' && renderPlayer()}
          {activeTab==='eq' && <div className="fp-fade" style={{ flex:1 }}><EQPanel {...eqProps}/></div>}
          {activeTab==='queue' && <div className="fp-fade" style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}><QueuePanel {...queueProps}/></div>}
          {activeTab==='comments' && currentSong && (
            <div className="fp-fade" style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overscrollBehavior:'contain' }}>
              <CommentsPanel songId={currentSong._id} currentTime={currentTime} duration={duration} onSeek={seekToTimestamp} token={token} isLoggedIn={isLoggedIn} userId={userId} isAdmin={isAdminLocal} userNom={userNom} onMarkersReady={setTsComments} accentColor={accentHex} API={API||''}/>
            </div>
          )}
          {activeTab==='infos' && <div className="fp-fade" style={{ flex:1 }}><InfosPanel currentSong={currentSong} currentTime={currentTime} duration={duration} audioRef={audioRef} accentColor={accentHex}/></div>}
        </div>
      </div>

      {/* ═══ RIGHT COLUMN — DESKTOP ═══ */}
      <div className="fp-right" style={{ position:'relative', width:380, flexDirection:'column', borderLeft:`1px solid rgba(${accentCSS},.1)`, overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.35)', backdropFilter:'blur(48px)' }}/>
        <div style={{ position:'relative', display:'flex', flexDirection:'column', height:'100%' }}>
          <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,.07)', flexShrink:0 }}>
            {TABS_DESKTOP.map(({ key, icon, label }) => (
              <button key={key} onClick={()=>setActiveTab(key)} className={`fp-tab${activeTab===key?' on':''}`}>
                {icon}<span style={{ fontSize:9 }}>{label}</span>
              </button>
            ))}
          </div>
          <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {activeTab==='eq' && <div className="fp-scroll" style={{ flex:1, overflowY:'auto' }}><EQPanel {...eqProps}/></div>}
            {(activeTab==='queue'||activeTab==='player') && <QueuePanel {...queueProps}/>}
            {activeTab==='comments' && currentSong && (
              <div className="fp-scroll" style={{ flex:1, overflowY:'auto', overscrollBehavior:'contain' }}>
                <CommentsPanel songId={currentSong._id} currentTime={currentTime} duration={duration} onSeek={seekToTimestamp} token={token} isLoggedIn={isLoggedIn} userId={userId} isAdmin={isAdminLocal} userNom={userNom} onMarkersReady={setTsComments} accentColor={accentHex} API={API||''}/>
              </div>
            )}
            {activeTab==='infos' && <div className="fp-scroll" style={{ flex:1, overflowY:'auto' }}><InfosPanel currentSong={currentSong} currentTime={currentTime} duration={duration} audioRef={audioRef} accentColor={accentHex}/></div>}
          </div>
        </div>
      </div>

      {/* ══ MODALS ══ */}
      {showShare && currentSong && (
        <ShareModal
          song={currentSong}
          onClose={() => setShowShare(false)}
          onToast={showToast}
        />
      )}

      {/* ══ TOAST ══ */}
      {toast && <Toast key={toast.key} message={toast.message} icon={toast.icon} onDone={()=>setToast(null)}/>}
    </div>
  );
};

export default FullPlayerPage;
export { extractDominantColor };