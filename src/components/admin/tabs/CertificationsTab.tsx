import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { apiCall } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import type { Certification } from '../../../lib/data';

interface CertificationsTabProps {
  user: User | null;
}

export function CertificationsTab({ user }: CertificationsTabProps) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('certifications_draft' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order');
        if (error) throw error;
        if (data) setCertifications(data as unknown as Certification[]);
      } catch (err) {
        console.error('Error loading certifications:', err);
        showError('Error', 'Failed to load certifications');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

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
      success('Success', 'Certification saved!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save certification');
    } finally {
      setSaving(false);
    }
  };

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
      success('Success', 'Certification deleted!');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete certification');
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
              value={cert.name || ''}
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
                value={cert.icon || ''}
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
  );
}
