import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { LayoutDashboard, Users, Tags, Calendar } from 'lucide-react';
import React from 'react';

// Lazy load pages for better performance
const UsuariosList = React.lazy(() => import('./pages/Usuarios/UsuariosList'));
const UsuarioForm = React.lazy(() => import('./pages/Usuarios/UsuarioForm'));
const CategoriasList = React.lazy(() => import('./pages/Categorias/CategoriasList'));
const PeriodosList = React.lazy(() => import('./pages/Periodos/PeriodosList'));

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Usuarios', path: '/usuarios', icon: Users },
    { name: 'Categorias', path: '/categorias', icon: Tags },
    { name: 'Períodos', path: '/periodos', icon: Calendar },
  ];

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Tags size={20} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 0 }}>CoopFinance</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Admin Dashboard</span>
        </div>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={clsx('nav-link', isActive && 'active')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              <item.icon size={20} />
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
          <React.Suspense fallback={<div style={{ padding: 40, color: 'var(--text-secondary)' }}>Cargando módulo...</div>}>
            <Routes>
              <Route path="/" element={<div className="animate-fade-in"><h1>Dashboard</h1><p style={{color: 'var(--text-secondary)'}}>Selecciona un módulo en la barra lateral.</p></div>} />
              <Route path="/usuarios" element={<UsuariosList />} />
              <Route path="/usuarios/new" element={<UsuarioForm />} />
              <Route path="/usuarios/:id" element={<UsuarioForm />} />
              <Route path="/categorias" element={<CategoriasList />} />
              <Route path="/periodos" element={<PeriodosList />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
