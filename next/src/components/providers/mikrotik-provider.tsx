'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './auth-provider';

const MikrotikContext = createContext<any>(null);

export const useMikrotik = () => {
    return useContext(MikrotikContext);
};

export const MikrotikProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [resource, setResource] = useState(null);
    const [pppoeActive, setPppoeActive] = useState([]);
    const [hotspotActive, setHotspotActive] = useState([]);
    const [traffic, setTraffic] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!user) {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            setIsConnected(false);
            setResource(null);
            setPppoeActive([]);
            setHotspotActive([]);
            setTraffic({});
            return;
        }

        if (!ws.current) {
            const socket = new WebSocket('ws://localhost:9494/ws');
            ws.current = socket;

            socket.onopen = () => {
                console.log("[WebSocket] Koneksi berhasil dibuat.");
                setIsConnected(true);
            };

            socket.onclose = () => {
                setIsConnected(false);
                ws.current = null;
                console.log('[WebSocket] Koneksi ditutup, akan mencoba lagi...');
            };

            socket.onerror = (error) => {
                console.error('WebSocket Error:', error);
                ws.current = null;
                setIsConnected(false);
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'batch-update' && message.payload) {
                        setResource(message.payload.resource);
                        setPppoeActive(message.payload.pppoeActive);
                        setHotspotActive(message.payload.hotspotActive);
                        setTraffic(message.payload.traffic);
                    }
                } catch (e) {
                    console.error("Gagal parsing pesan:", e);
                }
            };
        }

        return () => {
            if (ws.current && !user) {
                ws.current.close();
            }
        };
    }, [user]);

    const value = { resource, pppoeActive, hotspotActive, traffic, isConnected };
    
    return <MikrotikContext.Provider value={value}>{children}</MikrotikContext.Provider>;
};