'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

interface LoginOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  whatsappNumber: string;
}

const LoginOtpModal: React.FC<LoginOtpModalProps> = ({ isOpen, onClose, userId, whatsappNumber }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:9494/api/auth/login/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verifikasi gagal.');
      const userData = data.user ?? data;
      login(userData);
      onClose();
      router.push('/dashboard');
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1002] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-sm text-center border"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex justify-end p-2">
              <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
                <X size={20} />
              </button>
            </header>
            <div className="p-6 pt-0">
              <KeyRound className="mx-auto h-12 w-12 text-primary" />
              <h2 className="text-2xl font-bold mt-4">Verifikasi Login</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Kami telah mengirim kode OTP ke nomor WhatsApp Anda yang berakhiran di <strong>...{whatsappNumber.slice(-4)}</strong>.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="______"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-4 text-center text-3xl tracking-[1rem] font-mono rounded-lg bg-input border-transparent focus:ring-2 focus:ring-ring"
                  required
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Verifikasi & Masuk'}
                </Button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginOtpModal;
