import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ReVint] React error:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 24, textAlign: 'center', color: 'var(--ext-fg)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, background: 'var(--danger)',
            color: '#fff', display: 'grid', placeItems: 'center',
            borderRadius: 'var(--r)', fontSize: 20, fontWeight: 700,
          }}>!</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Une erreur est survenue</div>
          <div style={{
            fontSize: 11, color: 'var(--ext-fg-4)', fontFamily: 'var(--mono)',
            maxWidth: 300, wordBreak: 'break-word',
          }}>
            {this.state.error?.message || 'Erreur inconnue'}
          </div>
          <button
            className="btn btn-sm btn-gold"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 8 }}
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
