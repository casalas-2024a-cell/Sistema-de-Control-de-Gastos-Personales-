import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { LayoutDashboard, Users, Tags, Calendar, ArrowLeftRight, PiggyBank } from 'lucide-react';
import React from 'react';

// Lazy-loaded pages for code splitting (only loaded when navigated to)
const UsuariosList = React.lazy(() => import('./pages/Usuarios/UsuariosList'));
const UsuarioForm = React.lazy(() => import('./pages/Usuarios/UsuarioForm'));
const CategoriasList = React.lazy(() => import('./pages/Categorias/CategoriasList'));
const PeriodosList = React.lazy(() => import('./pages/Periodos/PeriodosList'));
// Sprint 2 pages
const TransaccionesList = React.lazy(() => import('./pages/Transacciones/TransaccionesList'));
const PresupuestosList = React.lazy(() => import('./pages/Presupuestos/PresupuestosList'));

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Usuarios', path: '/usuarios', icon: Users },
  { name: 'Categorias', path: '/categorias', icon: Tags },
  { name: 'Períodos', path: '/periodos', icon: Calendar },
  { name: 'Transacciones', path: '/transacciones', icon: ArrowLeftRight },
  { name: 'Presupuestos', path: '/presupuestos', icon: PiggyBank },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PiggyBank size={20} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 0 }}>CoopFinance</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Panel de Control</span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: '8px',
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.9rem',
                transition: 'all 0.18s',
                borderLeft: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent',
              }}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <React.Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
              Cargando módulo...
            </div>
          }>
            <Routes>
              <Route path="/" element={
                <div className="animate-fade-in">
                  <h1>Bienvenido a CoopFinance</h1>
                  <p style={{ color: 'var(--text-secondary)' }}>Selecciona un módulo en la barra lateral para comenzar.</p>
                </div>
              } />
              <Route path="/usuarios" element={<UsuariosList />} />
              <Route path="/usuarios/new" element={<UsuarioForm />} />
              <Route path="/usuarios/:id" element={<UsuarioForm />} />
              <Route path="/categorias" element={<CategoriasList />} />
              <Route path="/periodos" element={<PeriodosList />} />
              {/* Sprint 2 */}
              <Route path="/transacciones" element={<TransaccionesList />} />
              <Route path="/presupuestos" element={<PresupuestosList />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
