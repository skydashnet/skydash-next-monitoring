'use client';

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import MainContent from '@/components/dashboard/main-content';
import Sidebar from '@/components/dashboard/sidebar';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Selamat Datang, {user?.displayName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Ini ringkasan aktivitas jaringan lo saat ini.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <MainContent />
        <Sidebar />
      </div>
    </div>
  );
};

export default DashboardPage;