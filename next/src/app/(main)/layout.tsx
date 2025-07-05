import React from 'react';
import Header from "@/components/layout/header";
import Navbar from "@/components/layout/navbar";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto pb-32">
        {children}
      </main>
      <Navbar />
    </div>
  );
}