'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, Server, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';

export interface Device {
  id?: number;
  name: string;
  host: string;
  port: number;
  user: string;
  password?: string;
}

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deviceToEdit?: Device | null;
}

const DeviceModal = ({ isOpen, onClose, onSuccess, deviceToEdit }: DeviceModalProps) => {
  const { user: authUser } = useAuth();
  const isEditMode = !!deviceToEdit;
  const [formData, setFormData] = useState({
    name: '', host: '', user: '', password: '', port: 8728
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (isEditMode && deviceToEdit) {
        setFormData({
          name: deviceToEdit.name,
          host: deviceToEdit.host,
          user: deviceToEdit.user,
          port: deviceToEdit.port,
          password: '',
        });
      } else {
        setFormData({ name: '', host: '', user: '', password: '', port: 8728 });
      }
    }
  }, [isOpen, deviceToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.workspace_id) {
        setError("Error: Workspace ID tidak ditemukan. Silakan login ulang.");
        return;
    }
    setLoading(true);
    setError('');

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = isEditMode
        ? `${apiUrl}/api/devices/${deviceToEdit?.id}`
        : `${apiUrl}/api/devices`;
    
    const method = isEditMode ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Operasi gagal.");
        
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
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1001] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-lg border"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <header className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Server /> {isEditMode ? 'Edit Perangkat' : 'Tambah Perangkat Baru'}
                </h2>
                <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X size={20} /></button>
              </header>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Nama Perangkat</label>
                  <input type="text" name="name" placeholder="e.g., Router Kantor Pusat" value={formData.name} onChange={handleChange} className="w-full p-2 rounded-md bg-input" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">Host / IP Address</label>
                    <input type="text" name="host" placeholder="e.g., 192.168.88.1" value={formData.host} onChange={handleChange} className="w-full p-2 rounded-md bg-input" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">Port API</label>
                    <input type="number" name="port" value={formData.port} onChange={handleChange} className="w-full p-2 rounded-md bg-input" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-muted-foreground">Username API</label>
                        <input type="text" name="user" placeholder="e.g., admin" value={formData.user} onChange={handleChange} autoComplete='off' className="w-full p-2 rounded-md bg-input" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-muted-foreground">Password API</label>
                        <input type="password" name="password" placeholder={isEditMode ? 'Isi untuk mengubah' : 'Password'} onChange={handleChange} autoComplete="new-password" className="w-full p-2 rounded-md bg-input" />
                    </div>
                </div>
                {error && <p className="text-sm text-center text-destructive">{error}</p>}
              </div>

              <footer className="flex justify-end gap-4 p-4 bg-secondary/50 rounded-b-2xl">
                <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="animate-spin h-4 w-4 mr-2"/>}
                    {isEditMode ? 'Simpan Perubahan' : 'Tambah Perangkat'}
                </Button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeviceModal;