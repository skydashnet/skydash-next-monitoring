'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { X, RotateCw, UploadCloud, Loader2 } from 'lucide-react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blob: Blob) => void;
  imageSrc: string | null;
  isSaving: boolean;
}

const AvatarCropModal = ({ isOpen, onClose, onSave, imageSrc, isSaving }: AvatarCropModalProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(crop);
  }

  const handleSaveCrop = () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = Math.floor(completedCrop.width * scaleX);
    canvas.height = Math.floor(completedCrop.height * scaleY);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    canvas.toBlob(blob => {
        if (blob) {
            onSave(blob);
        }
    }, 'image/png');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1001] p-4" onClick={onClose}>
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring' }} className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md border" onClick={e => e.stopPropagation()}>
            <header className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">Potong Gambar</h2>
                <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X size={20} /></button>
            </header>
            <div className="p-6">
                {imageSrc && (
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={1} circularCrop>
                        <img ref={imgRef} alt="Crop me" src={imageSrc} style={{ transform: `rotate(${rotation}deg)` }} onLoad={onImageLoad} />
                    </ReactCrop>
                )}
            </div>
            <footer className="flex justify-between items-center p-4 bg-secondary/50">
                <Button variant="outline" onClick={() => setRotation(r => r + 90)}><RotateCw size={16}/> Putar</Button>
                <Button onClick={handleSaveCrop} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud size={16} className="mr-2"/>}
                    Simpan & Unggah
                </Button>
            </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvatarCropModal;