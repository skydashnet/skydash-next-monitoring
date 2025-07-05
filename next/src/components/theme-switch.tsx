'use client';

import React from 'react';
import { useTheme } from '@/components/providers/theme-provider';
import { Monitor, Sun, Moon } from 'lucide-react';

export const ThemeSwitch = () => {
    const { setTheme } = useTheme();

    return (
        <div className="flex items-center gap-2">
            <button onClick={() => setTheme('cosmic')} title="Cosmic Theme" className="p-2 rounded-md hover:bg-secondary"><Moon size={16}/></button>
            <button onClick={() => setTheme('clarity')} title="Clarity Theme" className="p-2 rounded-md hover:bg-secondary"><Sun size={16}/></button>
            <button onClick={() => setTheme('terminal')} title="Terminal Theme" className="p-2 rounded-md hover:bg-secondary"><Monitor size={16}/></button>
        </div>
    );
};