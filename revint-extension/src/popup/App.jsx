import React, { useState, useEffect } from 'react';
import useVinted from './hooks/useVinted.js';
import useArticles from './hooks/useArticles.js';
import useTheme from './hooks/useTheme.js';
import useSupaAuth from './hooks/useSupaAuth.js';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import { IconRefresh, IconSettings, IconEdit, IconBoost } from './components/Icons.jsx';
import AuthScreen from './screens/AuthScreen.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Articles from './screens/Articles.jsx';
import EditArticle from './screens/EditArticle.jsx';
import Repost from './screens/Repost.jsx';
import Automation from './screens/Automation.jsx';
import Stats from './screens/Stats.jsx';
import Settings from './screens/Settings.jsx';

export default function App() {
  const { dark, toggle: toggleTheme } = useTheme();
  const { session, loading: supaLoading, refresh: refreshSupaSession } = useSupaAuth();
  const { connected, user, loading: authLoading, reconnect } = useVinted();
  const articles = useArticles(connected);

  const [screen, setScreen] = useState('init');
  const [tab, setTab] = useState('dashboard');
  const [editingArticle, setEditingArticle] = useState(null);

  // Set initial screen based on auth state
  useEffect(() => {
    if (supaLoading || authLoading) return;
    if (screen === 'init') {
      if (!session) {
        setScreen('auth');
      } else {
        setScreen(connected ? 'main' : 'onboard');
      }
    }
  }, [supaLoading, authLoading, connected, session, screen]);

  // Sync Vinted profile to Supabase when both sessions are available
  useEffect(() => {
    if (session && user) {
      chrome.runtime.sendMessage({
        type: 'revint:supaUpdateProfile',
        fields: {
          vinted_username: user.login,
          vinted_user_id: user.id,
          vinted_avatar_url: user.photo?.url,
          item_count: user.item_count,
        },
      }).catch(() => {});
    }
  }, [session, user]);

  const go = (s, payload) => {
    if (s === 'edit') {
      setEditingArticle(payload);
      setScreen('edit');
      return;
    }
    if (['dashboard', 'articles', 'automation', 'stats'].includes(s)) {
      setTab(s);
      setScreen('main');
      return;
    }
    setScreen(s);
  };

  const popupClass = `ext-popup${dark ? ' dark' : ''}`;

  // Loading state
  if (screen === 'init' || supaLoading || authLoading) {
    return (
      <div className={popupClass}>
        <Header />
        <div className="ext-main" style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{
              width: 40, height: 40, background: 'var(--ext-fg)', color: 'var(--gold)',
              display: 'grid', placeItems: 'center', fontFamily: 'var(--display)',
              fontWeight: 900, fontSize: 22, borderRadius: 10, margin: '0 auto 16px',
            }}>R</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ext-fg-4)', letterSpacing: '0.1em' }}>
              CHARGEMENT...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auth screen (Supabase login/signup)
  if (screen === 'auth') {
    return (
      <div className={popupClass}>
        <AuthScreen onAuth={() => {
          refreshSupaSession();
          setScreen('init');
        }} />
      </div>
    );
  }

  // Onboarding (Vinted cookie connection)
  if (screen === 'onboard') {
    return (
      <div className={popupClass}>
        <Onboarding onDone={() => {
          reconnect();
          setScreen('main');
          setTab('dashboard');
        }} />
      </div>
    );
  }

  // Edit article
  if (screen === 'edit' && editingArticle) {
    return (
      <div className={popupClass}>
        <EditArticle
          article={editingArticle}
          onBack={() => setScreen('main')}
          onSave={() => {
            articles.refresh();
            setScreen('main');
          }}
        />
      </div>
    );
  }

  // Repost
  if (screen === 'repost') {
    return (
      <div className={popupClass}>
        <Repost
          selectedIds={articles.selected}
          articles={articles.articles}
          onBack={() => setScreen('main')}
          onDone={() => {
            articles.refresh();
            articles.clearSelection();
            setScreen('main');
          }}
        />
      </div>
    );
  }

  // Settings
  if (screen === 'settings') {
    return (
      <div className={popupClass}>
        <Settings user={user} onBack={() => setScreen('main')} onLogout={() => { refreshSupaSession(); setScreen('init'); }} dark={dark} onToggleTheme={toggleTheme} />
      </div>
    );
  }

  // Main with tabs
  const tabsList = [
    { id: 'dashboard', label: 'Dash' },
    { id: 'articles', label: 'Articles', badge: articles.articles.length || null },
    { id: 'automation', label: 'Auto' },
    { id: 'stats', label: 'Stats' },
  ];

  return (
    <div className={popupClass}>
      <Header
        connected={connected}
        right={
          <>
            <ThemeToggle dark={dark} onToggle={toggleTheme} />
            <button className="ext-iconbtn" title="Rafraîchir" onClick={() => articles.refresh()}>
              <IconRefresh />
            </button>
            <button className="ext-iconbtn" title="Paramètres" onClick={() => setScreen('settings')}>
              <IconSettings />
            </button>
          </>
        }
      />
      <Tabs current={tab} onChange={setTab} tabs={tabsList} />
      <div className="ext-main">
        {tab === 'dashboard' && <Dashboard user={user} articles={articles} go={go} />}
        {tab === 'articles' && <Articles articles={articles} go={go} />}
        {tab === 'automation' && <Automation />}
        {tab === 'stats' && <Stats articles={articles.articles} />}
      </div>
      {tab === 'articles' && articles.selected.length > 0 && (
        <div className="ext-footer">
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10,
            color: 'var(--ext-fg-4)', letterSpacing: '0.05em',
          }}>
            {articles.selected.length} SÉLECTIONNÉ{articles.selected.length !== 1 ? 'S' : ''}
          </div>
          <div style={{ flex: 1 }} />
          <button
            className="btn btn-sm"
            onClick={() => {
              const first = articles.articles.find(a => articles.selected.includes(a.id));
              if (first) go('edit', first);
            }}
          >
            <IconEdit /> Éditer
          </button>
          <button className="btn btn-sm btn-gold" onClick={() => go('repost')}>
            <IconBoost /> Reposter
          </button>
        </div>
      )}
    </div>
  );
}
