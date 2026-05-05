// [FILE] frontend/src/pages/Dashboard/DashboardPage.tsx
// HU-07 + HU-10: Dashboard financiero mensual con KPIs, gráficos de barras/categoría,
// estado de presupuestos y últimas transacciones. Usa centralized api.ts.

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, Clock, PieChart, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../lib/api';

const now = new Date();
const DEFAULT_MES = now.getMonth() + 1;
const DEFAULT_ANIO = now.getFullYear();

const ESTADO_COLOR: Record<string, string> = {
  OK: 'var(--success)',
  ADVERTENCIA: 'var(--warning)',
  EXCEDIDO: 'var(--danger)',
  CUMPLIDO: 'var(--success)',
};
const ESTADO_BG: Record<string, string> = {
  OK: 'rgba(16,185,129,0.1)',
  ADVERTENCIA: 'rgba(245,158,11,0.1)',
  EXCEDIDO: 'rgba(239,68,68,0.1)',
  CUMPLIDO: 'rgba(16,185,129,0.1)',
};

function KpiCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: string; color: string; sub?: string;
}) {
  return (
    <div className="glass-panel" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}33`,
      }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
        {sub && <div style={{ color: 'var(--text-secondary)', fontSize: '0.73rem', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-panel" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg-tertiary)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, borderRadius: 6, background: 'var(--bg-tertiary)', width: '60%', marginBottom: 8 }} />
        <div style={{ height: 22, borderRadius: 6, background: 'var(--bg-tertiary)', width: '80%' }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [mes, setMes] = useState(DEFAULT_MES);
  const [anio, setAnio] = useState(DEFAULT_ANIO);
  const [resumen, setResumen] = useState<any>(null);
  const [gastosCat, setGastosCat] = useState<any[]>([]);
  const [presVsGasto, setPresVsGasto] = useState<any[]>([]);
  const [recientes, setRecientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, [mes, anio]);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [r, g, pv, t] = await Promise.all([
        dashboardApi.getResumenMensual(mes, anio),
        dashboardApi.getGastosPorCategoria(mes, anio),
        dashboardApi.getPresupuestoVsGasto(mes, anio),
        dashboardApi.getTransaccionesRecientes(5),
      ]);
      setResumen(r.data.data);
      setGastosCat(g.data.data ?? []);
      setPresVsGasto(pv.data.data ?? []);
      setRecientes(t.data.data ?? []);
    } catch (e: any) {
      setError('Error al cargar el dashboard. Verifica tu conexión.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => `$${n.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Bienvenido/a, <strong style={{ color: 'var(--text-primary)' }}>{usuario?.nombres ?? 'Usuario'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={mes}
            onChange={e => setMes(+e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
          >
            {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <input
            type="number" value={anio} min={2020} max={2100}
            onChange={e => setAnio(+e.target.value)}
            style={{ width: 90, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
          />
        </div>
      </div>

      {error && (
        <div style={{
          padding: '14px 20px', borderRadius: 10, marginBottom: 24,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: 'var(--danger)', fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : resumen ? (
          <>
            <KpiCard icon={TrendingUp} label="Total Ingresos" value={fmt(resumen.totalIngresos)} color="var(--success)" sub={`${resumen.cantidadIngresos} transacciones`} />
            <KpiCard icon={TrendingDown} label="Total Gastos" value={fmt(resumen.totalGastos)} color="var(--danger)" sub={`${resumen.cantidadGastos} transacciones`} />
            <KpiCard
              icon={Wallet} label="Balance"
              value={fmt(resumen.balance)}
              color={resumen.balance >= 0 ? 'var(--success)' : 'var(--danger)'}
              sub={resumen.balance >= 0 ? 'Saldo positivo ✓' : 'Déficit ⚠️'}
            />
          </>
        ) : (
          <div style={{ gridColumn: 'span 3', color: 'var(--text-secondary)', padding: 24, textAlign: 'center' }}>
            No hay datos para {MESES[mes - 1]} {anio}.
          </div>
        )}
      </div>

      {/* Charts Row */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Gastos por Categoría */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <PieChart size={18} style={{ color: 'var(--brand-primary)' }} /> Gastos por Categoría
            </h2>
            {gastosCat.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
                Sin gastos registrados en este período.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {gastosCat.map((g, i) => {
                  const maxT = gastosCat[0]?.total || 1;
                  return (
                    <div key={g.categoriaId || i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.875rem' }}>
                        <span>{g.icono || ''} {g.categoria}
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: 6 }}>({g.participacion}%)</span>
                        </span>
                        <span style={{ fontWeight: 600 }}>{fmt(g.total)}</span>
                      </div>
                      <div style={{ background: 'var(--bg-primary)', borderRadius: 999, height: 7 }}>
                        <div style={{
                          height: '100%',
                          width: `${(g.total / maxT) * 100}%`,
                          borderRadius: 999,
                          background: `hsl(${250 - i * 28}, 70%, 60%)`,
                          transition: 'width 0.5s',
                          boxShadow: `0 0 8px hsl(${250 - i * 28}, 70%, 60%)40`,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Presupuesto vs Gasto */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Presupuesto vs Gasto
            </h2>
            {presVsGasto.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>💰</div>
                Sin presupuestos definidos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {presVsGasto.map(p => {
                  const color = ESTADO_COLOR[p.estado] || ESTADO_COLOR.OK;
                  const bg = ESTADO_BG[p.estado] || ESTADO_BG.OK;
                  return (
                    <div key={p.presupuestoId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: 500 }}>{p.icono || ''} {p.categoria}</span>
                        <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>
                          {p.porcentaje.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ background: 'var(--bg-primary)', borderRadius: 999, height: 8 }}>
                        <div style={{
                          height: '100%', width: `${Math.min(p.porcentaje, 100)}%`,
                          borderRadius: 999, background: color,
                          boxShadow: `0 0 8px ${color}60`, transition: 'width 0.6s',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <span>Gastado: {fmt(p.gastado)}</span>
                        <span>Límite: {fmt(p.presupuesto)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {!loading && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} style={{ color: 'var(--brand-primary)' }} />
            <h2 style={{ fontSize: '1rem', margin: 0 }}>Últimas Transacciones</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {recientes.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
                    Sin transacciones recientes.
                  </td>
                </tr>
              ) : (
                recientes.map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(t.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t.categoria?.nombre}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.descripcion || '—'}</td>
                    <td style={{
                      textAlign: 'right', paddingRight: 24,
                      fontWeight: 700,
                      color: t.tipoTransaccion?.nombre === 'INGRESO' ? 'var(--success)' : 'var(--danger)',
                    }}>
                      {t.tipoTransaccion?.nombre === 'INGRESO' ? '+' : '-'}{fmt(t.monto)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading state for charts/table */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[1, 2].map(i => (
              <div key={i} className="glass-panel">
                <div style={{ height: 16, borderRadius: 6, background: 'var(--bg-tertiary)', width: '50%', marginBottom: 20 }} />
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} style={{ marginBottom: 16 }}>
                    <div style={{ height: 12, borderRadius: 6, background: 'var(--bg-tertiary)', marginBottom: 8 }} />
                    <div style={{ height: 7, borderRadius: 999, background: 'var(--bg-tertiary)' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12, color: 'var(--text-secondary)' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Cargando datos del dashboard...
          </div>
        </div>
      )}
    </div>
  );
}
