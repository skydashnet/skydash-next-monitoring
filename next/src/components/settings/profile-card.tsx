'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import AvatarCropModal from './avatar-crop-modal';

const ProfileCard = () => {
  const { user, loading: authLoading, checkLoggedIn } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:9494/api/user/details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayName })
      });
      if (!res.ok) throw new Error("Gagal menyimpan profil.");
      await checkLoggedIn();
      alert("Profil berhasil disimpan!");
    } catch (error) {
      alert("Gagal menyimpan profil.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }

    if (e.currentTarget) e.currentTarget.value = "";
  };
  
  const handleSaveAvatar = async (croppedBlob: Blob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', croppedBlob, 'avatar.png');

    try {
      await fetch('http://localhost:9494/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      await checkLoggedIn();
      alert("Avatar berhasil diubah!");
    } catch(err) {
      alert("Gagal mengubah avatar.");
    } finally {
      setLoading(false);
      setIsCropModalOpen(false);
      setImageToCrop(null);
    }
  };

  if (authLoading) return <Card className="p-6 flex justify-center"><Loader2 className="animate-spin"/></Card>;

  return (
    <>
        <Card>
          <CardHeader><CardTitle>Profil & Tampilan</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <img src={user?.profile_picture_url ? `http://localhost:9494${user.profile_picture_url}?t=${new Date().getTime()}` : ''} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-card shadow-md"/>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*"/>
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full shadow-md border-2 border-card">
                  <Camera size={16} />
                </button>
              </div>
              <div className="flex-grow">
                <label htmlFor="displayName" className="block text-sm font-medium mb-1 text-muted-foreground">Nama Display</label>
                <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-2 rounded-md bg-input border-border focus:outline-none focus:ring-2 focus:ring-ring"/>
              </div>
            </div>
            <div className="text-right">
              <Button onClick={handleSaveProfile} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Simpan Profil
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <AvatarCropModal
            isOpen={isCropModalOpen}
            onClose={() => setIsCropModalOpen(false)}
            onSave={handleSaveAvatar}
            imageSrc={imageToCrop}
            isSaving={loading}
        />
    </>
  );
};
export default ProfileCard;