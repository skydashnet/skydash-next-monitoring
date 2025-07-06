'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from '@/components/motion';
import SlaDetailModal from '@/components/sla/sla-detail-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SlaUser {
  name: string;
  profile: string;
}

const SlaPage = () => {
  const [allUsers, setAllUsers] = useState<SlaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/pppoe/secrets?disabled=false`, { credentials: 'include' });
      if (!res.ok) throw new Error("Gagal mengambil daftar pengguna PPPoE.");
      const data = await res.json();
      setAllUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const usersToDisplay = allUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    usersToDisplay.sort((a, b) => a.name.localeCompare(b.name));

    return usersToDisplay;
  }, [allUsers, searchTerm]);

  const handleOpenModal = (userName: string) => {
    setSelectedUser(userName);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex-shrink-0">
          <header className="mb-4">
            <h1 className="text-3xl font-bold">Laporan SLA Pelanggan</h1>
            <p className="text-muted-foreground">
              Ringkasan performa dan uptime pengguna PPPoE dalam 30 hari terakhir.
            </p>
          </header>
          <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                  type="text"
                  placeholder="Cari nama pengguna..."
                  className="w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </div>
        <Card className="flex-1 min-h-0">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-left bg-secondary sticky top-0 z-10">
                  <tr>
                    <th className="p-4 font-semibold">Pengguna</th>
                    <th className="p-4 font-semibold">Profil</th>
                    <th className="p-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} className="text-center p-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary"/></td></tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user, i) => (
                      <motion.tr
                        key={user.name}
                        className="border-b border-border"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                      >
                        <td className="p-4 font-medium">{user.name}</td>
                        <td className="p-4">{user.profile}</td>
                        <td className="p-4 text-center">
                          <Button variant="ghost" onClick={() => handleOpenModal(user.name)}>
                            Lihat Detail SLA
                          </Button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="text-center p-10 text-muted-foreground">
                        {searchTerm ? `Tidak ada pengguna dengan nama "${searchTerm}".` : 'Tidak ada pengguna PPPoE yang aktif.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <SlaDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userName={selectedUser}
      />
    </>
  );
};
export default SlaPage;