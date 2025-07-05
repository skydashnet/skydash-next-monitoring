'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Server, Plus, Edit, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DeviceModal, { Device } from './device-modal';
import ConfirmModal from '../ui/confirm-modal';
import { useAuth } from '../providers/auth-provider';

const DeviceManagementCard = () => {
    const { user } = useAuth();
    const [devices, setDevices] = useState<Device[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deviceToProcess, setDeviceToProcess] = useState<Device | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.workspace_id) return;
        setLoading(true);
        try {
            const [devicesRes, workspaceRes] = await Promise.all([
                fetch('http://localhost:9494/api/devices', { credentials: 'include' }),
                fetch('http://localhost:9494/api/workspaces/me', { credentials: 'include' })
            ]);

            if (!devicesRes.ok || !workspaceRes.ok) {
                throw new Error('Gagal memuat data perangkat atau workspace.');
            }

            const devicesData = await devicesRes.json();
            const workspaceData = await workspaceRes.json();
            
            setDevices(devicesData);
            setActiveDeviceId(workspaceData.active_device_id);

        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSuccess = () => {
        fetchData();
    };

    const handleAddClick = () => {
        setDeviceToProcess(null);
        setIsDeviceModalOpen(true);
    };

    const handleEditClick = (device: Device) => {
        setDeviceToProcess(device);
        setIsDeviceModalOpen(true);
    };

    const handleDeleteClick = (device: Device) => {
        setDeviceToProcess(device);
        setIsDeleteModalOpen(true);
    };
    
    const handleDeleteConfirm = async () => {
        if (!deviceToProcess) return;
        setIsActionLoading(true);
        try {
            await fetch(`http://localhost:9494/api/devices/${deviceToProcess.id}`, { 
                method: 'DELETE', 
                credentials: 'include' 
            });
            handleSuccess();
        } catch (error) {
            console.error("Gagal menghapus perangkat:", error);
        } finally {
            setIsActionLoading(false);
            setIsDeleteModalOpen(false);
            setDeviceToProcess(null);
        }
    };

    const handleSetActive = async (deviceId: number) => {
        setIsActionLoading(true);
        try {
            await fetch('http://localhost:9494/api/workspaces/set-active-device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ deviceId })
            });
            handleSuccess();
        } catch (error) {
            console.error("Gagal set perangkat aktif:", error);
        } finally {
            setIsActionLoading(false);
        }
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Manajemen Perangkat</CardTitle>
                    <Button onClick={handleAddClick}>
                        <Plus size={16} className="mr-2" />
                        Tambah
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : devices.length > 0 ? (
                        devices.map(device => (
                            <div key={device.id} className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                                <Server className="text-muted-foreground" />
                                <div className="flex-grow">
                                    <p className="font-semibold">{device.name}</p>
                                    <p className="text-xs text-muted-foreground">{device.user}@{device.host}:{device.port}</p>
                                </div>
                                {device.id === activeDeviceId ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                        <CheckCircle size={14} /> Aktif
                                    </span>
                                ) : (
                                    <Button onClick={() => handleSetActive(device.id)} disabled={isActionLoading} variant="outline" className="text-xs h-auto py-1 px-2">Jadikan Aktif</Button>
                                )}
                                <div className="flex gap-1">
                                    <button onClick={() => handleEditClick(device)} className="p-2 rounded-md hover:bg-muted" title="Edit"><Edit size={16} /></button>
                                    <button onClick={() => handleDeleteClick(device)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Hapus"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-muted-foreground mb-4">Belum ada perangkat, nih.</p>
                            <Button variant="outline" onClick={handleAddClick}>
                                <Plus size={16} className="mr-2"/> Tambahkan MikroTik
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DeviceModal
                isOpen={isDeviceModalOpen}
                onClose={() => setIsDeviceModalOpen(false)}
                onSuccess={handleSuccess}
                deviceToEdit={deviceToProcess}
            />
            
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Konfirmasi Hapus Perangkat"
                description={`Anda yakin ingin menghapus perangkat "${deviceToProcess?.name}"? Semua data terkait mungkin akan terpengaruh.`}
                confirmText="Ya, Hapus"
                isLoading={isActionLoading}
            />
        </>
    );
};

export default DeviceManagementCard;