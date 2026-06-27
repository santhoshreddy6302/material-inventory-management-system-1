import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <div className="absolute inset-0 z-0 bg-gradient-mesh opacity-50 pointer-events-none" />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 relative z-10 h-full">
        <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-fade-in relative">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
