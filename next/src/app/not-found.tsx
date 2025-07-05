import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Home } from 'lucide-react';

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
            <div className="relative flex items-center justify-center">
                <ShieldAlert className="w-48 h-48 text-red-500/10" strokeWidth={0.5} />
                <div className="absolute flex flex-col items-center">
                    <p className="text-8xl md:text-9xl font-black text-red-500">404</p>
                    <p className="text-xl md:text-2xl font-bold mt-4">Page Not Found</p>
                </div>
            </div>
            
            <p className="mt-6 max-w-md text-lg text-gray-500 dark:text-gray-400">
                Waduh, kayaknya lo salah belok, bro. Halaman yang lo cari nggak ada di jaringan ini.
            </p>

            <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-transform hover:scale-105"
            >
                <Home size={18} />
                <span>Balik ke Dashboard</span>
            </Link>
        </div>
    );
};

export default NotFoundPage;