import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { UIProvider } from './context/UIContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ToastContainer from './components/common/Toast';
import ConfirmationDialog from './components/common/ConfirmationDialog';
import SessionTimeoutHandler from './components/common/SessionTimeoutHandler';

// Lazy-Loaded Pages
const Landing = lazy(() => import('./pages/Landing'));
const PortalSelection = lazy(() => import('./pages/PortalSelection'));
const Login = lazy(() => import('./pages/Login'));
const FirstTimeSetup = lazy(() => import('./pages/FirstTimeSetup'));
const ForceChangePassword = lazy(() => import('./pages/ForceChangePassword'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const FarmersList = lazy(() => import('./pages/admin/FarmersList'));
const FarmerForm = lazy(() => import('./pages/admin/FarmerForm'));
const FarmerDetails = lazy(() => import('./pages/admin/FarmerDetails'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const BackupManager = lazy(() => import('./pages/admin/BackupManager'));
const RestoreManager = lazy(() => import('./pages/admin/RestoreManager'));
const SecuritySettings = lazy(() => import('./pages/admin/SecuritySettings'));
const About = lazy(() => import('./pages/admin/About'));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const Collections = lazy(() => import('./pages/admin/Collections'));
const CollectionEntry = lazy(() => import('./pages/employee/CollectionEntry'));
const ShiftHistory = lazy(() => import('./pages/employee/ShiftHistory'));
const RateChartsList = lazy(() => import('./pages/admin/RateChartsList'));
const RateChartForm = lazy(() => import('./pages/admin/RateChartForm'));
const RateChartView = lazy(() => import('./pages/admin/RateChartView'));
const GenerateBill = lazy(() => import('./pages/admin/GenerateBill'));
const InvoicesList = lazy(() => import('./pages/admin/InvoicesList'));
const InvoiceDetails = lazy(() => import('./pages/admin/InvoiceDetails'));
const PaymentsList = lazy(() => import('./pages/admin/PaymentsList'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AdminFarmerPassbook = lazy(() => import('./pages/admin/FarmerPassbook'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const CommunicationCenter = lazy(() => import('./pages/admin/CommunicationCenter'));
const PrintInvoice = lazy(() => import('./pages/admin/print/PrintInvoice'));
const PrintPassbook = lazy(() => import('./pages/admin/print/PrintPassbook'));
const PrintCollections = lazy(() => import('./pages/admin/print/PrintCollections'));
const PrintMonthly = lazy(() => import('./pages/admin/print/PrintMonthly'));
const PrintPayment = lazy(() => import('./pages/admin/print/PrintPayment'));

// Lazy-Loaded Error Pages
const Unauthorized = lazy(() => import('./pages/error/Unauthorized'));
const AccessDenied = lazy(() => import('./pages/error/AccessDenied'));
const NotFound = lazy(() => import('./pages/error/NotFound'));
const ServerError = lazy(() => import('./pages/error/ServerError'));

// Farmer Portal Lazy-Loaded Pages
const FarmerLogin = lazy(() => import('./pages/FarmerLogin'));
const FarmerFirstLogin = lazy(() => import('./pages/FarmerFirstLogin'));
const FarmerForgotPassword = lazy(() => import('./pages/FarmerForgotPassword'));
const FarmerDashboard = lazy(() => import('./pages/farmer/FarmerDashboard'));
const FarmerPassbook = lazy(() => import('./pages/farmer/FarmerPassbook'));
const FarmerNotifications = lazy(() => import('./pages/farmer/FarmerNotifications'));
const FarmerProfile = lazy(() => import('./pages/farmer/FarmerProfile'));
const FarmerChangePassword = lazy(() => import('./pages/farmer/FarmerChangePassword'));
const FarmerLayout = lazy(() => import('./components/layout/FarmerLayout'));

// Startup Redirection Guard
function StartupRedirector() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        const response = await axios.get(`${baseUrl}/api/v1/auth/setup-status`);
        if (response.data && response.data.success) {
          const setupRequired = response.data.data.setupRequired;
          if (setupRequired) {
            if (location.pathname !== '/setup') {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('sessionTimeout');
              navigate('/setup', { replace: true });
            }
          } else {
            if (location.pathname === '/setup') {
              navigate('/admin/login', { replace: true });
            }
          }
        }
      } catch (err) {
        console.error('Error checking setup status on startup:', err);
      }
    };
    checkSetup();
  }, [location.pathname, navigate]);

  return null;
}

// Farmer Route-Guard Component
function FarmerProtectedRoute() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    return <Navigate to="/farmer/login" replace />;
  }

  if (user.role !== 'farmer') {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}

// Route-Guard Component: Protects routes and verifies roles
function ProtectedRoute({ allowedRoles = [] }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Force password change check
  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}

// Layout wrapper for authenticated dashboard viewports
function DashboardLayout() {
  return (
    <div className="flex h-screen bg-[#FAF9F6] dark:bg-[#0B120F] overflow-hidden transition-colors duration-250 relative">
      
      {/* Light Ivory Base with Soft Mint (Top) & Lavender (Bottom) Glows */}
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
      
      {/* Sidebar Nav */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pl-64">
        
        {/* Dynamic Header */}
        <Header />

        {/* Inner Page View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Routes>
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/farmers" element={<FarmersList />} />
              <Route path="admin/farmers/new" element={<FarmerForm />} />
              <Route path="admin/farmers/:id/edit" element={<FarmerForm />} />
              <Route path="admin/farmers/:id" element={<FarmerDetails />} />
              <Route path="admin/rates" element={<RateChartsList />} />
              <Route path="admin/rates/new" element={<RateChartForm />} />
              <Route path="admin/rates/:id/edit" element={<RateChartForm />} />
              <Route path="admin/rates/:id" element={<RateChartView />} />
              <Route path="admin/collections" element={<Collections />} />
              <Route path="admin/billing/generate" element={<GenerateBill />} />
              <Route path="admin/invoices" element={<InvoicesList />} />
              <Route path="admin/invoices/:id" element={<InvoiceDetails />} />
              <Route path="admin/payments" element={<PaymentsList />} />
              <Route path="admin/reports" element={<Reports />} />
              <Route path="admin/passbook" element={<AdminFarmerPassbook />} />
              <Route path="admin/analytics" element={<Analytics />} />
              <Route path="admin/communication" element={<CommunicationCenter />} />
              <Route path="admin/settings" element={<Settings />} />
              <Route path="admin/users" element={<UserManagement />} />
              <Route path="admin/backup" element={<BackupManager />} />
              <Route path="admin/restore" element={<RestoreManager />} />
            </Route>

            {/* Shared Authenticated Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'employee']} />}>
              <Route path="admin/security" element={<SecuritySettings />} />
              <Route path="admin/about" element={<About />} />
            </Route>

            {/* Employee Routes */}
            <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
              <Route path="employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="employee/farmers" element={<FarmersList />} />
              <Route path="employee/farmers/:id" element={<FarmerDetails />} />
              <Route path="employee/collection-entry" element={<CollectionEntry />} />
              <Route path="employee/history" element={<ShiftHistory />} />
            </Route>
          </Routes>
        </main>

      </div>
    </div>
  );
}

function App() {
  const { i18n } = useTranslation();

  React.useEffect(() => {
    // Persistent Theme Check
    const activeTheme = localStorage.getItem('theme') || 'light';
    const root = window.document.documentElement;
    if (activeTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persistent Language Check
    const activeLanguage = localStorage.getItem('language') || 'en';
    i18n.changeLanguage(activeLanguage);
  }, [i18n]);

  const LoadingFallback = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center">
      <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Loading page resources...</p>
    </div>
  );

  return (
    <UIProvider>
      <Router>
        {/* Startup redirection logic */}
        <StartupRedirector />

        {/* Track user inactivity for auto-logout timeouts */}
        <SessionTimeoutHandler />

        {/* Toast Trays & Confirmation Modal overlays */}
        <ToastContainer />
        <ConfirmationDialog />

        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Landing & Login Screens */}
            <Route path="/" element={<Landing />} />
            <Route path="/portal-select" element={<PortalSelection />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/setup" element={<FirstTimeSetup />} />
            <Route path="/change-password" element={<ForceChangePassword />} />

            {/* Farmer Portal Routes */}
            <Route path="/farmer/login" element={<FarmerLogin />} />
            <Route path="/farmer/first-login" element={<FarmerFirstLogin />} />
            <Route path="/farmer/forgot-password" element={<FarmerForgotPassword />} />
            <Route element={<FarmerProtectedRoute />}>
              <Route path="/farmer" element={<FarmerLayout />}>
                <Route index element={<Navigate to="/farmer/dashboard" replace />} />
                <Route path="dashboard" element={<FarmerDashboard />} />
                <Route path="passbook" element={<FarmerPassbook />} />
                <Route path="notifications" element={<FarmerNotifications />} />
                <Route path="profile" element={<FarmerProfile />} />
                <Route path="change-password" element={<FarmerChangePassword />} />
              </Route>
            </Route>

            {/* Branded Error Routes */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/server-error" element={<ServerError />} />

            {/* Print Preview Routes (no sidebar/header) */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'employee']} />}>
              <Route path="/admin/print/invoice/:id" element={<PrintInvoice />} />
              <Route path="/admin/print/passbook/:farmerId" element={<PrintPassbook />} />
              <Route path="/admin/print/collections" element={<PrintCollections />} />
              <Route path="/admin/print/monthly" element={<PrintMonthly />} />
              <Route path="/admin/print/payment/:id" element={<PrintPayment />} />
            </Route>

            {/* Authenticated Dashboard Sub-routes */}
            <Route path="/*" element={<DashboardLayout />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </UIProvider>
  );
}

export default App;
