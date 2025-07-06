'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddHotspotUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddHotspotUserModal = ({ isOpen, onClose, onSuccess }: AddHotspotUserModalProps) => {
  const [formData, setFormData] = useState({ name: '', password: '', profile: '', timeLimit: '' });
  const [profiles, setProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError('');
      setFormData({ name: '', password: '', profile: '', timeLimit: '' });

      const fetchProfiles = async () => {
        try {
          const res = await fetch(`${apiUrl}/api/hotspot/profiles`, { credentials: 'include' });
          if (!res.ok) throw new Error("Gagal memuat profil hotspot.");
          const data = await res.json();
          setProfiles(data);
          if (data.length > 0) {
            setFormData(prev => ({...prev, profile: data[0]}));
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchProfiles();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/hotspot/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menambah user hotspot.");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1001] p-4" onClick={onClose}>
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md border" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <header className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold flex items-center gap-2"><UserPlus /> Tambah User Hotspot</h2><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X size={20} /></button></header>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Username</label><input name="name" type="text" onChange={handleChange} placeholder="e.g., user_baru" className="w-full p-2 rounded-md bg-input" required /></div>
                    <div><label className="block text-sm font-medium mb-1">Password</label><input name="password" type="text" onChange={handleChange} placeholder="e.g., pass123" className="w-full p-2 rounded-md bg-input" required /></div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Profil Hotspot</label>
                    <select name="profile" value={formData.profile} onChange={handleChange} className="w-full p-2 rounded-md bg-input" required>
                      {loading ? <option>Memuat profil...</option> : profiles.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Batas Waktu (Opsional)</label><input name="timeLimit" type="text" onChange={handleChange} placeholder="e.g., 30d, 12h, 1h30m" className="w-full p-2 rounded-md bg-input" /></div>
                {error && <p className="text-sm text-center text-destructive">{error}</p>}
              </div>
              <footer className="flex justify-end gap-4 p-4 bg-secondary/50"><Button type="button" variant="ghost" onClick={onClose}>Batal</Button><Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null} Simpan User</Button></footer>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default AddHotspotUserModal;