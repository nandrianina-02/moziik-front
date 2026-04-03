import React from 'react';

const shimmer = `
  relative overflow-hidden
  before:absolute before:inset-0
  before:-translate-x-full
  before:animate-[shimmer_1.6s_infinite]
  before:bg-gradient-to-r
  before:from-transparent before:via-white/5 before:to-transparent
`;

// ── Song row skeleton ──────────────────────────────────────────────────────────
export const SongRowSkeleton = () => (
  <div className="p-3 rounded-xl flex items-center gap-3">
    <div className="w-5 shrink-0 flex items-center justify-center">
      <div className="w-3 h-3 rounded bg-zinc-800" />
    </div>
    <div className={`w-10 h-10 rounded-lg bg-zinc-800 shrink-0 ${shimmer}`} />
    <div className="flex-1 min-w-0 space-y-2">
      <div className={`h-3 bg-zinc-800 rounded-full w-3/4 ${shimmer}`} />
      <div className={`h-2 bg-zinc-800 rounded-full w-1/2 ${shimmer}`} />
    </div>
    <div className={`w-8 h-2 bg-zinc-800 rounded-full ${shimmer}`} />
  </div>
);

// ── Song list skeleton ─────────────────────────────────────────────────────────
export const SongListSkeleton = ({ count = 8 }) => (
  <div className="space-y-1">
    {Array.from({ length: count }).map((_, i) => (
      <SongRowSkeleton key={i} />
    ))}
  </div>
);

// ── Card skeleton (albums, artists) ───────────────────────────────────────────
export const CardSkeleton = () => (
  <div className="rounded-2xl bg-zinc-900/60 p-3 space-y-3">
    <div className={`w-full aspect-square rounded-xl bg-zinc-800 ${shimmer}`} />
    <div className={`h-3 bg-zinc-800 rounded-full w-3/4 ${shimmer}`} />
    <div className={`h-2 bg-zinc-800 rounded-full w-1/2 ${shimmer}`} />
  </div>
);

// ── Grid skeleton ──────────────────────────────────────────────────────────────
export const GridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// ── Stat card skeleton (dashboard) ────────────────────────────────────────────
export const StatCardSkeleton = () => (
  <div className="bg-zinc-900/60 rounded-2xl p-5 space-y-3">
    <div className={`h-2 w-20 bg-zinc-800 rounded-full ${shimmer}`} />
    <div className={`h-8 w-16 bg-zinc-800 rounded-xl ${shimmer}`} />
    <div className={`h-2 w-28 bg-zinc-800 rounded-full ${shimmer}`} />
  </div>
);

// ── Dashboard skeleton ────────────────────────────────────────────────────────
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
    <div className={`h-64 bg-zinc-900/60 rounded-2xl ${shimmer}`} />
    <SongListSkeleton count={5} />
  </div>
);

// ── Profile skeleton ──────────────────────────────────────────────────────────
export const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <div className={`w-20 h-20 rounded-full bg-zinc-800 shrink-0 ${shimmer}`} />
      <div className="space-y-2 flex-1">
        <div className={`h-5 bg-zinc-800 rounded-full w-40 ${shimmer}`} />
        <div className={`h-3 bg-zinc-800 rounded-full w-24 ${shimmer}`} />
      </div>
    </div>
    <SongListSkeleton count={6} />
  </div>
);

// ── Tailwind keyframe (à ajouter dans tailwind.config.js si pas présent) ──────
// extend: { keyframes: { shimmer: { '100%': { transform: 'translateX(100%)' } } }, animation: { shimmer: 'shimmer 1.6s infinite' } }
