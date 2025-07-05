'use client';

import React, { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DeleteAccountModal from './delete-account-modal';
import { useAuth } from '../providers/auth-provider';

const DangerZoneCard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { logout } = useAuth();

    const handleConfirmDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:9494/api/user', {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Gagal menghapus akun.');
            
            alert('Akun Anda telah berhasil dihapus.');
            await logout();

        } catch (error) {
            alert('Terjadi kesalahan saat mencoba menghapus akun.');
            setLoading(false);
        }
    };

    return (
        <>
            <Card className="border-red-500/50 bg-red-900/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500">
                    <ShieldAlert /> Zona Berbahaya
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm mb-4 text-muted-foreground">
                    Aksi di bawah ini bersifat permanen dan tidak dapat diurungkan.
                    </p>
                    <Button variant="destructive" onClick={() => setIsModalOpen(true)} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Hapus Akun Saya
                    </Button>
                </CardContent>
            </Card>

            <DeleteAccountModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmDelete}
            />
        </>
    );
};

export default DangerZoneCard;