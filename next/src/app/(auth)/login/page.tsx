'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LogIn, User, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginOtpModal from '@/components/auth/login-otp-modal';

const LoginPage = () => {
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [loginPayload, setLoginPayload] = useState<{
    userId: number | null;
    whatsappNumber: string;
    error: string;
  }>({ userId: null, whatsappNumber: '', error: '' });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setLoginPayload({ userId: null, whatsappNumber: '', error: '' });
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('http://localhost:9494/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message);
      
      setLoginPayload({ 
        userId: resData.userId, 
        whatsappNumber: resData.whatsappNumber,
        error: '' 
      });
      setIsOtpModalOpen(true);
    } catch (err: any) {
      setLoginPayload({ userId: null, whatsappNumber: '', error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <div className="min-h-screen w-full flex bg-background">
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-12 text-white">
            <div className="text-center">
              <h1 className="text-6xl font-black tracking-wider">SKYDASH</h1>
              <p className="text-xl tracking-[0.3em] opacity-80">.NET</p>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-sm">
              <div className="mb-8">
                <h1 className="text-4xl font-bold">Selamat Datang</h1>
                <p className="text-muted-foreground mt-2">Masuk untuk melanjutkan.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input name="username" type="text" placeholder="Username" className="w-full p-3 pl-10 rounded-lg bg-input" required />
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input name="password" type="password" placeholder="Password" className="w-full p-3 pl-10 rounded-lg bg-input" required />
                </div>
                
                {loginPayload.error && <p className="text-sm text-center text-destructive">{loginPayload.error}</p>}
                
                <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
                  <span>Masuk</span>
                </Button>
              </form>

              <p className="text-center mt-6 text-sm text-muted-foreground">
                Belum punya akun?{' '}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Daftar di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {loginPayload.userId && (
            <LoginOtpModal 
                isOpen={isOtpModalOpen} 
                onClose={() => setIsOtpModalOpen(false)} 
                userId={loginPayload.userId}
                whatsappNumber={loginPayload.whatsappNumber}
            />
        )}
    </>
  );
};
export default LoginPage;
