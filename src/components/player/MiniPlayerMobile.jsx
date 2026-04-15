import React from 'react';
import { Play, Pause, SkipForward, Heart, ChevronUp, Download, Check } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// MiniPlayerMobile
// Bouton téléchargement hors-ligne inclus et visible sur mobile
// ─────────────────────────────────────────────────────────────────
const MiniPlayerMobile = ({
  currentSong,
  isPlaying,
  setIsPlaying,
  handleNext,
  toggleLike,
  onOpenFullPlayer,
  currentTime,
  duration,
  initAudioEngine,
  // Props optionnels pour le cache hors-ligne
  cacheAudio,
  removeCached,
  isAudioCached,
}) => {
  if (!currentSong) return null;

  const prog   = duration > 0 ? (currentTime / duration) * 100 : 0;
  const cached = isAudioCached ? isAudioCached(currentSong) : false;

  const handleCacheToggle = async (e) => {
    e.stopPropagation();
    if (!cacheAudio || !removeCached) return;
    if (cached) {
      await removeCached(currentSong);
    } else {
      await cacheAudio(currentSong);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* ── Barre de progression ultra-fine tout en haut ── */}
      <div className="h-0.5 w-full bg-white/10 relative">
        <div
          className="absolute top-0 left-0 h-full bg-linear-to-r from-blue-500 to-violet-500 transition-all duration-300"
          style={{ width: `${prog}%` }}
        />
      </div>

      {/* ── Corps du mini player ── */}
      <div className="relative overflow-hidden">
        {/* Fond ambiant depuis la pochette */}
        {currentSong.image && (
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={currentSong.image}
              className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
              alt=""
            />
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
          </div>
        )}

        {/* Contenu — tap sur le fond ouvre le FullPlayer */}
        <div
          className="relative flex items-center gap-2 px-3 py-3 cursor-pointer"
          onClick={onOpenFullPlayer}
        >
          {/* Pochette */}
          <div className="relative shrink-0">
            <img
              src={currentSong.image}
              className={`w-11 h-11 rounded-xl object-cover shadow-lg shadow-black/50 transition-all duration-300 ${isPlaying ? 'scale-100' : 'scale-95 opacity-80'}`}
              alt=""
            />
            {isPlaying && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-linear-to-br from-blue-400 to-violet-500 border border-zinc-950" />
            )}
          </div>

          {/* Titre + artiste */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate leading-tight">{currentSong.titre}</p>
            <p className="text-[11px] text-white/50 truncate mt-0.5">{currentSong.artiste}</p>
          </div>

          {/* Boutons action — stopPropagation pour ne pas ouvrir le FullPlayer */}
          <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>

            {/* Téléchargement hors-ligne */}
            {(cacheAudio || removeCached) && (
              <button
                onClick={handleCacheToggle}
                title={cached ? 'Supprimer du hors-ligne' : 'Écouter hors-ligne'}
                className="p-2 active:scale-90 transition">
                {cached
                  ? <Check size={16} className="text-green-400" />
                  : <Download size={16} className="text-white/40 hover:text-white transition" />
                }
              </button>
            )}

            {/* Like */}
            <button
              onClick={() => toggleLike(currentSong._id)}
              className="p-2 active:scale-90 transition">
              <Heart
                size={18}
                fill={currentSong.liked ? '#ef4444' : 'none'}
                className={currentSong.liked ? 'text-red-500' : 'text-white/40'}
              />
            </button>

            {/* Play/Pause — anneau gradient */}
            <button
              onClick={() => { initAudioEngine(); setIsPlaying(p => !p); }}
              className="relative flex items-center justify-center w-10 h-10 active:scale-95 transition mx-0.5">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 180deg, #6366f1, #8b5cf6, #3b82f6, #6366f1)',
                  padding: '2px'
                }}>
                <div className="w-full h-full rounded-full bg-zinc-900" />
              </div>
              <div className="relative z-10">
                {isPlaying
                  ? <Pause fill="white" size={16} className="text-white" />
                  : <Play  fill="white" size={16} className="text-white ml-0.5" />}
              </div>
            </button>

            {/* Suivant */}
            <button onClick={handleNext} className="p-2 active:scale-90 transition">
              <SkipForward size={18} className="text-white/70" />
            </button>
          </div>

          {/* Flèche haut */}
          <ChevronUp size={14} className="text-white/25 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default MiniPlayerMobile;