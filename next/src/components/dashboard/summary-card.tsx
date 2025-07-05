'use client';

import React from 'react';
import { motion } from '@/components/motion';
import { Card, CardContent } from '@/components/ui/card';

interface SummaryCardProps {
  title: string;
  count: number | string | React.ReactNode;
  icon: React.ReactNode;
  colorClass: string;
}

const SummaryCard = ({ title, count, icon, colorClass }: SummaryCardProps) => {
  return (
    <motion.div whileHover={{ y: -5 }} className="h-full">
      <Card className={`text-white ${colorClass}`}>
        <CardContent className="p-6 flex justify-between items-start">
          <div className="flex flex-col">
            <p className="text-lg font-medium text-white/80">{title}</p>
            <div className="text-4xl font-bold">
              {typeof count === 'object' ? count : <span>{count}</span>}
            </div>
          </div>
          <div className="p-3 bg-black/20 rounded-xl">
            {icon}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SummaryCard;