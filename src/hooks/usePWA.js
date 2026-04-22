import { useState, useEffect, useRef, useCallback } from 'react';

// ════════════════════════════════════════════
// HOOK: Media Session API
// Contrôle via casque Bluetooth, écran verrouillé, touches clavier
// Usage: useMediaSession(currentSong, isPlaying, { onPlay, onPause, onNext, onPrev })
// ════════════════════════════════════════════
export const useMediaSession = (currentSong, isPlaying, { onPlay, onPause, onNext, onPrev }) => {
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    // Métadonnées affichées sur l'écran de verrouillage
    navigator.mediaSession.metadata = new MediaMetadata({
      title:  currentSong.titre  || 'Titre inconnu',
      artist: currentSong.artiste || 'Artiste inconnu',
      album:  currentSong.album  || 'Moozik',
      artwork: [
        { src: currentSong.image || '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: currentSong.image || '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });

    // État de lecture
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Boutons de contrôle (casque, clavier, écran verrouillé)
    const handlers = [
      ['play',        onPlay],
      ['pause',       onPause],
      ['nexttrack',   onNext],
      ['previoustrack', onPrev],
      ['stop',        onPause],
    ];

    handlers.forEach(([action, handler]) => {
      if (handler) {
        try { navigator.mediaSession.setActionHandler(action, handler); }
        catch {} // Certains navigateurs ne supportent pas tous les handlers
      }
    });

    return () => {
      handlers.forEach(([action]) => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch {}
      });
    };
  }, [currentSong, isPlaying, onPlay, onPause, onNext, onPrev]);
};

// ════════════════════════════════════════════
// HOOK: Wake Lock API
// Empêche l'écran de se mettre en veille pendant la lecture
// Usage: useWakeLock(isPlaying)
// ════════════════════════════════════════════
export const useWakeLock = (isPlaying) => {
  const wakeLockRef = useRef(null);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try { await wakeLockRef.current.release(); }
      catch {}
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) requestWakeLock();
    else releaseWakeLock();

    // Réacquérir le lock si la page redevient visible (ex: retour d'une autre app)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) requestWakeLock();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      releaseWakeLock();
    };
  }, [isPlaying, requestWakeLock, releaseWakeLock]);
};

// ════════════════════════════════════════════
// HOOK: App Badge API
// Affiche un badge sur l'icône de l'app (nb de notifs non lues)
// Usage: useAppBadge(unreadCount)
// ════════════════════════════════════════════
export const useAppBadge = (unreadCount) => {
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return;
    if (unreadCount > 0) {
      navigator.setAppBadge(unreadCount).catch(() => {});
    } else {
      navigator.clearAppBadge().catch(() => {});
    }
  }, [unreadCount]);
};

// ════════════════════════════════════════════
// HOOK: Offline Detection
// Détecte la connectivité réseau
// Usage: const { isOnline, wasOffline } = useOfflineDetection()
// ════════════════════════════════════════════
export const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  setWasOffline(true); setTimeout(() => setWasOffline(false), 3000); };
    const onOffline = () => { setIsOnline(false); setWasOffline(false); };

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return { isOnline, wasOffline };
};

// ════════════════════════════════════════════
// HOOK: Audio Cache (Offline Music)
// Met en cache un fichier audio pour l'écoute hors-ligne
// Usage: const { cacheAudio, isAudioCached, removeCached, cachedIds } = useAudioCache()
// ════════════════════════════════════════════
export const useAudioCache = () => {
  const [cachedIds, setCachedIds] = useState(new Set());
  const CACHE_NAME = 'moozik-audio-offline';

  const loadCachedIds = useCallback(async () => {
    if (!('caches' in window)) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const ids = new Set(keys.map(r => {
        const url = new URL(r.url);
        return url.searchParams.get('songId') || url.pathname.split('/').pop();
      }).filter(Boolean));
      setCachedIds(ids);
    } catch {}
  }, []);

  useEffect(() => { loadCachedIds(); }, [loadCachedIds]);

  const cacheAudio = useCallback(async (song) => {
    if (!('caches' in window) || !song?.src) return false;
    try {
      const cache = await caches.open(CACHE_NAME);
      // On stocke avec l'ID comme paramètre pour le retrouver facilement
      const cacheKey = new Request(song.src);
      const existing = await cache.match(cacheKey);
      if (existing) return true; // Déjà en cache

      const response = await fetch(song.src);
      if (!response.ok) return false;
      await cache.put(cacheKey, response.clone());
      setCachedIds(prev => new Set([...prev, song._id]));
      return true;
    } catch { return false; }
  }, []);

  const removeCached = useCallback(async (song) => {
    if (!('caches' in window) || !song?.src) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(new Request(song.src));
      setCachedIds(prev => { const s = new Set(prev); s.delete(song._id); return s; });
    } catch {}
  }, []);

  const isAudioCached = useCallback((songId) => cachedIds.has(songId), [cachedIds]);

  return { cacheAudio, removeCached, isAudioCached, cachedIds };
};