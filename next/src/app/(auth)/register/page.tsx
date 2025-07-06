'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserPlus, User, KeyRound, MessageSquare, BadgeInfo, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OtpVerificationModal from '@/components/auth/otp-verification-modal';

const RegisterPage = () => {
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [whatsappForOtp, setWhatsappForOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    if (data.password !== data.confirmPassword) {
        setError("Konfirmasi password tidak cocok.");
        setLoading(false);
        return;
    }

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(`${apiUrl}/api/register/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message);
        
        setWhatsappForOtp(data.whatsappNumber as string);
        setIsOtpModalOpen(true);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen w-full flex bg-background">
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-green-500 to-teal-500 p-12 text-white">
          <div className="text-center">
              <h1 className="text-6xl font-black tracking-wider">JOIN US</h1>
              <p className="text-xl tracking-widest opacity-80">CREATE YOUR ACCOUNT</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-4xl font-bold">Buat Akun Baru</h1>
              <p className="text-muted-foreground mt-2">Isi data diri untuk memulai.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input name="username" type="text" placeholder="Username (untuk login)" className="w-full p-3 pl-10 rounded-lg bg-input" required /></div>
              <div className="relative"><BadgeInfo className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input name="displayName" type="text" placeholder="Nama Display" className="w-full p-3 pl-10 rounded-lg bg-input" required /></div>
              <div className="relative"><MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input name="whatsappNumber" type="text" placeholder="Nomor WhatsApp (628...)" className="w-full p-3 pl-10 rounded-lg bg-input" required /></div>
              <div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input name="password" type="password" placeholder="Password" className="w-full p-3 pl-10 rounded-lg bg-input" required /></div>
              <div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input name="confirmPassword" type="password" placeholder="Konfirmasi Password" className="w-full p-3 pl-10 rounded-lg bg-input" required /></div>
              
              {error && <p className="text-sm text-center text-destructive">{error}</p>}
              
              <Button type="submit" className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
                <span>Daftar & Kirim OTP</span>
              </Button>
            </form>

            <p className="text-center mt-6 text-sm text-muted-foreground">
              Sudah punya akun? <Link href="/login" className="font-semibold text-primary hover:underline">Login di sini</Link>
            </p>
          </div>
        </div>
      </div>

      <OtpVerificationModal isOpen={isOtpModalOpen} onClose={() => setIsOtpModalOpen(false)} whatsappNumber={whatsappForOtp} />
    </>
  );
};

export default RegisterPage;