'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useMikrotik } from '@/components/providers/mikrotik-provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const EtherChart = ({ trafficData }: { trafficData: any }) => {
  const [chartData, setChartData] = useState({
    labels: Array(30).fill(''),
    datasets: [
      { label: 'Upload (Mbps)', data: Array(30).fill(0), borderColor: '#ef4444', backgroundColor: '#ef444433', tension: 0.4, pointRadius: 0 },
      { label: 'Download (Mbps)', data: Array(30).fill(0), borderColor: '#3b82f6', backgroundColor: '#3b82f633', tension: 0.4, pointRadius: 0 },
    ],
  });

  useEffect(() => {
    if (trafficData) {
      const txBps = parseFloat(trafficData['tx-bits-per-second'] || '0');
      const rxBps = parseFloat(trafficData['rx-bits-per-second'] || '0');
      const txMbps = parseFloat((txBps / 1000000).toFixed(2));
      const rxMbps = parseFloat((rxBps / 1000000).toFixed(2));

      setChartData(prevData => ({
        labels: [...prevData.labels.slice(1), new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })],
        datasets: [
          { ...prevData.datasets[0], data: [...(prevData.datasets[0].data as number[]).slice(1), txMbps] },
          { ...prevData.datasets[1], data: [...(prevData.datasets[1].data as number[]).slice(1), rxMbps] },
        ]
      }));
    }
  }, [trafficData]);

  const chartOptions: any = { responsive: true, maintainAspectRatio: false, animation: { duration: 400 }, scales: { y: { beginAtZero: true, ticks: { callback: (value: number) => `${value} Mbps` } } }, plugins: { legend: { position: 'top' as const } } };

  return <Line data={chartData} options={chartOptions} />;
};

const MainContent = () => {
  const { traffic, isConnected } = useMikrotik() || { traffic: {}, isConnected: false };

  const activeInterfaces = useMemo(() => {
    if (!traffic) return [];
    
    return Object.keys(traffic)
      .filter(key => {
        const currentTraffic = traffic[key];
        const txBps = parseFloat(currentTraffic?.['tx-bits-per-second'] || '0');
        const rxBps = parseFloat(currentTraffic?.['rx-bits-per-second'] || '0');
        return txBps > 100000 || rxBps > 100000;
      })
      .sort();
  }, [traffic]);

  if (!isConnected) {
    return (
        <div className="md:col-span-2 flex items-center justify-center bg-secondary rounded-xl p-10 h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
        </div>
    );
  }

  return (
    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
      {activeInterfaces.length > 0 ? (
        activeInterfaces.map((etherId, index) => {
          const isLastItem = index === activeInterfaces.length - 1;
          const isOddCount = activeInterfaces.length % 2 !== 0;
          
          return (
            <Card 
              key={etherId} 
              className={isOddCount && isLastItem ? 'md:col-span-2' : ''}
            >
              <CardHeader><CardTitle>{etherId.toUpperCase()}</CardTitle></CardHeader>
              <CardContent className="h-80">
                  <EtherChart trafficData={traffic[etherId]} />
              </CardContent>
            </Card>
          );
        })
      ) : (
        <div className="md:col-span-2 flex items-center justify-center bg-secondary rounded-xl p-10 h-full">
            <p className="text-muted-foreground">Tidak ada traffic signifikan yang terdeteksi (&gt;100kbps).</p>
        </div>
      )}
    </div>
  );
};
export default MainContent;