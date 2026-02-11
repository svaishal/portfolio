import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { apiCall } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import { useAutoSaveObject } from '../../../hooks/useAutoSave';
import type { Profile } from '../../../lib/data';

interface ProfileTabProps {
  user: User | null;
}

export function ProfileTab({ user }: ProfileTabProps) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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

  // Load data
  useEffect(() => {
    if (!user) return;
    
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles_draft' as any)
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        if (data) setProfile(data as unknown as Profile);
      } catch (err) {
        console.error('Error loading profile:', err);
        showError('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

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
      if (!options?.silent) success('Success', 'Profile saved successfully!');
    } catch (error: any) {
      if (!options?.silent) showError('Error', error.message || 'Failed to save profile');
      else console.error('Auto-save profile error:', error);
    } finally {
      if (!options?.silent) setSaving(false);
    }
  }, [user, profile]);

  // Auto-save
  useAutoSaveObject(
    profile, 
    () => saveProfile({ silent: true }), 
    1500
  );

  // Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (file.size > maxSize) {
      showError('Error', 'File too large. Maximum size is 5MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      showError('Error', 'Invalid file type. Allowed: JPG, PNG, WebP, GIF');
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

      setProfile({ ...profile, profile_photo_url: data.url });
      success('Success', 'Photo uploaded successfully!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to upload photo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
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
                {profile.name ? profile.name.split(' ').map(n => n[0]).join('') : 'U'}
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
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
            <input
              type="text"
              value={profile.role || ''}
              onChange={(e) => setProfile({ ...profile, role: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Tagline</label>
          <input
            type="text"
            value={profile.tagline || ''}
            onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Subtitle (Career Path)</label>
          <input
            type="text"
            value={profile.subtitle || ''}
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
              value={profile.location || ''}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Years of Experience</label>
            <input
              type="text"
              value={profile.years_experience || ''}
              onChange={(e) => setProfile({ ...profile, years_experience: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
          <textarea
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">About Intro</label>
          <textarea
            value={profile.about_intro || ''}
            onChange={(e) => setProfile({ ...profile, about_intro: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">About Values</label>
          <textarea
            value={profile.about_values || ''}
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
  );
}
