import React, { useState } from 'react';
import Header from '../components/Header';

export default function AuthScreen({ onAuth }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validate = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Adresse email invalide.');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      if (isSignUp) {
        const signUpResult = await chrome.runtime.sendMessage({
          type: 'revint:supaSignUp', email, password,
        });
        if (signUpResult.error) throw new Error(signUpResult.error);

        // Auto-login after signup (email confirmation is disabled)
        const signInResult = await chrome.runtime.sendMessage({
          type: 'revint:supaSignIn', email, password,
        });
        if (signInResult.error) throw new Error(signInResult.error);
      } else {
        const result = await chrome.runtime.sendMessage({
          type: 'revint:supaSignIn', email, password,
        });
        if (result.error) throw new Error(result.error);
      }
      onAuth();
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  return (
    <>
      <Header />
      <div className="ext-main">
        <div className="onboard-stage">
          {/* Logo mark */}
          <div style={{
            width: 56, height: 56,
            background: 'var(--ext-fg)',
            color: 'var(--gold)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--display)',
            fontWeight: 900,
            fontSize: 28,
            borderRadius: 14,
            margin: '0 auto 20px',
            boxShadow: 'var(--shadow-2)',
          }}>
            R
          </div>

          {/* Title */}
          <div style={{
            fontFamily: 'var(--display)',
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: -0.6,
            marginBottom: 6,
            color: 'var(--ext-fg)',
          }}>
            {isSignUp ? 'Créer votre compte' : 'Bon retour !'}
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: 12,
            color: 'var(--ext-fg-3)',
            marginBottom: 28,
            maxWidth: 260,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.5,
          }}>
            {isSignUp
              ? 'Inscrivez-vous pour sauvegarder vos paramètres et statistiques.'
              : 'Connectez-vous pour retrouver votre espace ReVint.'}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{
            textAlign: 'left',
            maxWidth: 300,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            {/* Email */}
            <label className="label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="inp"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              style={{ marginBottom: 14 }}
            />

            {/* Password */}
            <label className="label" htmlFor="auth-password">Mot de passe</label>
            <input
              id="auth-password"
              className="inp"
              type="password"
              placeholder={isSignUp ? '6 caractères minimum' : 'Votre mot de passe'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              disabled={loading}
              style={{ marginBottom: 6 }}
            />

            {/* Error message */}
            {error && (
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--danger)',
                padding: '8px 0 4px',
                lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="btn btn-gold btn-lg"
              disabled={loading}
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: 18,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading
                ? (isSignUp ? 'Création...' : 'Connexion...')
                : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
            </button>
          </form>

          {/* Toggle mode link */}
          <div style={{
            marginTop: 20,
            fontSize: 12,
            color: 'var(--ext-fg-3)',
          }}>
            {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold-deep)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12,
                fontFamily: 'inherit',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              {isSignUp ? 'Se connecter' : 'Créer un compte'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Map Supabase / generic error messages to user-friendly French strings.
 */
function friendlyError(msg) {
  if (!msg) return 'Une erreur est survenue.';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials'))
    return 'Email ou mot de passe incorrect.';
  if (lower.includes('user already registered') || lower.includes('already been registered'))
    return 'Un compte existe déjà avec cet email.';
  if (lower.includes('email not confirmed'))
    return 'Votre email n\'a pas été confirmé.';
  if (lower.includes('password') && lower.includes('least'))
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (lower.includes('rate limit') || lower.includes('too many requests'))
    return 'Trop de tentatives. Réessayez dans quelques instants.';
  if (lower.includes('network') || lower.includes('fetch'))
    return 'Erreur réseau. Vérifiez votre connexion internet.';
  if (lower.includes('email rate limit'))
    return 'Trop d\'inscriptions. Réessayez dans quelques minutes.';
  return msg;
}
