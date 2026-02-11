import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { apiCall } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import type { Learning } from '../../../lib/data';

interface LearningTabProps {
  user: User | null;
}

export function LearningTab({ user }: LearningTabProps) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [learning, setLearning] = useState<Learning[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('learning_draft' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order');
        if (error) throw error;
        if (data) setLearning(data as unknown as Learning[]);
      } catch (err) {
        console.error('Error loading learning:', err);
        showError('Error', 'Failed to load learning topics');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const addLearning = () => {
    setLearning([
      ...learning,
      {
        name: '',
        description: '',
        status: 'in-progress',
        visible: true,
        sort_order: learning.length,
      },
    ]);
  };

  const saveLearning = async (item: Learning, index: number) => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: apiData, error } = await apiCall<{ message: string; data: Learning }>('/api/admin/draft', {
        method: 'PUT',
        body: JSON.stringify({ table: 'learning', data: item }),
      });

      if (error) throw error;
      const data = apiData?.data;
      if (!data) throw new Error('No data returned from API');

      const updated = [...learning];
      updated[index] = data;
      setLearning(updated);
      success('Success', 'Learning topic saved!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save learning topic');
    } finally {
      setSaving(false);
    }
  };

  const deleteLearning = async (item: Learning, index: number) => {
    if (!confirm('Delete this learning topic?')) return;
    setSaving(true);
    try {
      if (item.id) {
        const { error } = await apiCall('/api/admin/draft', {
          method: 'DELETE',
          body: JSON.stringify({ table: 'learning', id: item.id }),
        });
        if (error) throw error;
      }
      setLearning(learning.filter((_, i) => i !== index));
      success('Success', 'Learning topic deleted!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete learning topic');
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
        <h2 className="text-2xl font-bold text-white">Currently Learning</h2>
        <button onClick={addLearning} className="btn-primary">
          + Add Topic
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {learning.map((item, index) => (
          <div key={item.id || index} className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{item.name || 'New Topic'}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => saveLearning(item, index)}
                  className="px-3 py-1 text-xs bg-accent/20 text-accent rounded-lg hover:bg-accent/30"
                >
                  Save
                </button>
                <button
                  onClick={() => deleteLearning(item, index)}
                  className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>

            <input
              type="text"
              value={item.name || ''}
              onChange={(e) => {
                const updated = [...learning];
                updated[index].name = e.target.value;
                setLearning(updated);
              }}
              placeholder="Topic name (e.g., Prompt Engineering)"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent"
            />

            <textarea
              value={item.description || ''}
              onChange={(e) => {
                const updated = [...learning];
                updated[index].description = e.target.value;
                setLearning(updated);
              }}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent resize-none h-16"
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.visible}
                onChange={(e) => {
                  const updated = [...learning];
                  updated[index].visible = e.target.checked;
                  setLearning(updated);
                }}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent"
              />
              <span className="text-slate-400 text-sm">Visible</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
