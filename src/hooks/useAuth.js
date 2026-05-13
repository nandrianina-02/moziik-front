// hooks/useAuth.js
import { useState, useCallback } from 'react';
import { API } from '../config/api';

// ─── Endpoint map — facile à maintenir ────────────────────────────────────────
const ENDPOINTS = {
  admin:  { login:    '/admin/login' },
  artist: { login:    '/artists/login' },
  user:   { login:    '/users/login', register: '/users/register' },
};

// ─── Clés localStorage centralisées ──────────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN:     'moozik_token',
  EMAIL:     'moozik_email',
  ROLE:      'moozik_role',
  NOM:       'moozik_nom',
  ARTIST_ID: 'moozik_artisteId',
  USER_ID:   'moozik_userId',
};

const persistSession = (data) => {
  // NOTE DE SÉCURITÉ : Pour une app en production, préférer des httpOnly cookies
  // gérés côté serveur plutôt que localStorage (vulnérable aux attaques XSS).
  // Cette implémentation est conservée pour compatibilité avec l'API existante.
  const entries = [
    [STORAGE_KEYS.TOKEN,     data.token],
    [STORAGE_KEYS.EMAIL,     data.email],
    [STORAGE_KEYS.ROLE,      data.role],
    [STORAGE_KEYS.NOM,       data.nom],
    [STORAGE_KEYS.ARTIST_ID, data.artisteId],
    [STORAGE_KEYS.USER_ID,   data.userId],
  ];
  entries.forEach(([key, value]) => {
    if (value != null) localStorage.setItem(key, value);
  });
};

// ─── Validation client ────────────────────────────────────────────────────────
const validate = ({ mode, isRegister, email, password, nom }) => {
  if (!email.includes('@') || !email.includes('.'))
    return 'Adresse email invalide.';
  if (password.length < 8)
    return 'Mot de passe trop court (8 caractères minimum).';
  if (mode === 'user' && isRegister && !nom.trim())
    return 'Veuillez entrer un nom d\'affichage.';
  return null;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (onLogin) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const clearError = useCallback(() => setError(''), []);

  const submit = useCallback(async ({ mode, isRegister, email, password, nom }) => {
    // 1. Validation locale d'abord
    const validationError = validate({ mode, isRegister, email, password, nom });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    // 2. Résolution de l'endpoint
    const action   = isRegister ? 'register' : 'login';
    const endpoint = ENDPOINTS[mode]?.[action] ?? ENDPOINTS[mode]?.login;
    const body     = mode === 'user' && isRegister
      ? { email, password, nom }
      : { email, password };

    try {
      const res  = await fetch(`${API}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Erreur de connexion. Veuillez réessayer.');
      } else {
        persistSession(data);
        onLogin(data);
      }
    } catch (err) {
      console.error('[useAuth] Erreur réseau :', err);
      setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [onLogin]);

  return { loading, error, clearError, submit };
};