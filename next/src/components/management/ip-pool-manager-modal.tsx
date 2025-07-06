'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, Save, Trash2, Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IpPool {
  id: number;
  profile_name: string;
  ip_start: string;
  ip_end: string;
  gateway: string;
}

interface IpPoolManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IpPoolManagerModal = ({ isOpen, onClose }: IpPoolManagerModalProps) => {
  const [pools, setPools] = useState<IpPool[]>([]);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [formData, setFormData] = useState({ profile_name: '', gateway: '', ip_start: '', ip_end: '' });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [poolsRes, profilesRes] = await Promise.all([
        fetch(`${apiUrl}/api/ip-pools`, { credentials: 'include' }),
        fetch(`${apiUrl}/api/pppoe/profiles`, { credentials: 'include' })
      ]);
      if (!poolsRes.ok || !profilesRes.ok) throw new Error("Gagal memuat data.");
      const poolsData = await poolsRes.json();
      const profilesData = await profilesRes.json();
      setPools(poolsData);
      setProfiles(profilesData);
      if (profilesData.length > 0 && !formData.profile_name) {
        setFormData(prev => ({ ...prev, profile_name: profilesData[0] }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/ip-pools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (poolId: number) => {
    if (!window.confirm("Yakin ingin menghapus aturan IP Pool ini?")) return;
    setLoading(true);
    try {
        await fetch(`${apiUrl}/api/ip-pools/${poolId}`, { method: 'DELETE', credentials: 'include' });
        fetchData();
    } catch (err) {
        setError("Gagal menghapus pool.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1001] p-4" onClick={onClose}>
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-2xl border flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <header className="flex-shrink-0 flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold flex items-center gap-2"><Database/> Manajer IP Pool</h2><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X size={20} /></button></header>
            <div className="flex-grow p-6 space-y-4 overflow-y-auto">
                <h3 className="font-semibold text-muted-foreground">Aturan Aktif</h3>
                {loading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin"/></div> : pools.length > 0 ? <div className="space-y-2">{pools.map(pool => (<div key={pool.id} className="text-sm p-3 bg-secondary rounded-lg flex justify-between items-center"><div><p className="font-bold text-primary">{pool.profile_name}</p><p className="text-xs font-mono text-muted-foreground">Range: {pool.ip_start} - {pool.ip_end}</p><p className="text-xs font-mono text-muted-foreground">Gateway: {pool.gateway}</p></div><Button onClick={() => handleDelete(pool.id)} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 size={16}/></Button></div>))}</div> : <p className="text-center text-muted-foreground text-sm">Belum ada aturan IP Pool yang dibuat.</p>}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="flex-shrink-0 p-6 border-t space-y-4 bg-background">
                  <h3 className="font-semibold">Tambah/Update Aturan Baru</h3>
                  {error && <p className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">{error}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium">Profil PPPoE</label><select name="profile_name" value={formData.profile_name} onChange={handleChange} className="w-full p-2 mt-1 rounded-md bg-input" required>{profiles.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                      <div><label className="text-sm font-medium">Gateway (Local)</label><input name="gateway" value={formData.gateway} onChange={handleChange} type="text" placeholder="e.g., 10.10.10.1" className="w-full p-2 mt-1 rounded-md bg-input" required /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="text-sm font-medium">IP Start (Remote)</label><input name="ip_start" value={formData.ip_start} onChange={handleChange} type="text" placeholder="e.g., 10.10.10.2" className="w-full p-2 mt-1 rounded-md bg-input" required /></div>
                      <div><label className="text-sm font-medium">IP End (Remote)</label><input name="ip_end" value={formData.ip_end} onChange={handleChange} type="text" placeholder="e.g., 10.10.10.254" className="w-full p-2 mt-1 rounded-md bg-input" required /></div>
                  </div>
                  <div className="flex justify-end"><Button type="submit" className="flex items-center gap-2" disabled={loading}>{loading && <Loader2 className="animate-spin h-4 w-4 mr-2"/>}<Save size={16} /> Simpan Aturan</Button></div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default IpPoolManagerModal;