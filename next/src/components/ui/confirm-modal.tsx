'use client';

import React from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isLoading?: boolean;
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, confirmText = "Konfirmasi", isLoading = false }: ConfirmModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1002] p-4" onClick={onClose}>
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-destructive" onClick={(e) => e.stopPropagation()}>
            <header className="p-6">
                <h2 className="text-xl font-bold flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-destructive" /> 
                    {title}
                </h2>
            </header>
            <div className="px-6 pb-6">
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <footer className="flex justify-end gap-4 p-4 bg-secondary/50 rounded-b-2xl">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Batal</Button>
              <Button type="button" variant="destructive" onClick={onConfirm} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {confirmText}
              </Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;