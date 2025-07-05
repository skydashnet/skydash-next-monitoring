'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Asset } from './asset-list';

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset | null;
}

interface PppoeSecret {
  name: string;
}

const AddConnectionModal = ({ isOpen, onClose, onSuccess, asset }: AddConnectionModalProps) => {
  const [secrets, setSecrets] = useState<PppoeSecret[]>([]);
  const [selectedSecret, setSelectedSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError('');
      fetch('http://localhost:9494/api/assets/unconnected-pppoe-users', { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Gagal memuat daftar user.');
          return res.json();
        })
        .then(data => {
          setSecrets(data);
          if (data.length > 0) {
            setSelectedSecret(data[0].name);
          } else {
            setError("Semua user aktif sudah terhubung ke ODP.");
          }
        })
        .catch(() => setError("Gagal memuat daftar user PPPoE."))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !selectedSecret) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`http://localhost:9494/api/assets/${asset.id}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pppoe_secret_name: selectedSecret })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menambah koneksi.");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1002] p-4" onClick={onClose}>
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring' }} className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md border" onClick={e => e.stopPropagation()}>
          <form onSubmit={handleSubmit}>
            <header className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2"><PlusCircle /> Tambah Koneksi</h2>
              <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X size={20} /></button>
            </header>
            <div className="p-6 space-y-4">
              <p className="text-sm">Hubungkan pengguna PPPoE ke ODP <strong className="text-primary">{asset?.name}</strong>.</p>
              <div>
                <label className="block text-sm font-medium mb-1">Pengguna PPPoE</label>
                <select 
                  value={selectedSecret} 
                  onChange={(e) => setSelectedSecret(e.target.value)} 
                  className="w-full p-2 rounded-md bg-input"
                  disabled={loading || secrets.length === 0}
                >
                  {loading && <option>Memuat...</option>}
                  {secrets.length > 0 && secrets.map(secret => <option key={secret.name} value={secret.name}>{secret.name}</option>)}
                </select>
              </div>
               {error && <p className="text-sm text-center text-destructive p-3 bg-destructive/10 rounded-md">{error}</p>}
            </div>
            <footer className="flex justify-end gap-4 p-4 bg-secondary/50">
              <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
              <Button type="submit" disabled={loading || secrets.length === 0 || !!error}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Simpan Koneksi
              </Button>
            </footer>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddConnectionModal;