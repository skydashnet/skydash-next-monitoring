'use client';

import React from 'react';
import ProfileCard from '@/components/settings/profile-card';
import SecurityCard from '@/components/settings/security-card';
import DangerZoneCard from '@/components/settings/danger-zone-card';
import DeviceManagementCard from '@/components/settings/device-management-card';
import ActiveSessionsCard from '@/components/settings/active-sessions-card';
import WhatsappBotCard from '@/components/settings/whatsapp-bot-card';
import JoinWorkspaceCard from '@/components/settings/join-workspace-card';

const SettingsPage = () => {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12">
      <header>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola profil, keamanan, dan preferensi akun Anda di sini.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-primary border-b pb-2">Akun & Profil</h2>
        <ProfileCard />
        <SecurityCard />
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-primary border-b pb-2">Perangkat & Konektivitas</h2>
        <DeviceManagementCard />
        <JoinWorkspaceCard />
        <WhatsappBotCard />
      </section>
      
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-primary border-b pb-2">Keamanan Lanjutan</h2>
        <ActiveSessionsCard />
        <DangerZoneCard />
      </section>
    </div>
  );
};

export default SettingsPage;