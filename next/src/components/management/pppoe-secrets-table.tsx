'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from '@/components/motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Power, PowerOff, MoreHorizontal, Loader2, Edit, Trash2, ZapOff } from 'lucide-react';
import { useMikrotik } from '@/components/providers/mikrotik-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import ConfirmModal from '@/components/ui/confirm-modal';
import EditPppoeSecretModal from './edit-pppoe-secret-modal';

interface PppoeSecret {
  '.id': string;
  name: string;
  profile: string;
  'remote-address'?: string;
  disabled: 'true' | 'false';
}

interface PppoeSecretsTableProps {
  refreshTrigger: number;
  onActionComplete: () => void;
  initialFilter?: 'all' | 'active' | 'inactive';
}

const PppoeSecretsTable = ({ refreshTrigger, onActionComplete, initialFilter = 'all' }: PppoeSecretsTableProps) => {
  const { pppoeActive } = useMikrotik() || { pppoeActive: [] };
  const [allSecrets, setAllSecrets] = useState<PppoeSecret[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [secretToDelete, setSecretToDelete] = useState<PppoeSecret | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [secretToEdit, setSecretToEdit] = useState<PppoeSecret | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchSecrets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/pppoe/secrets`, { credentials: 'include' });
      if (!response.ok) throw new Error('Gagal mengambil daftar secret.');
      const data = await response.json();
      setAllSecrets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets, refreshTrigger]);

  const activeUsersSet = useMemo(() => new Set(pppoeActive?.map((user: any) => user.name) || []), [pppoeActive]);
  
  const filteredSecrets = useMemo(() => {
    if (initialFilter === 'active') {
      return allSecrets.filter(secret => activeUsersSet.has(secret.name) && secret.disabled === 'false');
    }
    if (initialFilter === 'inactive') {
      return allSecrets.filter(secret => !activeUsersSet.has(secret.name) && secret.disabled === 'false');
    }
    return allSecrets;
  }, [allSecrets, activeUsersSet, initialFilter]);
  
  const handleAction = async (action: 'enable' | 'disable' | 'kick', secret: PppoeSecret) => {
    setIsActionLoading(true);
    let url = '';
    let options: RequestInit = { credentials: 'include' };
    
    try {
        if (action === 'kick') {
            const activeUser = pppoeActive.find((u: any) => u.name === secret.name);
            if(!activeUser || !activeUser['.id']) throw new Error("User tidak aktif, tidak bisa di-kick.");
            const encodedId = encodeURIComponent(activeUser['.id']);
            url = `${apiUrl}/api/pppoe/active/${encodedId}/kick`;
            options.method = 'POST';
        } else {
            const encodedId = encodeURIComponent(secret['.id']);
            url = `${apiUrl}/api/pppoe/secrets/${encodedId}/status`;
            options.method = 'PUT';
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify({ disabled: action === 'disable' ? 'yes' : 'no' });
        }
        
        const res = await fetch(url, options);
        if(!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || "Aksi gagal");
        }
        onActionComplete();
    } catch (error: any) {
        alert(`Gagal melakukan aksi: ${error.message}`);
    } finally {
        setIsActionLoading(false);
    }
  };

  const openDeleteModal = (secret: PppoeSecret) => {
    setSecretToDelete(secret);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!secretToDelete) return;
    setIsActionLoading(true);
    try {
        const encodedId = encodeURIComponent(secretToDelete['.id']);
        await fetch(`${apiUrl}/api/pppoe/secrets/${encodedId}`, { method: 'DELETE', credentials: 'include' });
        onActionComplete();
    } catch (error) {
        alert("Gagal menghapus secret.");
    } finally {
        setIsActionLoading(false);
        setIsDeleteModalOpen(false);
        setSecretToDelete(null);
    }
  };

  const openEditModal = (secret: PppoeSecret) => {
    setSecretToEdit(secret);
    setIsEditModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Secret PPPoE ({loading ? '...' : filteredSecrets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[60vh] overflow-y-auto overscroll-contain">
            <table className="w-full text-sm">
              <thead className="text-left bg-secondary sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Nama</th>
                  <th className="p-4 font-semibold">Profil</th>
                  <th className="p-4 font-semibold">Remote Address</th>
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr><td colSpan={5} className="text-center p-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground"/></td></tr>
                ) : filteredSecrets.length > 0 ? (
                    filteredSecrets.map((user, i) => {
                      const isActive = activeUsersSet.has(user.name);
                      return (
                        <motion.tr key={user['.id']} className="border-b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                          <td className="p-4">
                            {user.disabled === 'true' ? 
                              (<span className="flex items-center gap-2 text-muted-foreground"><PowerOff size={14} /> Disabled</span>) : 
                              isActive ? 
                              (<span className="flex items-center gap-2 text-green-500"><Power size={14} className="animate-pulse"/> Active</span>) : 
                              (<span className="flex items-center gap-2 text-red-500"><PowerOff size={14} /> Inactive</span>)
                            }
                          </td>
                          <td className="p-4 font-medium">{user.name}</td>
                          <td className="p-4">{user.profile}</td>
                          <td className="p-4 font-mono">{user['remote-address'] || 'N/A'}</td>
                          <td className="p-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditModal(user)}>
                                  <Edit className="mr-2 h-4 w-4"/> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {isActive && 
                                  <DropdownMenuItem onClick={() => handleAction('kick', user)}>
                                    <ZapOff className="mr-2 h-4 w-4"/> Kick User
                                  </DropdownMenuItem>
                                }
                                {user.disabled === 'true' ? 
                                  (<DropdownMenuItem onClick={() => handleAction('enable', user)}> <Power className="mr-2 h-4 w-4"/> Enable </DropdownMenuItem>) : 
                                  (<DropdownMenuItem onClick={() => handleAction('disable', user)}> <PowerOff className="mr-2 h-4 w-4"/> Disable </DropdownMenuItem>)
                                }
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => openDeleteModal(user)}>
                                  <Trash2 className="mr-2 h-4 w-4"/> Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      );
                    })
                ) : (
                    <tr><td colSpan={5} className="text-center p-10 text-muted-foreground">Tidak ada secret yang cocok dengan filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <ConfirmModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDeleteConfirm} 
        title="Konfirmasi Hapus Secret" 
        description={`Anda yakin ingin menghapus secret PPPoE untuk pengguna "${secretToDelete?.name}"? Aksi ini tidak dapat dibatalkan.`} 
        confirmText="Ya, Hapus Permanen" 
        isLoading={isActionLoading}
      />
      
      <EditPppoeSecretModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={() => {
            setIsEditModalOpen(false);
            onActionComplete();
        }}
        secretToEdit={secretToEdit}
      />
    </>
  );
};

export default PppoeSecretsTable;