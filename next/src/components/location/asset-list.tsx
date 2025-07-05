'use client';

import React from 'react';
import { Server, Box, GitBranch, Share2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface Asset {
  id: number;
  name: string;
  type: 'ODC' | 'ODP' | 'JoinBox' | 'Server';
  latitude: number;
  longitude: number;
  description?: string;
  splitter_count?: number;
}

const getAssetStyle = (type: Asset['type']) => {
  const styles = {
    ODC: { icon: <Box size={20} />, color: 'bg-amber-500' },
    ODP: { icon: <GitBranch size={20} />, color: 'bg-emerald-500' },
    JoinBox: { icon: <Share2 size={20} />, color: 'bg-blue-500' },
    Server: { icon: <Server size={20} />, color: 'bg-red-500' },
  };
  return styles[type] || styles.JoinBox;
};

interface AssetListProps {
  assets: Asset[];
  loading: boolean;
  selectedAssetId?: number | null;
  onAssetSelect: (asset: Asset) => void;
}

const AssetList = ({ assets, loading, selectedAssetId, onAssetSelect }: AssetListProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Daftar Aset ({assets.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground"/></div>
        ) : (
          <ul className="space-y-2">
            {assets.map(asset => {
              const style = getAssetStyle(asset.type);
              const isSelected = selectedAssetId === asset.id;
              return (
                <li key={asset.id}>
                  <button onClick={() => onAssetSelect(asset)} className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-secondary'}`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white ${style.color}`}>{style.icon}</div>
                    <div className="flex-grow overflow-hidden">
                      <p className="font-semibold truncate">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">{asset.type}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
export default AssetList;