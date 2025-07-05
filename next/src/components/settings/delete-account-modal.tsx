'use client';

import React from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteAccountModal = ({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) => {
  
  const handleConfirm = () => {
    onConfirm();
    onClose();
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
            className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md border border-destructive"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2 text-destructive">
                <ShieldAlert /> Konfirmasi Penghapusan
              </h2>
              <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X size={20} /></button>
            </header>

            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Ini adalah aksi yang **tidak bisa dibatalkan**. Semua data Anda, termasuk konfigurasi, aset, dan riwayat, akan dihapus secara permanen.
              </p>
              <p className="font-semibold">Anda yakin ingin melanjutkan?</p>
            </div>

            <footer className="flex justify-end gap-4 p-4 bg-secondary/50 rounded-b-2xl">
              <Button type="button" onClick={onClose}>Batal</Button>
              <Button type="button" variant="destructive" onClick={handleConfirm}>
                Ya, Hapus Akun Saya
              </Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteAccountModal;