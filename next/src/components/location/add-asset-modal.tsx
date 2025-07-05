'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddAssetModal = ({ isOpen, onClose, onSuccess }: AddAssetModalProps) => {
  const [formData, setFormData] = useState({ name: '', type: 'ODP', splitterCount: '', coords: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
        setFormData({ name: '', type: 'ODP', splitterCount: '', coords: '', description: '' });
        setError('');
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const [latitude, longitude] = formData.coords.split(',').map(s => parseFloat(s.trim()));
    const submissionData = { ...formData, latitude, longitude, splitter_count: parseInt(formData.splitterCount) || null };

    try {
      const res = await fetch('http://localhost:9494/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submissionData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menambah aset");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return ( <AnimatePresence>{isOpen && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1001] p-4" onClick={onClose}><motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-lg border" onClick={(e) => e.stopPropagation()}><form onSubmit={handleSubmit}><header className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold">Tambah Aset Baru</h2><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X size={20} /></button></header><div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"><div><label htmlFor="name" className="block text-sm font-medium mb-1">Nama Aset</label><input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="e.g., ODP-BTN-01" className="w-full p-2 rounded-md bg-input" required /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label htmlFor="type" className="block text-sm font-medium mb-1">Tipe Aset</label><select id="type" name="type" value={formData.type} onChange={handleChange} className="w-full p-2 rounded-md bg-input"><option value="ODP">ODP</option><option value="ODC">ODC</option><option value="JoinBox">JoinBox</option><option value="Server">Server</option></select></div>{(formData.type === 'ODP' || formData.type === 'ODC') && (<div><label htmlFor="splitterCount" className="block text-sm font-medium mb-1">Jml Splitter</label><input id="splitterCount" name="splitterCount" type="number" value={formData.splitterCount} onChange={handleChange} placeholder="e.g., 8" className="w-full p-2 rounded-md bg-input" /></div>)}</div><div><label htmlFor="coords" className="block text-sm font-medium mb-1">Koordinat</label><input id="coords" name="coords" type="text" value={formData.coords} onChange={handleChange} placeholder="e.g., -7.821, 112.013" className="w-full p-2 rounded-md bg-input" required /></div><div><label htmlFor="description" className="block text-sm font-medium mb-1">Deskripsi</label><textarea id="description" name="description" rows={2} value={formData.description} onChange={handleChange} placeholder="Keterangan tambahan..." className="w-full p-2 rounded-md bg-input"></textarea></div>{error && <p className="text-sm text-center text-destructive">{error}</p>}</div><footer className="flex justify-end gap-4 p-4 bg-secondary/50"><Button type="button" variant="ghost" onClick={onClose}>Batal</Button><Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null} Simpan Aset</Button></footer></form></motion.div></motion.div>)}</AnimatePresence>);
};
export default AddAssetModal;