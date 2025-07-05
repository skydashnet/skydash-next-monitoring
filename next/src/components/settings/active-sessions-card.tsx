'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, LogOut, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ConfirmModal from '../ui/confirm-modal';

interface Session {
    id: string;
    browser: string;
    os: string;
    ip_address: string;
    last_seen: string;
    isCurrentSession: boolean;
}

const getDeviceIcon = (os: string) => {
    const lowerOs = os.toLowerCase();
    if (lowerOs.includes('windows') || lowerOs.includes('mac') || lowerOs.includes('linux')) {
        return <Monitor className="text-muted-foreground"/>;
    }
    return <Smartphone className="text-muted-foreground"/>;
};

const ActiveSessionsCard = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionToLogout, setSessionToLogout] = useState<Session | null>(null);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:9494/api/sessions', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error('Gagal memuat sesi.');
            setSessions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleLogoutSession = async () => {
        if (!sessionToLogout) return;
        try {
            await fetch(`http://localhost:9494/api/sessions/${sessionToLogout.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            fetchSessions(); // Refresh list
        } catch (error) {
            alert('Gagal menghentikan sesi.');
        } finally {
            setSessionToLogout(null);
        }
    };

    return (
        <>
            <Card>
                <CardHeader><CardTitle>Sesi Aktif</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : (
                        sessions.map(session => (
                            <div key={session.id} className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                                {getDeviceIcon(session.os)}
                                <div className="flex-grow">
                                    <p className="font-semibold text-foreground">{session.browser || 'Perangkat Tidak Dikenal'}</p>
                                    <p className="text-xs text-muted-foreground">{session.ip_address} &bull; Terakhir aktif: {new Date(session.last_seen).toLocaleString('id-ID')}</p>
                                </div>
                                {session.isCurrentSession ? (
                                    <span className="text-sm font-bold text-green-500">Sesi Ini</span>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSessionToLogout(session)}
                                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                        <LogOut size={18} />
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
            <ConfirmModal
                isOpen={!!sessionToLogout}
                onClose={() => setSessionToLogout(null)}
                onConfirm={handleLogoutSession}
                title="Konfirmasi Logout Sesi"
                description={`Anda yakin ingin menghentikan sesi di perangkat ${sessionToLogout?.browser} on ${sessionToLogout?.os}?`}
                confirmText="Ya, Hentikan"
            />
        </>
    );
};
export default ActiveSessionsCard;