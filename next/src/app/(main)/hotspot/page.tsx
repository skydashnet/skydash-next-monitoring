'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Wifi, Plus, Loader2 } from 'lucide-react';
import SummaryCard from '@/components/dashboard/summary-card';
import HotspotActiveList from '@/components/hotspot/hotspot-active-list';
import HotspotUserList from '@/components/hotspot/hotspot-user-list';
import AddHotspotUserModal from '@/components/hotspot/add-hotspot-user-modal';
import { Button } from '@/components/ui/button';

const HotspotPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState({ totalUsers: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:9494/api/hotspot/summary', { credentials: 'include' });
      if (!res.ok) throw new Error("Gagal mengambil summary hotspot.");
      const data = await res.json();
      setSummary(data);
    } catch (error) { console.error(error);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary, refreshTrigger]);
  
  const handleSuccess = () => { setRefreshTrigger(prev => prev + 1); };

  return (
    <>
      <div className="p-4 md:p-8 space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-bold">Manajemen Hotspot</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2"/> Tambah User
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SummaryCard title="Total User Hotspot" count={loading ? <Loader2 className="animate-spin"/> : summary.totalUsers} icon={<Users size={28}/>} colorClass="bg-gradient-to-br from-sky-500 to-sky-700" />
          <SummaryCard title="User Aktif" count={loading ? <Loader2 className="animate-spin"/> : summary.activeUsers} icon={<Wifi size={28}/>} colorClass="bg-gradient-to-br from-emerald-500 to-emerald-700" />
        </div>
        <HotspotActiveList />
        <HotspotUserList refreshTrigger={refreshTrigger} onActionComplete={handleSuccess} />
      </div>
      <AddHotspotUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />
    </>
  );
};
export default HotspotPage;