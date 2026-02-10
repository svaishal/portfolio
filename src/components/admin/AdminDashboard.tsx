import React, { useState, useEffect, useCallback } from 'react';
import { useAutoSaveObject, useAutoSaveList } from '../../hooks/useAutoSave';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useAutoLogout } from '../../hooks/useAutoLogout';
import { migrateData } from '../../utils/migrateData';
import { apiCall } from '../../utils/api';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { ToastProvider, useToast } from '../../hooks/useToast';

// Types
interface Profile {
  id?: string;
  name: string;
  role: string;
  tagline: string;
  subtitle: string;
  location: string;
  years_experience: string;
  bio: string;
  about_intro: string;
  about_values: string;
  open_to_work: boolean;
  profile_photo_url: string | null;
}

interface Experience {
  id?: string;
  company: string;
  role: string;
  period: string;
  type: string;
  icon: string;
  achievements: string[];
  skills: string[];
  is_current: boolean;
  sort_order: number;
  visible: boolean;
}

interface Certification {
  id?: string;
  name: string;
  icon: string;
  issuer: string | null;
  date: string | null;
  url: string | null;
  visible: boolean;
  sort_order: number;
}

interface Skill {
  id?: string;
  name: string;
  category: 'technical' | 'soft';
  visible: boolean;
  sort_order: number;
}

interface Project {
  id?: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  highlights: string[];
  impact: string;
  image_url: string | null;
  link: string | null;
  visible: boolean;
  sort_order: number;
}

interface Tool {
  id?: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  visible: boolean;
  sort_order: number;
}

interface Education {
  id?: string;
  degree: string;
  institution: string;
  field: string;
  year: string;
  visible: boolean;
  sort_order: number;
}

