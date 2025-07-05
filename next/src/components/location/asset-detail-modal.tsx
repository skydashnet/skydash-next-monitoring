'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, MapPin, Tag, Info, Edit, Trash2, Users, GitBranch, PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Asset } from './asset-list';

interface Connection {
    name: string;
    type: 'user' | 'ODP';
}

interface AssetDetailModalProps {
  asset: Asset | null;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onAddConnection: (asset: Asset) => void;
}

const AssetDetailModal = ({ asset, onClose, onEdit, onDelete, onAddConnection }: AssetDetailModalProps) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  useEffect(() => {
    if (asset) {
      setLoadingConnections(true);
      fetch(`http://localhost:9494/api/assets/${asset.id}/connections`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setConnections(data);
          }
        })
        .catch(err => console.error("Gagal fetch koneksi:", err))
        .finally(() => setLoadingConnections(false));
    }
  }, [asset]);

  if (!asset) return null;

  const lat = parseFloat(asset.latitude as any);
  const lon = parseFloat(asset.longitude as any);
  const connectionLabel = asset.type === 'ODP' ? 'User Terhubung' : 'ODP Terhubung';

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1001] p-4" onClick={onClose}>
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-sm border" onClick={(e) => e.stopPropagation()}>
          <header className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold truncate" title={asset.name}>{asset.name}</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X size={20} /></button>
          </header>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3"><Tag size={16} className="text-muted-foreground" /><span className="text-sm">Tipe: <span className="font-semibold">{asset.type}</span></span></div>
            {asset.splitter_count && <div className="flex items-center gap-3"><GitBranch size={16} className="text-muted-foreground" /><span className="text-sm">Splitter: <span className="font-semibold">1x{asset.splitter_count}</span></span></div>}
            <div className="flex items-center gap-3"><MapPin size={16} className="text-muted-foreground" /><span className="text-sm">Koordinat: <span className="font-mono text-xs">{`${lat.toFixed(5)}, ${lon.toFixed(5)}`}</span></span></div>
            <div className="flex items-start gap-3"><Info size={16} className="text-muted-foreground mt-0.5" /><p className="text-sm italic text-muted-foreground">{asset.description || "Tidak ada deskripsi."}</p></div>
            
            <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Users size={16}/> {connectionLabel} ({connections.length})
                </h3>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-2">
                    {loadingConnections ? <Loader2 className="animate-spin"/> : connections.length > 0 ? (
                        connections.map(conn => (
                            <div key={conn.name} className="text-xs bg-secondary p-2 rounded-md">{conn.name}</div>
                        ))
                    ) : <p className="text-xs text-muted-foreground">Tidak ada koneksi.</p>}
                </div>
            </div>
          </div>
          
          <footer className="flex justify-between items-center p-4 bg-secondary/50 rounded-b-2xl">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit(asset)} title="Edit Aset"><Edit size={16}/></Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(asset)} className="text-muted-foreground hover:text-destructive" title="Hapus Aset"><Trash2 size={16}/></Button>
            </div>
            {asset.type === 'ODP' && (
                <Button onClick={() => onAddConnection(asset)}>
                    <PlusCircle size={16} className="mr-2"/> Tambah Koneksi
                </Button>
            )}
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
export default AssetDetailModal;