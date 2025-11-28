import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/Layout';
import { useAuthStore } from './store/authStore';
import { ConfirmDialog } from './components/ConfirmDialog';

// Páginas
import { Printers } from './pages/Printers';
import { Products } from './pages/Products';
import { Production } from './pages/Production';
import { Simulation } from './pages/Simulation';
import { Filaments } from './pages/Filaments';
import { Orders } from './pages/Orders';
import { NewOrder } from './pages/NewOrder';
import { Marketplaces } from './pages/Marketplaces';
import { Expenses } from './pages/Expenses';
import { Settings } from './pages/Settings';
import { ImportOrders } from './pages/ImportOrders';

function App() {
  const { fetchProfile } = useAuthStore();

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    // ADICIONEI AS FLAGS AQUI PARA SUMIR OS AVISOS AMARELOS
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ConfirmDialog />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/printers" element={<Printers />} />
          <Route path="/products" element={<Products />} />
          <Route path="/filaments" element={<Filaments />} />
          <Route path="/marketplaces" element={<Marketplaces />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/production" element={<Production />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/new" element={<NewOrder />} />
          <Route path="/orders/edit/:id" element={<NewOrder />} />
          <Route path="/import" element={<ImportOrders />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;