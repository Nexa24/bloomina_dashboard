import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminInventory from './pages/admin/AdminInventory';
import AdminMaterials from './pages/admin/AdminMaterials';
import AdminFinance from './pages/admin/AdminFinance';
import AdminPayments from './pages/admin/AdminPayments';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminMarketAnalytics from './pages/admin/AdminMarketAnalytics';
import AdminMarketing from './pages/admin/AdminMarketing';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminSystem from './pages/admin/AdminSystem';
import AdminSettings from './pages/admin/AdminSettings';

import AdminBrandReviews from './pages/admin/AdminBrandReviews';
import AdminHero from './pages/admin/AdminHero';
import AdminLeads from './pages/admin/AdminLeads';

import { AlertProvider } from './contexts/AlertContext';

import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <AlertProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Redirect root to admin dashboard */}
              <Route path="/" element={<Navigate to="/admin" replace />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />

                {/* General */}
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />

                {/* Catalog & Stock */}
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="materials" element={<AdminMaterials />} />

                {/* Finance & Analytics */}
                <Route path="finance" element={<AdminFinance />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="market-analytics" element={<AdminMarketAnalytics />} />

                {/* Marketing & Comms */}
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="hero" element={<AdminHero />} />
                <Route path="brand-reviews" element={<AdminBrandReviews />} />
                <Route path="inquiries" element={<AdminLeads />} />

                <Route path="coupons" element={<AdminCoupons />} />

                {/* Platform */}
                <Route path="system" element={<AdminSystem />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Catch-all for unknown routes */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Router>
        </AlertProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;

