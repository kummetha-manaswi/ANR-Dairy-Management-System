import React from 'react';
import { Outlet } from 'react-router-dom';
import FarmerSidebar from './FarmerSidebar';
import Header from './Header';

export default function FarmerLayout() {
  return (
    <div className="flex h-screen bg-[#FAF8F3] dark:bg-[#0B120F] overflow-hidden transition-colors duration-250 relative">
      
      {/* Light Warm Ivory Base with Soft Mint (Top) & Lavender (Bottom) Glows */}
      {/* Soft Mint Glow (Top Right) */}
      <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#98FBCB]/35 via-[#98FBCB]/10 to-transparent blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '10s' }} />
      
      {/* Subtle Lavender Glow (Bottom Left) */}
      <div className="absolute bottom-[-10%] left-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#EBE8FC]/30 via-[#EBE8FC]/8 to-transparent blur-[140px] pointer-events-none -z-10" />
      
      {/* Decorative Translucent Wave Contours (White Milk-Waves) */}
      <div className="absolute bottom-0 right-0 left-0 md:left-64 h-48 opacity-[0.6] dark:opacity-[0.03] pointer-events-none -z-10">
        <svg viewBox="0 0 1440 320" className="w-full h-full object-cover">
          <path fill="#FFFFFF" d="M0,224L60,202.7C120,181,240,139,360,138.7C480,139,600,181,720,208C840,235,960,245,1080,229.3C1200,213,1320,171,1380,149.3L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 left-0 md:left-64 h-48 opacity-[0.4] dark:opacity-[0.015] pointer-events-none -z-10">
        <svg viewBox="0 0 1440 320" className="w-full h-full object-cover">
          <path fill="#FFFFFF" d="M0,160L80,181.3C160,203,320,245,480,245.3C640,245,800,203,960,186.7C1120,171,1280,181,1360,186.7L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
      </div>
      
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
