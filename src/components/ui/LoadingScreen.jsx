import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimationFrame, useMotionValue, useTransform, animate } from 'framer-motion';

// ─── Particle System ────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  angle: (i / 28) * 360,
  radius: 90 + Math.random() * 60,
  size: 1.5 + Math.random() * 2.5,
  duration: 3.5 + Math.random() * 4,
  delay: Math.random() * 3,
  opacity: 0.3 + Math.random() * 0.5,
}));

const STREAKS = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  angle: i * 45 + Math.random() * 20,
  length: 40 + Math.random() * 80,
  duration: 2 + Math.random() * 2,
  delay: Math.random() * 2,
}));

// ─── Equalizer Bars ─────────────────────────────────────────────────────────
const EQ_BARS = [
  { heights: [0.3, 0.7, 0.5, 0.9, 0.4], color: '#ff2d55' },
  { heights: [0.6, 0.4, 1.0, 0.3, 0.7], color: '#ff6b35' },
  { heights: [0.8, 0.5, 0.3, 0.8, 0.6], color: '#c026d3' },
  { heights: [0.4, 0.9, 0.7, 0.5, 0.3], color: '#6366f1' },
  { heights: [1.0, 0.3, 0.8, 0.4, 0.9], color: '#ff2d55' },
];

function EqualizerBar({ index }) {
  const bar = EQ_BARS[index % EQ_BARS.length];
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 28 }}>
      {[...Array(5)].map((_, j) => {
        const targetH = bar.heights[j % bar.heights.length];
        return (
          <motion.div
            key={j}
            style={{
              width: 3,
              borderRadius: 2,
              background: `linear-gradient(to top, ${bar.color}cc, ${bar.color})`,
              boxShadow: `0 0 6px ${bar.color}88`,
              originY: 1,
            }}
            animate={{ scaleY: [0.2, targetH, 0.3, 0.85, 0.2] }}
            transition={{
              duration: 1.1 + j * 0.13,
              delay: index * 0.07 + j * 0.06,
              repeat: Infinity,
              ease: [0.45, 0, 0.55, 1],
            }}
            initial={{ scaleY: 0.2, height: 28 }}
          />
        );
      })}
    </div>
  );
}

// ─── Rotating Spectrum Rings ─────────────────────────────────────────────────
function SpectrumRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[120, 152, 184, 220].map((size, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            border: `1px solid`,
            borderColor: [
              'rgba(255,45,85,0.25)',
              'rgba(192,38,211,0.18)',
              'rgba(99,102,241,0.15)',
              'rgba(255,107,53,0.12)',
            ][i],
            boxShadow: `0 0 ${8 + i * 4}px ${[
              'rgba(255,45,85,0.15)',
              'rgba(192,38,211,0.12)',
              'rgba(99,102,241,0.1)',
              'rgba(255,107,53,0.08)',
            ][i]}`,
          }}
          animate={{
            rotate: i % 2 === 0 ? 360 : -360,
            scale: [1, 1.03, 1],
          }}
          transition={{
            rotate: { duration: 8 + i * 3, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 },
          }}
        />
      ))}
      {/* Dashed arc ring */}
      <motion.div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          border: '1px dashed rgba(255,45,85,0.2)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ─── Floating Particles ──────────────────────────────────────────────────────
