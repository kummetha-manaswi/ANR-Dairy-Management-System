import React from 'react';
import { Outlet } from 'react-router-dom';
import FarmerSidebar from './FarmerSidebar';
import Header from './Header';

export default function FarmerLayout() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-dark-main overflow-hidden transition-colors duration-200">
      
      {/* Farmer Navigation Sidebar */}
      <FarmerSidebar />

      {/* Content pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pl-64">
        
        {/* Dynamic header brand info */}
        <Header />

        {/* Viewport page container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
