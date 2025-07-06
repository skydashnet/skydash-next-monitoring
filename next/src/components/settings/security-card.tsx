'use client';

import React, { useState } from 'react';
import { KeyRound, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SecurityCard = () => {
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            const res = await fetch(`${apiUrl}/api/user/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(passwordData)
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            setSuccess("Password berhasil diubah!");
            setPasswordData({ oldPassword: '', newPassword: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

  return (
    <Card>
      <CardHeader><CardTitle>Keamanan</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Password Lama</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handleChange} placeholder="••••••••" className="w-full p-2 pl-10 rounded-md bg-input border-border" required/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Password Baru</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handleChange} placeholder="Minimal 6 karakter" className="w-full p-2 pl-10 rounded-md bg-input border-border" required/>
                </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}
            <div className="text-right">
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Ganti Password</Button>
            </div>
        </form>
      </CardContent>
    </Card>
  );
};
export default SecurityCard;