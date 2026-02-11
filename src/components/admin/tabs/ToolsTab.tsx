import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { apiCall } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import type { Tool } from '../../../lib/data';

interface ToolsTabProps {
  user: User | null;
}

export function ToolsTab({ user }: ToolsTabProps) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('tools_draft' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order');
        if (error) throw error;
        if (data) setTools(data as unknown as Tool[]);
      } catch (err) {
        console.error('Error loading tools:', err);
        showError('Error', 'Failed to load tools');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

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
      success('Success', 'Tool saved!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save tool');
    } finally {
      setSaving(false);
    }
  };

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
      success('Success', 'Tool deleted!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete tool');
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
                value={tool.name || ''}
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
                  value={tool.category || ''}
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
                    value={tool.icon || ''}
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
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-lg hover:scale-110 transition-transform"
                    title="Auto-fetch icon"
                  >
                    🪄
                  </button>
                </div>
              </div>

              <textarea
                value={tool.description || ''}
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
  );
}
