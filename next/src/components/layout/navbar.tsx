'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, SlidersHorizontal, MapPin, Wifi, ShieldCheck } from 'lucide-react';

const navItems = [
  { icon: <Home size={24} />, label: 'Dashboard', href: '/dashboard' },
  { icon: <SlidersHorizontal size={24} />, label: 'Management', href: '/management' },
  { icon: <MapPin size={24} />, label: 'Location', href: '/location' },
  { icon: <Wifi size={24} />, label: 'Hotspot', href: '/hotspot' },
  { icon: <ShieldCheck size={24} />, label: 'SLA', href: '/sla' },
  { icon: <Settings size={24} />, label: 'Settings', href: '/settings' },
];

const Navbar = () => {
    const pathname = usePathname();
    return (
        <nav className="fixed bottom-6 inset-x-0 flex justify-center z-50">
            <div className="flex items-center gap-x-6 sm:gap-x-8 px-6 sm:px-8 py-3 bg-card/80 backdrop-blur-md rounded-full shadow-lg border">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`group flex flex-col items-center transition-colors duration-300 ${
                                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <div className="transition-transform duration-300 group-hover:-translate-y-1">{item.icon}</div>
                            <span className="absolute -bottom-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
export default Navbar;