import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { apiCall } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import type { Education } from '../../../lib/data';

interface EducationTabProps {
  user: User | null;
}

export function EducationTab({ user }: EducationTabProps) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [education, setEducation] = useState<Education[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('education_draft' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order');
        if (error) throw error;
        if (data) setEducation(data as unknown as Education[]);
      } catch (err) {
        console.error('Error loading education:', err);
        showError('Error', 'Failed to load education');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

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
      success('Success', 'Education saved!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save education');
    } finally {
      setSaving(false);
    }
  };

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
      success('Success', 'Education deleted!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete education');
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
                value={edu.degree || ''}
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
                value={edu.institution || ''}
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
                value={edu.field || ''}
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
                value={edu.year || ''}
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
  );
}
