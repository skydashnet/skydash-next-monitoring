'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Upload, Loader2 } from 'lucide-react';
import AssetList, { Asset } from '@/components/location/asset-list';
import AddAssetModal from '@/components/location/add-asset-modal';
import AssetDetailModal from '@/components/location/asset-detail-modal';
import EditAssetModal from '@/components/location/edit-asset-modal';
import ConfirmModal from '@/components/ui/confirm-modal';
import AddConnectionModal from '@/components/location/add-connection-modal';
import { Button } from '@/components/ui/button';
import AssetFilter, { assetTypes } from '@/components/location/asset-filter';

const MapDisplay = dynamic(() => import('@/components/location/map-display'), { 
  ssr: false, 
  loading: () => <div className="flex items-center justify-center h-full w-full bg-secondary rounded-xl"><p>Memuat Peta...</p></div> 
});

const LocationPage = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
    new Set(assetTypes.map(t => t.id))
  );

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddConnectionModalOpen, setIsAddConnectionModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/assets`, { credentials: 'include' });
      if (!res.ok) throw new Error("Gagal mengambil data aset.");
      const data = await res.json();
      setAssets(data);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    fetchAssets(); 
  }, [fetchAssets, refreshTrigger]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => visibleTypes.has(asset.type));
  }, [assets, visibleTypes]);

  const handleToggleType = (type: string) => {
    setVisibleTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const handleSuccess = () => { 
    setRefreshTrigger(prev => prev + 1); 
  };

  const handleKmlUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('kmlfile', file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/import/kml`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) throw new Error('Gagal mengimpor file KML.');
      handleSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsImporting(false);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDelete = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleAddConnection = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(false);
    setIsAddConnectionModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAsset) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      await fetch(`${apiUrl}/api/assets/${selectedAsset.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      handleSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedAsset(null);
    }
  };

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleKmlUpload} 
        className="hidden" 
        accept=".kml"
      />

      <div className="h-full flex flex-col p-4 md:p-6 lg:p-8">
        <div className="flex-shrink-0 mb-6 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h1 className="text-3xl font-bold text-foreground">Peta Lokasi Aset</h1>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                    {isImporting ? <Loader2 size={18} className="mr-2 animate-spin"/> : <Upload size={18} className="mr-2"/>}
                    Import KML
                </Button>
                <Button onClick={() => setIsAddModalOpen(true)}><Plus size={18} className="mr-2"/> Tambah Aset</Button>
              </div>
            </div>
            <AssetFilter visibleTypes={visibleTypes} onToggleType={handleToggleType} />
        </div>
        
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          <div className="lg:col-span-1 h-[400px] lg:h-auto min-h-0">
            <AssetList assets={filteredAssets} loading={loading} selectedAssetId={selectedAsset?.id} onAssetSelect={handleAssetSelect} />
          </div>
          <div className="lg:col-span-2 h-[500px] lg:h-auto min-h-0 relative z-10">
            <MapDisplay assets={filteredAssets} onMarkerClick={handleAssetSelect} />
          </div>
        </div>
      </div>

      <AddAssetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handleSuccess} />

      {selectedAsset && (
        <>
          <AssetDetailModal 
            isOpen={isDetailModalOpen} 
            onClose={() => setIsDetailModalOpen(false)} 
            asset={selectedAsset}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddConnection={handleAddConnection}
          />
          <EditAssetModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            assetToEdit={selectedAsset} 
            onSuccess={handleSuccess}
          />
          <AddConnectionModal
            isOpen={isAddConnectionModalOpen}
            onClose={() => setIsAddConnectionModalOpen(false)}
            asset={selectedAsset}
            onSuccess={handleSuccess}
          />
          <ConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            title={`Hapus Aset: ${selectedAsset.name}?`}
            description="Tindakan ini tidak dapat diurungkan. Semua koneksi pengguna yang terhubung ke aset ini akan ikut terhapus."
          />
        </>
      )}
    </>
  );
};

export default LocationPage;