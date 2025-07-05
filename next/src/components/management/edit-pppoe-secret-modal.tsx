'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditPppoeSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  secretToEdit: any | null;
}

const EditPppoeSecretModal = ({ isOpen, onClose, onSuccess, secretToEdit }: EditPppoeSecretModalProps) => {
  const [formData, setFormData] = useState({ password: '', profile: '' });
  const [profiles, setProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && secretToEdit) {
      setFormData({ password: '', profile: secretToEdit.profile });
      const fetchProfiles = async () => {
        try {
          const res = await fetch('http://localhost:9494/api/pppoe/profiles', { credentials: 'include' });
          if (!res.ok) throw new Error('Gagal memuat profil');
          const data = await res.json();
          setProfiles(data);
        } catch (err: any) { setError(err.message); }
      };
      fetchProfiles();
    }
  }, [isOpen, secretToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretToEdit) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:9494/api/pppoe/secrets/${secretToEdit['.id']}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal mengupdate secret");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!secretToEdit) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1001] p-4" onClick={onClose}>
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <header className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold flex items-center gap-2"><Edit/> Edit Secret: {secretToEdit.name}</h2><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X size={20} /></button></header>
              <div className="p-6 space-y-4">
                <div><label className="block text-sm font-medium mb-1 text-muted-foreground">Password Baru (kosongkan jika tidak diubah)</label><input type="password" name="password" onChange={handleChange} className="w-full p-2 rounded-md bg-input" /></div>
                <div><label className="block text-sm font-medium mb-1 text-muted-foreground">Profil Kecepatan</label><select name="profile" value={formData.profile} onChange={handleChange} className="w-full p-2 rounded-md bg-input" required>{profiles.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
              </div>
              <footer className="flex justify-end gap-4 p-4 bg-secondary/50"><Button type="button" variant="ghost" onClick={onClose}>Batal</Button><Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Simpan Perubahan</Button></footer>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default EditPppoeSecretModal;