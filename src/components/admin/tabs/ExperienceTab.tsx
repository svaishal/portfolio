import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { apiCall } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import { useAutoSaveList } from '../../../hooks/useAutoSave';
import type { Experience } from '../../../lib/data';

interface ExperienceTabProps {
  user: User | null;
}

export function ExperienceTab({ user }: ExperienceTabProps) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Load data
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('experiences_draft' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order');
          
        if (error) throw error;
        if (data) setExperiences(data as unknown as Experience[]);
      } catch (err) {
        console.error('Error loading experiences:', err);
        showError('Error', 'Failed to load experiences');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

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
    
    try {
      const { data: savedData, error } = await apiCall<{ data: Experience }>('/api/admin/draft', {
        method: 'PUT',
        body: JSON.stringify({ table: 'experiences', data: exp }),
      });

      if (error) throw error;

      // Update ID if new
      if (!exp.id && savedData?.data) {
        setExperiences((prev) => {
          const updated = [...prev];
          updated[index] = savedData.data;
          return updated;
        });
      }

      if (!options?.silent) success('Success', 'Experience saved!');
    } catch (error: any) {
      if (!options?.silent) showError('Error', error.message || 'Failed to save experience');
      else console.error('Auto-save experience error:', error);
    }
  }, [user, success, showError]); 

  // Auto-save
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
      success('Success', 'Experience deleted!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete experience');
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
                value={exp.company || ''}
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
                value={exp.role || ''}
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
                value={exp.period || ''}
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
                value={exp.type || 'Full-time'}
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
                value={exp.icon || ''}
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
              value={exp.achievements ? exp.achievements.join('\n') : ''}
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
              value={exp.skills ? exp.skills.join(', ') : ''}
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
  );
}
