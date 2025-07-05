'use client';

import React from 'react';
import { useMikrotik } from '@/components/providers/mikrotik-provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip);

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const formatUptime = (uptimeStr: string) => {
  if (!uptimeStr) return '...';
  const parts = [];
  const weekMatch = uptimeStr.match(/(\d+)w/);
  const dayMatch = uptimeStr.match(/(\d+)d/);
  const hourMatch = uptimeStr.match(/(\d+)h/);
  const minuteMatch = uptimeStr.match(/(\d+)m/);

  if (weekMatch) parts.push(`${weekMatch[1]} week`);
  if (dayMatch) parts.push(`${dayMatch[1]} day`);
  if (hourMatch) parts.push(`${hourMatch[1]} hours`);
  if (minuteMatch) parts.push(`${minuteMatch[1]} minute`);
  
  return parts.join(' ') || 'Baru saja aktif';
};

const Sidebar = () => {
  const { resource, isConnected } = useMikrotik() || { resource: null, isConnected: false };
  
  if (!isConnected || !resource) {
    return (
        <aside className="w-full lg:w-80 lg:flex-shrink-0">
            <Card className="h-full">
                <CardContent className="p-6 h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground space-y-2">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                        <p>Menunggu Data Perangkat...</p>
                    </div>
                </CardContent>
            </Card>
        </aside>
    );
  }
  
  const cpuLoad = parseInt(resource['cpu-load'] || '0', 10);
  const totalMemory = parseInt(resource['total-memory'] || '1', 10);
  const freeMemory = parseInt(resource['free-memory'] || '0', 10);
  const usedMemory = totalMemory - freeMemory;
  const ramUsage = totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0;
  
  const totalDisk = parseInt(resource['total-hdd-space'] || '1', 10);
  const freeDisk = parseInt(resource['free-hdd-space'] || '0', 10);
  const usedDisk = totalDisk - freeDisk;
  const diskUsage = totalDisk > 0 ? Math.round((usedDisk / totalDisk) * 100) : 0;
  
  const chartOptions: any = { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { tooltip: { enabled: false } } };
  const cpuChartData = { datasets: [{ data: [cpuLoad, 100 - cpuLoad], backgroundColor: ['#8b5cf6', '#374151'], borderWidth: 0 }] };
  const ramChartData = { datasets: [{ data: [ramUsage, 100 - ramUsage], backgroundColor: ['#3b82f6', '#374151'], borderWidth: 0 }] };
  const diskChartData = { datasets: [{ data: [diskUsage, 100 - diskUsage], backgroundColor: ['#10b981', '#374151'], borderWidth: 0 }] };

  return (
    <aside className="w-full lg:w-80 lg:flex-shrink-0">
      <Card className="h-full">
        <CardHeader><CardTitle>Info Perangkat</CardTitle></CardHeader>
        <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Board Name</p>
              <p className="font-semibold text-foreground">{resource['board-name'] || '...'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">OS Version</p>
              <p className="font-semibold text-foreground">{resource.version || '...'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="font-semibold text-foreground">{formatUptime(resource.uptime)}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 text-center pt-4">
                <div>
                    <h4 className="font-semibold text-muted-foreground mb-2">CPU Load</h4>
                    <div className="relative h-28 w-28 mx-auto">
                        <Doughnut data={cpuChartData} options={chartOptions} />
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">{cpuLoad}%</div>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-muted-foreground">RAM Usage</h4>
                    <p className="text-xs text-muted-foreground -mt-1 mb-2">{formatBytes(usedMemory)} / {formatBytes(totalMemory)}</p>
                    <div className="relative h-28 w-28 mx-auto">
                        <Doughnut data={ramChartData} options={chartOptions} />
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">{ramUsage}%</div>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-muted-foreground">Disk Usage</h4>
                     <p className="text-xs text-muted-foreground -mt-1 mb-2">{formatBytes(usedDisk)} / {formatBytes(totalDisk)}</p>
                    <div className="relative h-28 w-28 mx-auto">
                        <Doughnut data={diskChartData} options={chartOptions} />
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">{diskUsage}%</div>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </aside>
  );
};

export default Sidebar;