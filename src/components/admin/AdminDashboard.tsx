import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useAutoLogout } from '../../hooks/useAutoLogout';
import { migrateData } from '../../utils/migrateData';
import { apiCall } from '../../utils/api';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { ToastProvider, useToast } from '../../hooks/useToast';

// Lazy load tabs for code splitting (P1 Hyperscale Fix)
const ProfileTab = React.lazy(() => import('./tabs/ProfileTab').then(m => ({ default: m.ProfileTab })));
const ExperienceTab = React.lazy(() => import('./tabs/ExperienceTab').then(m => ({ default: m.ExperienceTab })));
const EducationTab = React.lazy(() => import('./tabs/EducationTab').then(m => ({ default: m.EducationTab })));
const CertificationsTab = React.lazy(() => import('./tabs/CertificationsTab').then(m => ({ default: m.CertificationsTab })));
const SkillsTab = React.lazy(() => import('./tabs/SkillsTab').then(m => ({ default: m.SkillsTab })));
const ProjectsTab = React.lazy(() => import('./tabs/ProjectsTab').then(m => ({ default: m.ProjectsTab })));
const ToolsTab = React.lazy(() => import('./tabs/ToolsTab').then(m => ({ default: m.ToolsTab })));
const LearningTab = React.lazy(() => import('./tabs/LearningTab').then(m => ({ default: m.LearningTab })));

type TabType = 'profile' | 'experience' | 'education' | 'certifications' | 'skills' | 'projects' | 'tools' | 'learning';

export function AdminDashboard() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AdminDashboardContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

function AdminDashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  const { success, error: showError } = useToast();

  const showToast = (type: 'success' | 'error', message: string) => {
    if (type === 'success') success('Success', message);
    else showError('Error', message);
  };

  // Check migration status
  useEffect(() => {
    const checkMigration = async () => {
      try {
        const res = await fetch('/api/admin/migration-status');
        const data = await res.json();
        setMigrationCompleted(data?.status === 'COMPLETED');
      } catch (e) {
        // Ignore
      }
    };
    checkMigration();
  }, []);

  // Auth Init
  useEffect(() => {
    const init = async () => {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
        if (!response.ok) {
          window.location.href = '/admin';
          return;
        }
        const { user: serverUser, accessToken, refreshToken } = await response.json();

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }

        setUser(serverUser);
      } catch (err) {
        console.error('[DEBUG] Failed to initialize:', err);
        window.location.href = '/admin';
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Auto-logout
  useAutoLogout({
    inactivityTimeout: 30 * 60 * 1000,
    onLogout: async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      } catch (err) {
        console.error('Auto-logout error:', err);
      }
      window.location.href = '/admin';
    },
    showExitConfirmation: true,
    logoutOnUnload: true,
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.href = '/admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'certifications', label: 'Certifications', icon: '📜' },
    { id: 'skills', label: 'Skills', icon: '🛠️' },
    { id: 'projects', label: 'Projects', icon: '📁' },
    { id: 'tools', label: 'Tools', icon: '🔧' },
    { id: 'learning', label: 'Learning', icon: '📚' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold">
                V
              </div>
              <span className="font-semibold text-white">Admin Dashboard</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" target="_blank" className="text-slate-400 hover:text-white text-sm transition-colors">
              View Site →
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-all"
            >
              Logout
            </button>
            <a
              href="/admin/preview"
              target="_blank"
              className="px-4 py-2 text-sm bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg hover:border-amber-500/50 transition-all"
            >
              👁 Preview
            </a>
            {!migrationCompleted && (
              <button
                onClick={async () => {
                  if (!user) return;
                  if (!confirm('seed initial data?')) return;
                  setLoading(true);
                  const res = await migrateData(user.id);
                  if (res.success) {
                    setMigrationCompleted(true);
                    showToast('success', 'Migration complete! Reloading...');
                    window.location.reload();
                  } else {
                    showToast('error', 'Migration failed.');
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 text-sm bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-lg hover:border-indigo-500/50 transition-all"
              >
                ⚡ Migrate Data
              </button>
            )}
            <button
               onClick={async () => {
                if (!confirm('Publish all drafts to live?')) return;
                setPublishing(true);
                const { error } = await apiCall('/api/admin/publish', { method: 'POST' });
                if (error) showToast('error', error.message || 'Publish failed');
                else showToast('success', 'Published successfully!');
                setPublishing(false);
              }}
              disabled={publishing}
              className="px-4 py-2 text-sm bg-green-500/20 text-green-400 hover:text-green-300 border border-green-500/30 rounded-lg hover:border-green-500/50 transition-all font-semibold disabled:opacity-50"
            >
              {publishing ? '⏳ Publishing...' : '🚀 Publish Changes'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                    ? 'bg-accent/20 text-white border border-accent/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Suspense fallback={
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            }>
              {activeTab === 'profile' && <ProfileTab user={user} />}
              {activeTab === 'experience' && <ExperienceTab user={user} />}
              {activeTab === 'education' && <EducationTab user={user} />}
              {activeTab === 'certifications' && <CertificationsTab user={user} />}
              {activeTab === 'skills' && <SkillsTab user={user} />}
              {activeTab === 'projects' && <ProjectsTab user={user} />}
              {activeTab === 'tools' && <ToolsTab user={user} />}
              {activeTab === 'learning' && <LearningTab user={user} />}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