function FloatingParticles() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {PARTICLES.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.radius;
        const y = Math.sin(rad) * p.radius;
        return (
          <motion.div
            key={p.id}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.id % 3 === 0
                ? 'rgba(255,45,85,0.9)'
                : p.id % 3 === 1
                ? 'rgba(192,38,211,0.8)'
                : 'rgba(99,102,241,0.7)',
              boxShadow: `0 0 ${p.size * 3}px currentColor`,
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
            }}
            animate={{
              x: [0, Math.cos(rad + 0.5) * 12, 0],
              y: [0, Math.sin(rad + 0.5) * 12, 0],
              opacity: [0, p.opacity, 0],
              scale: [0, 1.4, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Light Streaks ────────────────────────────────────────────────────────────
function LightStreaks() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {STREAKS.map((s) => {
        const rad = (s.angle * Math.PI) / 180;
        return (
          <motion.div
            key={s.id}
            style={{
              position: 'absolute',
              width: 1.5,
              height: s.length,
              background: 'linear-gradient(to top, transparent, rgba(255,45,85,0.6), transparent)',
              transformOrigin: 'bottom center',
              rotate: s.angle,
              left: '50%',
              top: '50%',
              marginLeft: -0.75,
              marginTop: -s.length,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scaleY: [0.2, 1, 0.2],
            }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Neon Progress Bar ────────────────────────────────────────────────────────
function NeonProgressBar({ progress }) {
  return (
    <div style={{ width: 220, position: 'relative' }}>
      {/* Track */}
      <div
        style={{
          height: 3,
          borderRadius: 99,
          background: 'rgba(255,255,255,0.07)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Fill */}
        <motion.div
          style={{
            height: '100%',
            borderRadius: 99,
            background: 'linear-gradient(90deg, #c026d3, #ff2d55, #ff6b35)',
            boxShadow: '0 0 12px rgba(255,45,85,0.8), 0 0 24px rgba(255,45,85,0.4)',
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        {/* Shimmer overlay */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
            width: '60%',
          }}
          animate={{ x: ['-100%', '250%'] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: 0.4,
          }}
        />
      </div>
      {/* Percentage */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: -20,
        fontSize: 10,
        letterSpacing: '0.12em',
        color: 'rgba(255,45,85,0.8)',
        fontFamily: 'monospace',
        fontWeight: 700,
      }}>
        {Math.round(progress)}%
      </div>
      {/* Reactive pulse dot at progress tip */}
      <AnimatePresence>
        <motion.div
          key={Math.round(progress / 5)}
          style={{
            position: 'absolute',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#ff2d55',
            top: -2,
            left: `${progress}%`,
            marginLeft: -3.5,
            boxShadow: '0 0 8px #ff2d55, 0 0 16px rgba(255,45,85,0.5)',
          }}
          initial={{ scale: 2, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </AnimatePresence>
    </div>
  );
}

// ─── Ambient Background ───────────────────────────────────────────────────────
function AmbientBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Deep base */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, #0d0010 0%, #060008 50%, #000000 100%)',
      }} />
      {/* Chromatic blobs */}
      <motion.div
        style={{
          position: 'absolute',
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,38,211,0.12) 0%, transparent 70%)',
          top: '10%', left: '5%',
          filter: 'blur(80px)',
        }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,45,85,0.1) 0%, transparent 70%)',
          bottom: '5%', right: '5%',
          filter: 'blur(80px)',
        }}
        animate={{ x: [0, -25, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        style={{
          position: 'absolute',
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          top: '40%', right: '20%',
          filter: 'blur(60px)',
        }}
        animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      {/* Scanline texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
        pointerEvents: 'none',
      }} />
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)',
      }} />
    </div>
  );
}

// ─── Main Logo Card ────────────────────────────────────────────────────────────
function LogoCard() {
  return (
    <motion.div
      style={{ position: 'relative', width: 96, height: 96 }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Outer glow pulse */}
      <motion.div
        style={{
          position: 'absolute',
          inset: -16,
          borderRadius: 28,
          background: 'radial-gradient(circle, rgba(255,45,85,0.25) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Spectrum rings centered on logo */}
      <SpectrumRings />
      {/* Light streaks */}
      <LightStreaks />
      {/* Floating particles */}
      <FloatingParticles />
      {/* Glassmorphism card */}
      <motion.div
        style={{
          position: 'relative',
          width: 96, height: 96,
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,45,85,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          overflow: 'hidden',
        }}
        animate={{ boxShadow: [
          '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,45,85,0.2), 0 0 30px rgba(255,45,85,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
          '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(192,38,211,0.3), 0 0 50px rgba(192,38,211,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
          '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,45,85,0.2), 0 0 30px rgba(255,45,85,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
        ]}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Inner gradient fill */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,45,85,0.3) 0%, rgba(192,38,211,0.2) 50%, rgba(99,102,241,0.15) 100%)',
          borderRadius: 24,
        }} />
        {/* Sheen */}
        <motion.div
          style={{
            position: 'absolute',
            top: 0, left: '-100%',
            width: '60%', height: '100%',
            background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
            transform: 'skewX(-15deg)',
          }}
          animate={{ left: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
        />
        {/* Equalizer bars grid */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <EqualizerBar key={i} index={i} />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Text Reveal ───────────────────────────────────────────────────────────────
function AnimatedTitle() {
  const letters = 'MOOZIK'.split('');
  return (
    <motion.h1
      style={{
        display: 'flex',
        gap: 2,
        fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
        fontSize: 52,
        fontWeight: 900,
        letterSpacing: '0.15em',
        lineHeight: 1,
        userSelect: 'none',
      }}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } } }}
    >
      {letters.map((l, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { y: 30, opacity: 0, filter: 'blur(8px)' },
            visible: { y: 0, opacity: 1, filter: 'blur(0px)' },
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: i < 2
              ? 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)'
              : i < 4
              ? 'linear-gradient(180deg, #ff2d55 0%, #c026d3 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
            textShadow: 'none',
            filter: i >= 2 && i < 4 ? 'drop-shadow(0 0 12px rgba(255,45,85,0.5))' : 'none',
          }}
        >
          {l}
        </motion.span>
      ))}
    </motion.h1>
  );
}

// ─── Subtext with animated dots ────────────────────────────────────────────────
function SubText({ message }) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 420);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
      }}
    >
      {/* Tiny animated bars */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 10 }}>
        {[0.4, 0.7, 1, 0.6].map((h, i) => (
          <motion.div
            key={i}
            style={{
              width: 2,
              height: 10,
              borderRadius: 1,
              background: '#ff2d55',
              originY: 1,
            }}
            animate={{ scaleY: [0.3, h, 0.3] }}
            transition={{
              duration: 0.8,
              delay: i * 0.1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span style={{
        fontSize: 11,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
        fontFamily: 'monospace',
        fontWeight: 600,
      }}>
        {message}
        <span style={{ display: 'inline-block', width: 20, textAlign: 'left' }}>
          {'.'.repeat(dots)}
        </span>
      </span>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const MoozikLoader = ({ message = 'Chargement' }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 94) return p;
        const increment = p < 40 ? Math.random() * 9 : p < 75 ? Math.random() * 5 : Math.random() * 2;
        return Math.min(p + increment, 94);
      });
    }, 320);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      overflow: 'hidden',
      background: '#000',
    }}>
      <AmbientBackground />

      {/* Center content float */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 36,
        }}
      >
        {/* Logo */}
        <LogoCard />

        {/* Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <AnimatedTitle />
          <SubText message={message} />
        </div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <NeonProgressBar progress={progress} />
        </motion.div>
      </motion.div>

      {/* Corner accents */}
      {[
        { top: 20, left: 20 },
        { top: 20, right: 20 },
        { bottom: 20, left: 20 },
        { bottom: 20, right: 20 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            width: 24,
            height: 24,
            borderTop: i < 2 ? '1px solid rgba(255,45,85,0.25)' : 'none',
            borderBottom: i >= 2 ? '1px solid rgba(255,45,85,0.25)' : 'none',
            borderLeft: i % 2 === 0 ? '1px solid rgba(255,45,85,0.25)' : 'none',
            borderRight: i % 2 === 1 ? '1px solid rgba(255,45,85,0.25)' : 'none',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4 + i * 0.08, duration: 0.4 }}
        />
      ))}

      {/* Version tag */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.6 }}
        style={{
          position: 'absolute',
          bottom: 28,
          fontSize: 9,
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          fontFamily: 'monospace',
        }}
      >
        v2.0 · Premium Audio Experience
      </motion.div>
    </div>
  );
};

export default MoozikLoader;