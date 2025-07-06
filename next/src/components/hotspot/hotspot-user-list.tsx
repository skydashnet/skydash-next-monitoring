'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from '@/components/motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Power, PowerOff, MoreHorizontal, Loader2, Edit, Trash2, ZapOff } from 'lucide-react';
import { useMikrotik } from '@/components/providers/mikrotik-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import ConfirmModal from '@/components/ui/confirm-modal';

interface HotspotUser {
  '.id': string;
  name: string;
  profile: string;
  'limit-uptime'?: string;
  disabled: 'true' | 'false';
}

interface HotspotUserListProps {
  refreshTrigger: number;
  onActionComplete: () => void;
}

const HotspotUserList = ({ refreshTrigger, onActionComplete }: HotspotUserListProps) => {
  const { hotspotActive } = useMikrotik() || { hotspotActive: [] };
  const [allUsers, setAllUsers] = useState<HotspotUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<HotspotUser | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/hotspot/users`, { credentials: 'include' });
      if (!res.ok) throw new Error("Gagal mengambil daftar user hotspot.");
      const data = await res.json();
      setAllUsers(data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers, refreshTrigger]);
  
  const activeUsersSet = useMemo(() => new Set(hotspotActive?.map((user: any) => user.user) || []), [hotspotActive]);

  const handleAction = async (action: 'enable' | 'disable' | 'kick' | 'delete', user: HotspotUser) => {
    let url = '';
    let options: RequestInit = { credentials: 'include' };

    switch (action) {
        case 'kick':
            const activeUser = hotspotActive.find((u: any) => u.user === user.name);
            if(!activeUser || !activeUser['.id']) return alert("User tidak aktif, tidak bisa di-kick.");
            url = `${apiUrl}/api/hotspot/active/${activeUser['.id']}/kick`;
            options.method = 'POST';
            break;
        case 'enable':
        case 'disable':
            url = `${apiUrl}/api/hotspot/users/${user['.id']}/status`;
            options.method = 'PUT';
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify({ disabled: action === 'disable' });
            break;
        case 'delete':
            setUserToDelete(user);
            setIsDeleteModalOpen(true);
            return;
    }
    
    try {
      const res = await fetch(url, options);
      if(!res.ok) throw new Error(`Aksi ${action} gagal`);
      onActionComplete();
    } catch (error) { alert(`Gagal melakukan aksi: ${error}`); }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    const url = `${apiUrl}/api/hotspot/users/${userToDelete['.id']}`;
    try {
        const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
        if(!res.ok) throw new Error("Gagal menghapus user.");
        onActionComplete();
    } catch (error) { alert(`Gagal menghapus: ${error}`);
    } finally { setIsDeleteModalOpen(false); setUserToDelete(null); }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Daftar Semua User Hotspot ({allUsers.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left bg-secondary">
                <tr>
                  <th className="p-4 font-semibold">Status</th><th className="p-4 font-semibold">Nama</th>
                  <th className="p-4 font-semibold">Profil</th><th className="p-4 font-semibold">Uptime Limit</th>
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user, i) => {
                  const isActive = activeUsersSet.has(user.name);
                  return (
                    <motion.tr key={user['.id']} className="border-b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <td className="p-4">
                        {user.disabled === 'true' ? (<span className="flex items-center gap-2 text-muted-foreground"><PowerOff size={14} /> Disabled</span>)
                        : isActive ? (<span className="flex items-center gap-2 text-green-500"><Power size={14} className="animate-pulse"/> Active</span>)
                        : (<span className="flex items-center gap-2 text-red-500"><PowerOff size={14} /> Inactive</span>)}
                      </td>
                      <td className="p-4 font-medium">{user.name}</td><td className="p-4">{user.profile}</td>
                      <td className="p-4 font-mono">{user['limit-uptime'] || '∞'}</td>
                      <td className="p-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled> <Edit className="mr-2 h-4 w-4"/> Edit </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {isActive && <DropdownMenuItem onClick={() => handleAction('kick', user)}> <ZapOff className="mr-2 h-4 w-4"/> Kick User </DropdownMenuItem>}
                            {user.disabled === 'true' ? 
                              (<DropdownMenuItem onClick={() => handleAction('enable', user)}> <Power className="mr-2 h-4 w-4"/> Enable </DropdownMenuItem>) : 
                              (<DropdownMenuItem onClick={() => handleAction('disable', user)}> <PowerOff className="mr-2 h-4 w-4"/> Disable </DropdownMenuItem>)}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleAction('delete', user)}><Trash2 className="mr-2 h-4 w-4"/> Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} title="Konfirmasi Hapus User Hotspot" description={`Yakin ingin menghapus user "${userToDelete?.name}" secara permanen?`} confirmText="Ya, Hapus"/>
    </>
  );
};

export default HotspotUserList;