// hooks/useAuth.js
import { useState, useCallback } from 'react';
import { API } from '../config/api';

// ─── Endpoint map ─────────────────────────────────────────────────────────────
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
// FIX : seuil password aligné sur le backend (6 car. minimum, pas 8)
// FIX : validation appelée AVANT setLoading pour ne pas bloquer sur loading=true
const validate = ({ mode, isRegister, email, password, nom }) => {
  if (!email.includes('@') || !email.includes('.'))
    return 'Adresse email invalide.';
  if (password.length < 6)
    return 'Mot de passe trop court (6 caractères minimum).';
  if (mode === 'user' && isRegister && !nom.trim())
    return 'Veuillez entrer un nom d\'affichage.';
  return null;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (onLogin) => {
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearError = useCallback(() => {
    setError('');
    setSuccessMsg('');
  }, []);

  const submit = useCallback(async ({ mode, isRegister, email, password, nom }) => {
    // FIX CRITIQUE : validation AVANT setLoading(true)
    // Avant : setLoading(true) était appelé en premier, puis validate() faisait
    // un return anticipé sans jamais atteindre le finally → loading restait true
    // indéfiniment, le bouton restait bloqué sur "Création en cours…"
    const validationError = validate({ mode, isRegister, email, password, nom });
    if (validationError) {
      setError(validationError);
      return; // ← on sort AVANT d'avoir mis loading à true : aucun blocage
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

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
      } else if (isRegister && !data.token) {
        // Inscription sans token = vérification email requise
        setSuccessMsg(data.message);
      } else {
        persistSession(data);
        onLogin(data);
      }
    } catch {
      setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false); // ← atteint dans tous les cas (try/catch)
    }
  }, [onLogin]);

  return { loading, error, clearError, submit, successMsg };
};