'use client';

import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { motion, AnimatePresence } from '@/components/motion';
import { X, User, History, Loader2 } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip);

interface SlaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string | null;
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

const formatDuration = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds} detik`;

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    if (minutes > 0) parts.push(`${minutes} menit`);
    if (seconds > 0) parts.push(`${seconds} detik`);

    return parts.join(' ');
}

const SlaDetailModal = ({ isOpen, onClose, userName }: SlaDetailModalProps) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && userName) {
      const fetchDetails = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await fetch(`http://localhost:9494/api/pppoe/secrets/${userName}/sla`, { credentials: 'include' });
          if (!res.ok) throw new Error("Gagal mengambil detail SLA.");
          const data = await res.json();
          setDetails(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, userName]);

  if (!isOpen) return null;

  const slaPercentage = parseFloat(details?.sla_percentage || 0);
  const chartData = {
    datasets: [{
      data: [slaPercentage, 100 - slaPercentage],
      backgroundColor: [ slaPercentage >= 99.9 ? '#22c55e' : slaPercentage >= 99.0 ? '#facc15' : '#ef4444', '#374151' ],
      borderColor: 'transparent',
      hoverOffset: 8, cutout: '80%', borderRadius: 5,
    }],
  };
  const chartOptions: any = { responsive: true, maintainAspectRatio: false, animation: { animateRotate: true, duration: 1200 }, plugins: { tooltip: { enabled: false } } };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1002] p-4" onClick={onClose}>
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-xl border" onClick={(e) => e.stopPropagation()}>
          <header className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold flex items-center gap-2"><User /> {userName}</h2><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary"><X size={20} /></button></header>
          {loading ? (
            <div className="p-10 flex justify-center items-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
          ) : error ? (
            <div className="p-10 text-center text-destructive">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-6">
              <div className="md:col-span-2 flex flex-col items-center justify-center space-y-4">
                <div className="relative h-40 w-40">
                  <Doughnut data={chartData} options={chartOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-3xl font-bold tracking-tight">{slaPercentage.toFixed(2)}<span className="text-xl text-muted-foreground">%</span></span><span className="text-xs text-muted-foreground mt-1">Uptime</span></div>
                </div>
                <div className="text-center">
                    <p className="font-semibold">{slaPercentage >= 99.9 ? 'Sangat Stabil' : slaPercentage >= 99.0 ? 'Stabil' : 'Butuh Perhatian'}</p>
                    <p className="text-xs text-muted-foreground">Analisis 30 Hari</p>
                </div>
              </div>
              <div className="md:col-span-3">
                <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><History size={18}/>Riwayat Downtime Terakhir</h3>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 bg-secondary/50 p-3 rounded-lg">
                    {details.recent_events.length > 0 ? details.recent_events.map((event: any, i: number) => (
                        <div key={i} className="text-sm p-2 bg-background rounded-md flex justify-between items-center">
                            <div><p className="font-semibold text-xs text-muted-foreground">{formatDate(event.start_time)}</p></div>
                            <div className="text-right"><p className="font-semibold text-sm">{formatDuration(event.duration_seconds)}</p></div>
                        </div>
                    )) : <p className="text-sm text-center text-muted-foreground p-8">Tidak ada catatan downtime. Mantap!</p>}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
export default SlaDetailModal;