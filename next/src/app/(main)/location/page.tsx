'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Upload, Loader2 } from 'lucide-react';
import AssetList, { Asset } from '@/components/location/asset-list';
import AddAssetModal from '@/components/location/add-asset-modal';
import AssetDetailModal from '@/components/location/asset-detail-modal';
import EditAssetModal from '@/components/location/edit-asset-modal';
import ConfirmModal from '@/components/ui/confirm-modal';
import AddConnectionModal from '@/components/location/add-connection-modal';
import { Button } from '@/components/ui/button';

const MapDisplay = dynamic(() => import('@/components/location/map-display'), { ssr: false, loading: () => <div className="flex items-center justify-center h-full w-full bg-secondary rounded-xl"><p>Memuat Peta...</p></div> });

const LocationPage = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
      const res = await fetch('http://localhost:9494/api/assets', { credentials: 'include' });
      if (!res.ok) throw new Error("Gagal mengambil data aset.");
      const data = await res.json();
      setAssets(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets, refreshTrigger]);

  const handleSuccess = () => { setRefreshTrigger(prev => prev + 1); };
  const handleKmlUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('kmlFile', file);

    try {
        const res = await fetch('http://localhost:9494/api/import/kml', {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Gagal mengimpor file KML.');
        
        alert(data.message);
        handleSuccess();
    } catch (error: any) {
        alert(`Error: ${error.message}`);
    } finally {
        setIsImporting(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(true);
  };
  
  const handleEdit = (asset: Asset) => {
    setIsDetailModalOpen(false);
    setSelectedAsset(asset);
    setIsEditModalOpen(true);
  };
  
  const handleDelete = (asset: Asset) => {
    setIsDetailModalOpen(false);
    setSelectedAsset(asset);
    setIsDeleteModalOpen(true);
  };

  const handleAddConnection = (asset: Asset) => {
    setIsDetailModalOpen(false);
    setSelectedAsset(asset);
    setIsAddConnectionModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAsset) return;
    try {
      await fetch(`http://localhost:9494/api/assets/${selectedAsset.id}`, { method: 'DELETE', credentials: 'include' });
      handleSuccess();
    } catch (error) { alert("Gagal menghapus aset."); } finally { setIsDeleteModalOpen(false); setSelectedAsset(null); }
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
        <div className="flex-shrink-0 flex justify-between items-center flex-wrap gap-4 mb-6">
          <h1 className="text-3xl font-bold text-foreground">Peta Lokasi Aset</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                {isImporting ? <Loader2 size={18} className="mr-2 animate-spin"/> : <Upload size={18} className="mr-2"/>}
                Import KML
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}><Plus size={18} className="mr-2"/> Tambah Aset</Button>
          </div>
        </div>
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          <div className="lg:col-span-1 h-[400px] lg:h-auto min-h-0">
            <AssetList assets={assets} loading={loading} selectedAssetId={selectedAsset?.id} onAssetSelect={handleAssetSelect} />
          </div>
          <div className="lg:col-span-2 h-[500px] lg:h-auto min-h-0 relative z-10">
            <MapDisplay assets={assets} onMarkerClick={handleAssetSelect} />
          </div>
        </div>
      </div>

      <AddAssetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handleSuccess} />
      <EditAssetModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={handleSuccess} assetToEdit={selectedAsset} />
      <AssetDetailModal 
        asset={isDetailModalOpen ? selectedAsset : null} 
        onClose={() => setIsDetailModalOpen(false)} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        onAddConnection={handleAddConnection}
      />
      <AddConnectionModal 
        isOpen={isAddConnectionModalOpen}
        onClose={() => setIsAddConnectionModalOpen(false)}
        onSuccess={() => {
          handleSuccess();
          setIsAddConnectionModalOpen(false);
          if (selectedAsset) {
            handleAssetSelect(selectedAsset);
          }
        }}
        asset={selectedAsset}
      />
      <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} title="Konfirmasi Hapus Aset" description={`Yakin ingin menghapus aset "${selectedAsset?.name}" secara permanen?`} confirmText="Ya, Hapus"/>
    </>
  );
};
export default LocationPage;  