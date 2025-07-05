'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GenerateCloneCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GenerateCloneCodeModal = ({ isOpen, onClose }: GenerateCloneCodeModalProps) => {
    const [code, setCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setCode(newCode);
        setCopied(false);
    };

    const handleCopy = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const handleClose = () => {
        setCode(null);
        setCopied(false);
        onClose();
    }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1001] p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md border border-border text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2"><Share2/> Bagikan Konfigurasi</h2>
              <button type="button" onClick={handleClose} className="p-1 rounded-full hover:bg-secondary"><X size={20} /></button>
            </header>

            <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                    Buat kode unik untuk membagikan seluruh konfigurasi Anda. Kode ini hanya berlaku selama 10 menit.
                </p>

                {code ? (
                    <div className="mt-4 p-4 border-dashed border-2 border-border rounded-lg">
                        <p className="text-sm">Berikan kode ini ke teman Anda:</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <p className="text-4xl font-mono font-bold tracking-widest text-primary">{code}</p>
                            <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-secondary" title="Salin Kode">
                                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>
                ) : (
                     <Button onClick={handleGenerate} className="w-full mt-4">Buat Kode Baru</Button>
                )}
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GenerateCloneCodeModal;