import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { apiCall } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import type { Project } from '../../../lib/data';

interface ProjectsTabProps {
  user: User | null;
}

export function ProjectsTab({ user }: ProjectsTabProps) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('projects_draft' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order');
        if (error) throw error;
        if (data) setProjects(data as unknown as Project[]);
      } catch (err) {
        console.error('Error loading projects:', err);
        showError('Error', 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

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
      success('Success', 'Project saved!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

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
      success('Success', 'Project deleted!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete project');
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
                value={proj.title || ''}
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
                  value={proj.category || ''}
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
                  value={proj.icon || ''}
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
              value={proj.description || ''}
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
              value={proj.impact || ''}
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
              value={proj.highlights ? proj.highlights.join(', ') : ''}
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
  );
}
