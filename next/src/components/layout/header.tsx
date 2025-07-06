'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { Settings, LogOut, Share2 } from 'lucide-react';
import GenerateCloneCodeModal from '@/components/settings/generate-clone-code-modal';
import { ThemeSwitch } from '@/components/theme-switch';
import { useAuth } from '../providers/auth-provider';

const Header = () => {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

    const handleLogout = async () => {
        setIsDropdownOpen(false);
        await logout();
    };

    return (
    <>
      <header className="w-full py-2 px-4 sm:px-6 flex justify-between items-center border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex-1" />
        <div className="flex-1 text-center">
          <Link href="/dashboard" className="inline-block">
            <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-foreground">
              Skydash.NET
            </h1>
            <p className="text-sm text-muted-foreground tracking-wide -mt-1">
                Mikrotik Monitoring Tools
            </p>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-end gap-4">
            <div className="relative">
                <button onClick={() => setIsDropdownOpen(prev => !prev)} className="p-1.5 rounded-full hover:bg-secondary">
                    <img 
                      src={user?.profile_picture_url ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${user.profile_picture_url}` : `https://api.dicebear.com/8.x/initials/svg?seed=SN`}
                      alt="User Avatar"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                </button>
                {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-60 bg-card rounded-lg shadow-lg border">
                        <div className="p-3 border-b">
                            <p className="font-semibold text-sm">{user?.displayName}</p>
                            <p className="text-xs text-muted-foreground">@{user?.username || 'user'}</p>
                        </div>
                         <div className="p-2 space-y-1">
                            <Link href="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-secondary">
                              <Settings size={16} /><span>Pengaturan</span>
                            </Link>
                             <button onClick={() => { setIsCloneModalOpen(true); setIsDropdownOpen(false); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-secondary">
                                <Share2 size={16} /><span>Bagikan Konfigurasi</span>
                            </button>
                            <div className="pt-2 border-t"><ThemeSwitch /></div>
                            <div className="pt-1 border-t">
                                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-destructive rounded-md hover:bg-destructive/10">
                                <LogOut size={16} /><span>Logout</span>
                                </button>
                            </div>
                          </div>
                    </div>
                )}
            </div>
        </div>
      </header>
      <GenerateCloneCodeModal isOpen={isCloneModalOpen} onClose={() => setIsCloneModalOpen(false)} />
    </>
  );
}
export default Header;