import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Tags, Calendar, ArrowLeftRight,
  PiggyBank, LogOut, FileBarChart,
} from 'lucide-react';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy-loaded pages — only loaded when the user navigates to them
const LoginPage = React.lazy(() => import('./pages/Auth/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/Dashboard/DashboardPage'));
const ResumenPage = React.lazy(() => import('./pages/Resumen/ResumenPage'));
const UsuariosList = React.lazy(() => import('./pages/Usuarios/UsuariosList'));
const UsuarioForm = React.lazy(() => import('./pages/Usuarios/UsuarioForm'));
const CategoriasList = React.lazy(() => import('./pages/Categorias/CategoriasList'));
const PeriodosList = React.lazy(() => import('./pages/Periodos/PeriodosList'));
const TransaccionesList = React.lazy(() => import('./pages/Transacciones/TransaccionesList'));
const PresupuestosList = React.lazy(() => import('./pages/Presupuestos/PresupuestosList'));

// [HU-09] ProtectedRoute: Uses AuthContext (not raw localStorage)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; // Waiting for localStorage rehydration
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Resumen', path: '/resumen', icon: FileBarChart },
  { name: 'Transacciones', path: '/transacciones', icon: ArrowLeftRight },
  { name: 'Presupuestos', path: '/presupuestos', icon: PiggyBank },
  { name: 'Categorias', path: '/categorias', icon: Tags },
  { name: 'Períodos', path: '/periodos', icon: Calendar },
  { name: 'Usuarios', path: '/usuarios', icon: Users },
];

function Sidebar() {
  const location = useLocation();
  const { usuario, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PiggyBank size={20} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.05rem', marginBottom: 0 }}>CoopFinance</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Panel de Control</span>
        </div>
      </div>

      {usuario && (
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: '10px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0, color: 'white' }}>
            {usuario.nombres?.[0]?.toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario.nombres} {usuario.apellidos}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{usuario.email}</div>
          </div>
        </div>
      )}

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.name} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 14px', borderRadius: '8px',
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
              textDecoration: 'none', fontWeight: isActive ? 600 : 400,
              fontSize: '0.875rem', transition: 'all 0.15s',
              borderLeft: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent',
            }}>
              <item.icon size={17} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <button onClick={logout} className="btn btn-secondary"
        style={{ marginTop: 'auto', width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '10px 14px' }}>
        <LogOut size={16} /> Cerrar Sesión
      </button>
    </aside>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <React.Suspense fallback={<div style={{ padding: 40, color: 'var(--text-secondary)' }}>Cargando...</div>}>
          {children}
        </React.Suspense>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/resumen" element={<ProtectedRoute><AppLayout><ResumenPage /></AppLayout></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><AppLayout><UsuariosList /></AppLayout></ProtectedRoute>} />
      <Route path="/usuarios/new" element={<ProtectedRoute><AppLayout><UsuarioForm /></AppLayout></ProtectedRoute>} />
      <Route path="/usuarios/:id" element={<ProtectedRoute><AppLayout><UsuarioForm /></AppLayout></ProtectedRoute>} />
      <Route path="/categorias" element={<ProtectedRoute><AppLayout><CategoriasList /></AppLayout></ProtectedRoute>} />
      <Route path="/periodos" element={<ProtectedRoute><AppLayout><PeriodosList /></AppLayout></ProtectedRoute>} />
      <Route path="/transacciones" element={<ProtectedRoute><AppLayout><TransaccionesList /></AppLayout></ProtectedRoute>} />
      <Route path="/presupuestos" element={<ProtectedRoute><AppLayout><PresupuestosList /></AppLayout></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }
        }} />
        <React.Suspense fallback={null}>
          <AppRoutes />
        </React.Suspense>
      </Router>
    </AuthProvider>
  );
}
