'use client';

import React, { useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../providers/auth-provider';

const JoinWorkspaceCard = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { checkLoggedIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            const res = await fetch(`${apiUrl}/api/clone/use-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal menggunakan kode.');
            }
            
            setSuccess('Berhasil bergabung dengan workspace! Halaman akan dimuat ulang...');
            setTimeout(() => {
                checkLoggedIn();
                window.location.reload();
            }, 2000);

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users /> Gabung ke Workspace Lain
                </CardTitle>
                <CardDescription>
                    Punya kode undangan dari teman? Masukkan di sini untuk bergabung dengan workspace mereka.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex items-center gap-4">
                    <Input
                        type="text"
                        placeholder="Masukkan Kode Undangan"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="font-mono tracking-widest"
                        required
                    />
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gabung
                    </Button>
                </form>
                {error && <p className="text-sm text-destructive mt-3">{error}</p>}
                {success && <p className="text-sm text-green-500 mt-3">{success}</p>}
            </CardContent>
        </Card>
    );
};

export default JoinWorkspaceCard;