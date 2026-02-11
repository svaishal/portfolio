import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { apiCall } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import type { Skill } from '../../../lib/data';

interface SkillsTabProps {
  user: User | null;
}

export function SkillsTab({ user }: SkillsTabProps) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('skills_draft' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order');
        if (error) throw error;
        if (data) setSkills(data as unknown as Skill[]);
      } catch (err) {
        console.error('Error loading skills:', err);
        showError('Error', 'Failed to load skills');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

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
      success('Success', 'Skill saved!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save skill');
    } finally {
      setSaving(false);
    }
  };

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
      success('Success', 'Skill deleted!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete skill');
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
            {skills.filter(s => s.category === 'technical').map((skill) => {
              const globalIndex = skills.findIndex(s => s === skill);
              return (
                <div key={skill.id || globalIndex} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={skill.name || ''}
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
            {skills.filter(s => s.category === 'soft').map((skill) => {
              const globalIndex = skills.findIndex(s => s === skill);
              return (
                <div key={skill.id || globalIndex} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={skill.name || ''}
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
  );
}