type TabType = 'profile' | 'experience' | 'education' | 'certifications' | 'skills' | 'projects' | 'tools';

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
  const [saving, setSaving] = useState(false);
  
  const { success, error: showError } = useToast();

  // Helper to maintain compatibility
  const showToast = (type: 'success' | 'error', message: string) => {
    if (type === 'success') success('Success', message);
    else showError('Error', message);
  };

  // Data states
  const [profile, setProfile] = useState<Profile>({
    name: '',
    role: '',
    tagline: '',
    subtitle: '',
    location: 'India',
    years_experience: '4+',
    bio: '',
    about_intro: '',
    about_values: '',
    open_to_work: true,
    profile_photo_url: null,
  });
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [education, setEducation] = useState<Education[]>([]);

  // Auto-logout: 30 min inactivity, tab close, navigation
  useAutoLogout({
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
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


  // Load data on mount (auth is handled by middleware)
  useEffect(() => {
    const init = async () => {
      try {
        // Get session from server-side via API
        const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
        if (!response.ok) {
          window.location.href = '/admin';
          return;
        }
        const { user: serverUser, userId, accessToken, refreshToken } = await response.json();

        // Sync session to client-side Supabase for RLS
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }

        setUser(serverUser);
        await loadAllData(userId);
      } catch (err) {
        console.error('[DEBUG] Failed to initialize:', err);
        // Redirect to login on any auth error
        window.location.href = '/admin';
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Load all data
  const loadAllData = async (userId: string) => {
    // Normal Supabase loading
    try {
      const [profileRes, expRes, certRes, skillRes, projRes, toolsRes, eduRes] = await Promise.all([
        (supabase.from('profiles_draft' as any) as any).select('*').eq('user_id', userId).single(),
        (supabase.from('experiences_draft' as any) as any).select('*').eq('user_id', userId).order('sort_order'),
        (supabase.from('certifications_draft' as any) as any).select('*').eq('user_id', userId).order('sort_order'),
        (supabase.from('skills_draft' as any) as any).select('*').eq('user_id', userId).order('sort_order'),
        (supabase.from('projects_draft' as any) as any).select('*').eq('user_id', userId).order('sort_order'),
        (supabase.from('tools_draft' as any) as any).select('*').eq('user_id', userId).order('sort_order'),
        (supabase.from('education_draft' as any) as any).select('*').eq('user_id', userId).order('sort_order'),
      ]);

      if (profileRes.data) setProfile(profileRes.data as unknown as Profile);
      if (expRes.data) setExperiences(expRes.data as unknown as Experience[]);
      if (certRes.data) setCertifications(certRes.data as unknown as Certification[]);
      if (skillRes.data) setSkills(skillRes.data as unknown as Skill[]);
      if (projRes.data) setProjects(projRes.data as unknown as Project[]);
      if (toolsRes.data) setTools(toolsRes.data as unknown as Tool[]);
      if (eduRes.data) setEducation(eduRes.data as unknown as Education[]);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Failed to load data. Please refresh.');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.href = '/admin';
  };

  // Save profile
  const saveProfile = useCallback(async (options?: { silent?: boolean }) => {
    if (!user) return;
    if (!options?.silent) setSaving(true);

    try {
      const { error } = await apiCall('/api/admin/draft', {
        method: 'PUT',
        body: JSON.stringify({ table: 'profiles', data: profile }),
      });

      if (error) throw error;
      if (!options?.silent) showToast('success', 'Profile saved successfully!');
    } catch (error: any) {
      if (!options?.silent) showToast('error', error.message || 'Failed to save profile');
      else console.error('Auto-save profile error:', error);
    } finally {
      if (!options?.silent) setSaving(false);
    }
  }, [user, profile]); // Dependency on profile ensures new closure

  // Auto-save Profile
  const { isSaving: isSavingProfile } = useAutoSaveObject(
    profile, 
    () => saveProfile({ silent: true }), 
    1500
  );

  // Handle photo upload (via secure server-side endpoint)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;

    const file = e.target.files[0];

    // Client-side validation (server validates again)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (file.size > maxSize) {
      showToast('error', 'File too large. Maximum size is 5MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      showToast('error', 'Invalid file type. Allowed: JPG, PNG, WebP, GIF');
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'avatars');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Update profile with new URL
      setProfile({ ...profile, profile_photo_url: data.url });
      showToast('success', 'Photo uploaded successfully!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to upload photo');
    } finally {
      setSaving(false);
    }
  };

  // Add new experience
  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        company: '',
        role: '',
        period: '',
        type: 'Full-time',
        icon: 'briefcase',
        achievements: [],
        skills: [],
        is_current: false,
        sort_order: experiences.length,
        visible: true,
      },
    ]);
  };

  // Save experience
  const saveExperience = useCallback(async (exp: Experience, index: number, options?: { silent?: boolean }) => {
    if (!user) return;
    // Don't set global saving for list items in auto-save mode
    
    try {
      const { data: savedData, error } = await apiCall<{ data: Experience }>('/api/admin/draft', {
        method: 'PUT',
        body: JSON.stringify({ table: 'experiences', data: exp }),
      });

      if (error) throw error;

      // Only update state if it's a new item (to get ID)
      // For existing items, we keep local state to preserve cursor/focus/edits
      if (!exp.id && savedData?.data) {
        setExperiences((prev) => {
          const updated = [...prev];
          updated[index] = savedData.data; // Server data has ID
          return updated;
        });
      }

      if (!options?.silent) showToast('success', 'Experience saved!');
    } catch (error: any) {
      if (!options?.silent) showToast('error', error.message || 'Failed to save experience');
      else console.error('Auto-save experience error:', error);
    }
  }, [user]); 

  // Auto-save Experiences
  useAutoSaveList(experiences, (item, index) => saveExperience(item, index, { silent: true }), 1500);

  // Delete experience
  const deleteExperience = async (exp: Experience, index: number) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;

    setSaving(true);

    try {
      if (exp.id) {
        const { error } = await apiCall('/api/admin/draft', {
          method: 'DELETE',
          body: JSON.stringify({ table: 'experiences', id: exp.id }),
        });
        if (error) throw error;
      }

      setExperiences(experiences.filter((_, i) => i !== index));
      showToast('success', 'Experience deleted!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete experience');
    } finally {
      setSaving(false);
    }
  };

  // Add new skill
  const addSkill = (category: 'technical' | 'soft') => {
    setSkills([
      ...skills,
      {
        name: '',
        category,
        visible: true,
        sort_order: skills.filter(s => s.category === category).length,
      },
    ]);
  };

  // Save skill
  const saveSkill = async (skill: Skill, index: number) => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: apiData, error } = await apiCall<{ message: string; data: Skill }>('/api/admin/draft', {
        method: 'PUT',
        body: JSON.stringify({ table: 'skills', data: skill }),
      });

      if (error) throw error;
      const data = apiData?.data;
      
      if (!data) throw new Error('No data returned from API');

      const updated = [...skills];
      updated[index] = data;
      setSkills(updated);
      showToast('success', 'Skill saved!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save skill');
    } finally {
      setSaving(false);
    }
  };

  // Delete skill
  const deleteSkill = async (skill: Skill, index: number) => {
    if (!confirm('Delete this skill?')) return;

    setSaving(true);

    try {
      if (skill.id) {
        const { error } = await apiCall('/api/admin/draft', {
          method: 'DELETE',
          body: JSON.stringify({ table: 'skills', id: skill.id }),
        });
        if (error) throw error;
      }

      setSkills(skills.filter((_, i) => i !== index));
      showToast('success', 'Skill deleted!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete skill');
    } finally {
      setSaving(false);
    }
  };

  // Add new project
  const addProject = () => {
    setProjects([
      ...projects,
      {
        title: '',
        description: '',
        category: 'Project',
        icon: '📁',
        highlights: [''],
        impact: '',
        image_url: null,
        link: null,
        visible: true,
        sort_order: projects.length,
      },
    ]);
  };

  // Save project
  const saveProject = async (proj: Project, index: number) => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: apiData, error } = await apiCall<{ message: string; data: Project }>('/api/admin/draft', {
        method: 'PUT',
        body: JSON.stringify({ table: 'projects', data: proj }),
      });

      if (error) throw error;
      const data = apiData?.data;
      
      if (!data) throw new Error('No data returned from API');

      const updated = [...projects];
      updated[index] = data;
      setProjects(updated);
      showToast('success', 'Project saved!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  // Delete project
  const deleteProject = async (proj: Project, index: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    setSaving(true);

    try {
      if (proj.id) {
        const { error } = await apiCall('/api/admin/draft', {
          method: 'DELETE',
          body: JSON.stringify({ table: 'projects', id: proj.id }),
        });
        if (error) throw error;
      }

      setProjects(projects.filter((_, i) => i !== index));
      showToast('success', 'Project deleted!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete project');
    } finally {
      setSaving(false);
    }
  };

  // Add new certification
  const addCertification = () => {
    setCertifications([
      ...certifications,
      {
        name: '',
        icon: '📜',
        issuer: '',
        date: '',
        url: '',
        visible: true,
        sort_order: certifications.length,
      },
    ]);
  };

  // Save certification
  const saveCertification = async (cert: Certification, index: number) => {
    if (!user) return;
    setSaving(true);

    try {
      const { data: apiData, error } = await apiCall<{ message: string; data: Certification }>('/api/admin/draft', {
        method: 'PUT',
        body: JSON.stringify({ table: 'certifications', data: cert }),
      });

      if (error) throw error;
      const data = apiData?.data;
      
      if (!data) throw new Error('No data returned from API');

      const updated = [...certifications];
      updated[index] = data;
      setCertifications(updated);
      showToast('success', 'Certification saved!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save certification');
    } finally {
      setSaving(false);
    }
  };

  // Delete certification
  const deleteCertification = async (cert: Certification, index: number) => {
    if (!confirm('Delete this certification?')) return;

    setSaving(true);

    try {
      if (cert.id) {
        const { error } = await apiCall('/api/admin/draft', {
          method: 'DELETE',
          body: JSON.stringify({ table: 'certifications', id: cert.id }),
        });
        if (error) throw error;
      }

      setCertifications(certifications.filter((_, i) => i !== index));
      showToast('success', 'Certification deleted!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete certification');
    } finally {
      setSaving(false);
    }
  };

  // Add new tool
  const addTool = () => {
    setTools([
      ...tools,
      {
        name: '',
        category: '',
        description: '',
        icon: '🔧',
        visible: true,
        sort_order: tools.length,
      },
    ]);
  };

  // Save tool
  const saveTool = async (tool: Tool, index: number) => {
    if (!user) return;
    setSaving(true);

    try {
      const { data: apiData, error } = await apiCall<{ message: string; data: Tool }>('/api/admin/draft', {
        method: 'PUT',
        body: JSON.stringify({ table: 'tools', data: tool }),
      });

      if (error) throw error;
      const data = apiData?.data;
      
      if (!data) throw new Error('No data returned from API');

      const updated = [...tools];
      updated[index] = data;
      setTools(updated);
      showToast('success', 'Tool saved!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save tool');
    } finally {
      setSaving(false);
    }
  };

  // Delete tool
  const deleteTool = async (tool: Tool, index: number) => {
    if (!confirm('Delete this tool?')) return;

    setSaving(true);

    try {
      if (tool.id) {
        const { error } = await apiCall('/api/admin/draft', {
          method: 'DELETE',
          body: JSON.stringify({ table: 'tools', id: tool.id }),
        });
        if (error) throw error;
      }

      setTools(tools.filter((_, i) => i !== index));
      showToast('success', 'Tool deleted!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete tool');
    } finally {
      setSaving(false);
    }
  };


  // Add new education
  const addEducation = () => {
    setEducation([
      ...education,
      {
        degree: '',
        institution: '',
        field: '',
        year: '',
        visible: true,
        sort_order: education.length,
      },
    ]);
  };

  // Save education
  const saveEducation = async (edu: Education, index: number) => {
    if (!user) return;
    setSaving(true);

    try {
      const { data: apiData, error } = await apiCall<{ message: string; data: Education }>('/api/admin/draft', {
        method: 'PUT',
        body: JSON.stringify({ table: 'education', data: edu }),
      });

      if (error) throw error;
      const data = apiData?.data;
      
      if (!data) throw new Error('No data returned from API');

      const updated = [...education];
      updated[index] = data;
      setEducation(updated);
      showToast('success', 'Education saved!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save education');
    } finally {
      setSaving(false);
    }
  };

  // Delete education
  const deleteEducation = async (edu: Education, index: number) => {
    if (!confirm('Delete this education?')) return;

    setSaving(true);

    try {
      if (edu.id) {
        const { error } = await apiCall('/api/admin/draft', {
          method: 'DELETE',
          body: JSON.stringify({ table: 'education', id: edu.id }),
        });
        if (error) throw error;
      }

      setEducation(education.filter((_, i) => i !== index));
      showToast('success', 'Education deleted!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete education');
    } finally {
      setSaving(false);
    }
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
            <button
              onClick={async () => {
                if (!user) return;
                if (!confirm('This will wipe existing data and re-seed from static JSON. Continue?')) return;
                setLoading(true);
                const res = await migrateData(user.id);
                if (res.success) {
                  showToast('success', 'Migration complete! Reloading...');
                  window.location.reload();
                } else {
                  showToast('error', 'Migration failed. Check console.');
                  setLoading(false);
                }
              }}
              className="px-4 py-2 text-sm bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-lg hover:border-indigo-500/50 transition-all"
            >
              ⚡ Migrate Data
            </button>
            <button
              onClick={async () => {
                if (!confirm('This will publish ALL drafts to the live site. Continue?')) return;
                setSaving(true);
                const { error } = await apiCall('/api/admin/publish', { method: 'POST' });
                if (error) showToast('error', error.message || 'Publish failed');
                else showToast('success', 'Published successfully!');
                setSaving(false);
              }}
              disabled={saving}
              className="px-4 py-2 text-sm bg-green-500/20 text-green-400 hover:text-green-300 border border-green-500/30 rounded-lg hover:border-green-500/50 transition-all font-semibold"
            >
              rocket Publish Changes
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
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Profile</h2>
                  <button
                    onClick={() => saveProfile()}
                    disabled={saving}
                    className="btn-primary disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="glass-card p-6 space-y-6">
                  {/* Photo Upload */}
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-accent flex items-center justify-center overflow-hidden">
                      {profile.profile_photo_url ? (
                        <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-white">
                          {profile.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="btn-secondary cursor-pointer">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        Upload Photo
                      </label>
                      <p className="text-slate-500 text-sm mt-2">Recommended: 400x400px</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                      <input
                        type="text"
                        value={profile.role}
                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tagline</label>
                    <input
                      type="text"
                      value={profile.tagline}
                      onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Subtitle (Career Path)</label>
                    <input
                      type="text"
                      value={profile.subtitle}
                      onChange={(e) => setProfile({ ...profile, subtitle: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white"
                      placeholder="e.g., ERP Intern → Freelance IT → MNC Professional"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Years of Experience</label>
                      <input
                        type="text"
                        value={profile.years_experience}
                        onChange={(e) => setProfile({ ...profile, years_experience: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">About Intro</label>
                    <textarea
                      value={profile.about_intro}
                      onChange={(e) => setProfile({ ...profile, about_intro: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">About Values</label>
                    <textarea
                      value={profile.about_values}
                      onChange={(e) => setProfile({ ...profile, about_values: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white resize-none"
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.open_to_work}
                      onChange={(e) => setProfile({ ...profile, open_to_work: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent"
                    />
                    <span className="text-slate-300">Open to Work</span>
                  </label>
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Experience</h2>
                  <button onClick={addExperience} className="btn-primary">
                    + Add Experience
                  </button>
                </div>

                {experiences.map((exp, index) => (
                  <div key={exp.id || index} className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {exp.role || 'New Experience'}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveExperience(exp, index)}
                          disabled={saving}
                          className="px-3 py-1 text-sm bg-accent/20 text-accent rounded-lg hover:bg-accent/30"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => deleteExperience(exp, index)}
                          className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[index].company = e.target.value;
                            setExperiences(updated);
                          }}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[index].role = e.target.value;
                            setExperiences(updated);
                          }}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Period</label>
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[index].period = e.target.value;
                            setExperiences(updated);
                          }}
                          placeholder="2023 - Present"
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                        <select
                          value={exp.type}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[index].type = e.target.value;
                            setExperiences(updated);
                          }}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Freelance">Freelance</option>
                          <option value="Internship">Internship</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
                        <input
                          type="text"
                          value={exp.icon}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[index].icon = e.target.value;
                            setExperiences(updated);
                          }}
                          placeholder="💼"
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Achievements (one per line)
                      </label>
                      <textarea
                        value={exp.achievements.join('\n')}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[index].achievements = e.target.value.split('\n').filter(a => a.trim());
                          setExperiences(updated);
                        }}
                        rows={4}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        value={exp.skills.join(', ')}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[index].skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          setExperiences(updated);
                        }}
                        placeholder="React, Node.js, AWS"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                      />
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exp.is_current}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[index].is_current = e.target.checked;
                            setExperiences(updated);
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent"
                        />
                        <span className="text-slate-300 text-sm">Current Role</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exp.visible}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[index].visible = e.target.checked;
                            setExperiences(updated);
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent"
                        />
                        <span className="text-slate-300 text-sm">Visible</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Education</h2>
                  <button onClick={addEducation} className="btn-primary">
                    + Add Education
                  </button>
                </div>

                {education.map((edu, index) => (
                  <div key={edu.id || index} className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {edu.degree || 'New Education'}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEducation(edu, index)}
                          disabled={saving}
                          className="px-3 py-1 text-sm bg-accent/20 text-accent rounded-lg hover:bg-accent/30"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => deleteEducation(edu, index)}
                          className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[index].degree = e.target.value;
                            setEducation(updated);
                          }}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[index].institution = e.target.value;
                            setEducation(updated);
                          }}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Field of Study</label>
                        <input
                          type="text"
                          value={edu.field}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[index].field = e.target.value;
                            setEducation(updated);
                          }}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                        <input
                          type="text"
                          value={edu.year}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[index].year = e.target.value;
                            setEducation(updated);
                          }}
                          placeholder="2019 - 2023"
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={edu.visible}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[index].visible = e.target.checked;
                          setEducation(updated);
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent"
                      />
                      <span className="text-slate-300 text-sm">Visible</span>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications Tab */}
            {activeTab === 'certifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Certifications</h2>
                  <button onClick={addCertification} className="btn-primary">
                    + Add Certification
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {certifications.map((cert, index) => (
                    <div key={cert.id || index} className="glass-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{cert.icon}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveCertification(cert, index)}
                            className="p-1.5 bg-accent/20 text-accent rounded-lg"
                          >
                            💾
                          </button>
                          <button
                            onClick={() => deleteCertification(cert, index)}
                            className="p-1.5 bg-red-500/20 text-red-400 rounded-lg"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[index].name = e.target.value;
                          setCertifications(updated);
                        }}
                        placeholder="Certification Name"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cert.icon}
                          onChange={(e) => {
                            const updated = [...certifications];
                            updated[index].icon = e.target.value;
                            setCertifications(updated);
                          }}
                          placeholder="📜"
                          className="w-16 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm text-center"
                        />
                        <input
                          type="text"
                          value={cert.issuer || ''}
                          onChange={(e) => {
                            const updated = [...certifications];
                            updated[index].issuer = e.target.value;
                            setCertifications(updated);
                          }}
                          placeholder="Issuer"
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={cert.visible}
                          onChange={(e) => {
                            const updated = [...certifications];
                            updated[index].visible = e.target.checked;
                            setCertifications(updated);
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent"
                        />
                        <span className="text-slate-400 text-sm">Visible</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Skills</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Technical Skills */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Technical Skills</h3>
                      <button
                        onClick={() => addSkill('technical')}
                        className="text-sm text-accent hover:text-accent/80"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {skills.filter(s => s.category === 'technical').map((skill, index) => {
                        const globalIndex = skills.findIndex(s => s === skill);
                        return (
                          <div key={skill.id || index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) => {
                                const updated = [...skills];
                                updated[globalIndex].name = e.target.value;
                                setSkills(updated);
                              }}
                              placeholder="Skill name"
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                            />
                            <button
                              onClick={() => saveSkill(skill, globalIndex)}
                              className="p-2 bg-accent/20 text-accent rounded-lg"
                            >
                              💾
                            </button>
                            <button
                              onClick={() => deleteSkill(skill, globalIndex)}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg"
                            >
                              🗑️
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Soft Skills */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Soft Skills</h3>
                      <button
                        onClick={() => addSkill('soft')}
                        className="text-sm text-accent hover:text-accent/80"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {skills.filter(s => s.category === 'soft').map((skill, index) => {
                        const globalIndex = skills.findIndex(s => s === skill);
                        return (
                          <div key={skill.id || index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) => {
                                const updated = [...skills];
                                updated[globalIndex].name = e.target.value;
                                setSkills(updated);
                              }}
                              placeholder="Skill name"
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                            />
                            <button
                              onClick={() => saveSkill(skill, globalIndex)}
                              className="p-2 bg-accent/20 text-accent rounded-lg"
                            >
                              💾
                            </button>
                            <button
                              onClick={() => deleteSkill(skill, globalIndex)}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg"
                            >
                              🗑️
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Projects</h2>
                  <button onClick={addProject} className="btn-primary">
                    + Add Project
                  </button>
                </div>

                {projects.map((proj, index) => (
                  <div key={proj.id || index} className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {proj.title || 'New Project'}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveProject(proj, index)}
                          disabled={saving}
                          className="px-3 py-1 text-sm bg-accent/20 text-accent rounded-lg hover:bg-accent/30"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => deleteProject(proj, index)}
                          className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const updated = [...projects];
                            updated[index].title = e.target.value;
                            setProjects(updated);
                          }}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                          <input
                            type="text"
                            value={proj.category}
                            onChange={(e) => {
                              const updated = [...projects];
                              updated[index].category = e.target.value;
                              setProjects(updated);
                            }}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
                          <input
                            type="text"
                            value={proj.icon}
                            onChange={(e) => {
                              const updated = [...projects];
                              updated[index].icon = e.target.value;
                              setProjects(updated);
                            }}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                      <textarea
                        value={proj.description}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[index].description = e.target.value;
                          setProjects(updated);
                        }}
                        rows={2}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Impact</label>
                      <input
                        type="text"
                        value={proj.impact}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[index].impact = e.target.value;
                          setProjects(updated);
                        }}
                        placeholder="e.g., 30% faster response times"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Highlights (comma separated)
                      </label>
                      <input
                        type="text"
                        value={proj.highlights.join(', ')}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[index].highlights = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          setProjects(updated);
                        }}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent text-white"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={proj.visible}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[index].visible = e.target.checked;
                          setProjects(updated);
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent"
                      />
                      <span className="text-slate-300 text-sm">Visible</span>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* Tools Tab */}
            {activeTab === 'tools' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Tools & Applications</h2>
                  <button onClick={addTool} className="btn-primary">
                    + Add Tool
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {tools.map((tool, index) => (
                    <div key={tool.id || index} className="glass-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{tool.icon}</span>
                          <span className="text-white font-medium">{tool.name || 'New Tool'}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveTool(tool, index)}
                            className="p-1.5 bg-accent/20 text-accent rounded-lg hover:bg-accent/30"
                          >
                            💾
                          </button>
                          <button
                            onClick={() => deleteTool(tool, index)}
                            className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <input
                          type="text"
                          value={tool.name}
                          onChange={(e) => {
                            const updated = [...tools];
                            updated[index].name = e.target.value;
                            setTools(updated);
                          }}
                          placeholder="Tool name (e.g., Visual Studio Code)"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={tool.category}
                            onChange={(e) => {
                              const updated = [...tools];
                              updated[index].category = e.target.value;
                              setTools(updated);
                            }}
                            placeholder="Category (e.g., Development)"
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                          />
                          <div className="relative">
                            <input
                              type="text"
                              value={tool.icon}
                              onChange={(e) => {
                                const updated = [...tools];
                                updated[index].icon = e.target.value;
                                setTools(updated);
                              }}
                              placeholder="Icon URL (🪄 for auto)"
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent pr-8"
                            />
                            <button
                              onClick={() => {
                                if (!tool.name) return;
                                // In a real app, this would call an API
                                // For now, we'll just check if there's a name
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-lg hover:scale-110 transition-transform"
                              title="Auto-fetch icon"
                            >
                              🪄
                            </button>
                          </div>
                        </div>

                        <textarea
                          value={tool.description}
                          onChange={(e) => {
                            const updated = [...tools];
                            updated[index].description = e.target.value;
                            setTools(updated);
                          }}
                          placeholder="Description..."
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent resize-none h-20"
                        />
                        
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tool.visible}
                            onChange={(e) => {
                              const updated = [...tools];
                              updated[index].visible = e.target.checked;
                              setTools(updated);
                            }}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent"
                          />
                          <span className="text-slate-400 text-sm">Visible</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
