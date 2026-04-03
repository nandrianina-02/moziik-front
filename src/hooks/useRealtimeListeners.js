import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'wss://moozik-gft1.onrender.com';

/**
 * useRealtimeListeners — WebSocket pour voir ce qu'écoutent les autres users.
 *
 * Protocole attendu côté serveur :
 *   client → { type: 'join', token, songId, songTitle, artiste, image }
 *   client → { type: 'leave', token }
 *   server → { type: 'listeners', users: [{ nom, avatar, songTitle, artiste, image }] }
 *
 * Pour activer côté backend, ajoutez dans server.js :
 *   const { WebSocketServer } = require('ws');
 *   const wss = new WebSocketServer({ server });
 *   const listeners = new Map(); // token → { ws, data }
 *   wss.on('connection', ws => {
 *     ws.on('message', raw => {
 *       const msg = JSON.parse(raw);
 *       if (msg.type === 'join') listeners.set(msg.token, { ws, data: msg });
 *       if (msg.type === 'leave') listeners.delete(msg.token);
 *       // Broadcast
 *       const users = [...listeners.values()].map(l => l.data);
 *       wss.clients.forEach(c => c.readyState === 1 && c.send(JSON.stringify({ type: 'listeners', users })));
 *     });
 *     ws.on('close', () => { listeners.forEach((v, k) => { if (v.ws === ws) listeners.delete(k); }); });
 *   });
 */
export function useRealtimeListeners(token, currentSong) {
  const [listeners, setListeners] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    if (!token) return;
    try {
      const ws = new WebSocket(`${WS_URL}/ws/listeners`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        if (currentSong) {
          ws.send(JSON.stringify({
            type: 'join', token,
            songId: currentSong._id,
            songTitle: currentSong.titre,
            artiste: currentSong.artiste,
            image: currentSong.image,
          }));
        }
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'listeners') setListeners(msg.users || []);
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        // Reconnexion automatique après 5s
        reconnectRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => ws.close();
    } catch {}
  }, [token]);

  // Connect au mount
  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [token]);

  // Notifie le serveur quand la chanson change
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !currentSong) return;
    wsRef.current.send(JSON.stringify({
      type: 'join', token,
      songId: currentSong._id,
      songTitle: currentSong.titre,
      artiste: currentSong.artiste,
      image: currentSong.image,
    }));
  }, [currentSong?._id]);

  const disconnect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave', token }));
    }
  }, [token]);

  return { listeners, connected, disconnect };
}

/**
 * ListenersWidget — affiche un petit bandeau des auditeurs actifs.
 */
export const ListenersWidget = ({ listeners, connected }) => {
  if (!connected || listeners.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 rounded-xl border border-zinc-800/50">
      {/* Indicateur live */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live</span>
      </div>

      {/* Avatars */}
      <div className="flex -space-x-2">
        {listeners.slice(0, 5).map((u, i) => (
          <div key={i} title={`${u.nom} écoute: ${u.songTitle}`}
            className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center text-[9px] font-bold overflow-hidden shrink-0">
            {u.avatar
              ? <img src={u.avatar} className="w-full h-full object-cover" alt="" />
              : (u.nom || '?')[0].toUpperCase()
            }
          </div>
        ))}
        {listeners.length > 5 && (
          <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[9px] text-zinc-500 shrink-0">
            +{listeners.length - 5}
          </div>
        )}
      </div>

      <span className="text-[11px] text-zinc-500 truncate">
        {listeners.length === 1 ? '1 auditeur' : `${listeners.length} auditeurs`}
      </span>
    </div>
  );
};
