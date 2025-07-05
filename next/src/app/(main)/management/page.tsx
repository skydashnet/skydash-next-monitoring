'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, UserX, Plus, Settings, Loader2 } from 'lucide-react';
import SummaryCard from '@/components/dashboard/summary-card';
import AddPppoeSecretModal from '@/components/management/add-pppoe-secret-modal';
import IpPoolManagerModal from '@/components/management/ip-pool-manager-modal';
import PppoeSecretsTable from '@/components/management/pppoe-secrets-table';
import { Button } from '@/components/ui/button';

const ManagementPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isIpPoolModalOpen, setIsIpPoolModalOpen] = useState(false);
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
        const response = await fetch('http://localhost:9494/api/pppoe/summary', { credentials: 'include' });
        if (!response.ok) throw new Error('Gagal mengambil data summary.');
        const data = await response.json();
        setSummary(data);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshTrigger]);

  const handleSuccess = () => {
      setRefreshTrigger(prev => prev + 1);
  };
  
  const renderSummaryCard = (title: string, count: number, icon: React.ReactNode, color: string, filter: 'all' | 'active' | 'inactive') => (
      <button onClick={() => setActiveFilter(filter)} className={`w-full text-left rounded-lg transition-all ${activeFilter === filter ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
          <SummaryCard title={title} count={loading ? <Loader2 className="animate-spin" /> : count} icon={icon} colorClass={color} />
      </button>
  );

  return (
    <>
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <h1 className="text-3xl font-bold">Manajemen PPPoE</h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setIsIpPoolModalOpen(true)}>
              <Settings size={18} className="mr-2"/> Atur IP Pool
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus size={18} className="mr-2"/> Tambah Secret
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderSummaryCard("Total Secrets", summary.total, <Users size={28}/>, "bg-gradient-to-br from-blue-500 to-blue-700", 'all')}
          {renderSummaryCard("Aktif", summary.active, <UserCheck size={28}/>, "bg-gradient-to-br from-green-500 to-green-700", 'active')}
          {renderSummaryCard("Tidak Aktif", summary.inactive, <UserX size={28}/>, "bg-gradient-to-br from-red-500 to-red-700", 'inactive')}
        </div>
        <div className="mt-8">
          <PppoeSecretsTable refreshTrigger={refreshTrigger} onActionComplete={handleSuccess} initialFilter={activeFilter} />
        </div>
      </div>
      <AddPppoeSecretModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handleSuccess} />
      <IpPoolManagerModal isOpen={isIpPoolModalOpen} onClose={() => setIsIpPoolModalOpen(false)} />
    </>
  );
};
export default ManagementPage;