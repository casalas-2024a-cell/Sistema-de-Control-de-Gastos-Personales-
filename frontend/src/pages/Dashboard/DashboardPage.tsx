import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, Clock, PieChart } from 'lucide-react';
import { getUser } from '../../lib/auth';

const API = 'http://localhost:3000/api/v1';

// Get current month/year for default filter
const now = new Date();
const DEFAULT_MES = now.getMonth() + 1;
const DEFAULT_ANIO = now.getFullYear();

// [HU-06] Color map for budget status indicators
const ESTADO_COLOR = {
  OK: 'var(--success)',
  ADVERTENCIA: 'var(--warning)',
  EXCEDIDO: 'var(--danger)',
};

const ESTADO_BG = {
  OK: 'rgba(16,185,129,0.1)',
  ADVERTENCIA: 'rgba(245,158,11,0.1)',
  EXCEDIDO: 'rgba(239,68,68,0.1)',
};

// Reusable KPI summary card component
function KpiCard({ icon: Icon, label, value, color, sub }: any) {
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
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
        {sub && <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const usuario = getUser();
  const [mes, setMes] = useState(DEFAULT_MES);
  const [anio, setAnio] = useState(DEFAULT_ANIO);

  const [resumen, setResumen] = useState<any>(null);
  const [gastosCat, setGastosCat] = useState<any[]>([]);
  const [presVsGasto, setPresVsGasto] = useState<any[]>([]);
  const [recientes, setRecientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, [mes, anio]);

  const fetchAll = async () => {
    setLoading(true);
    const params = `mes=${mes}&anio=${anio}`;
    try {
      // Fetch all 4 dashboard endpoints in parallel — best possible latency
      const [r, g, p, t] = await Promise.all([
        axios.get(`${API}/dashboard/resumen-mensual?${params}`),
        axios.get(`${API}/dashboard/gastos-por-categoria?${params}`),
        axios.get(`${API}/dashboard/presupuesto-vs-gasto?${params}`),
        axios.get(`${API}/dashboard/transacciones-recientes?take=5`),
      ]);
      setResumen(r.data.data);
      setGastosCat(g.data.data);
      setPresVsGasto(p.data.data);
      setRecientes(t.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatCurrency = (n: number) =>
    `$${n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1>Dashboard Financiero</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Bienvenido, <strong style={{ color: 'var(--text-primary)' }}>{usuario?.nombres ?? 'Usuario'}</strong>
          </p>
        </div>
        {/* Month/Year Selector */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={mes} onChange={e => setMes(+e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <input type="number" value={anio} min={2020} max={2100} onChange={e => setAnio(+e.target.value)}
            style={{ width: 90, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-secondary)' }}>
          Calculando resumen financiero...
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          {resumen && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
              <KpiCard icon={TrendingUp} label="Total Ingresos" value={formatCurrency(resumen.totalIngresos)}
                color="var(--success)" sub={`${resumen.cantidadIngresos} transacciones`} />
              <KpiCard icon={TrendingDown} label="Total Gastos" value={formatCurrency(resumen.totalGastos)}
                color="var(--danger)" sub={`${resumen.cantidadGastos} transacciones`} />
              <KpiCard
                icon={Wallet}
                label="Balance del Mes"
                value={formatCurrency(resumen.balance)}
                color={resumen.balance >= 0 ? 'var(--success)' : 'var(--danger)'}
                sub={resumen.balance >= 0 ? 'Saldo positivo ✓' : 'Déficit ⚠️'}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Expenses by Category */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <PieChart size={18} style={{ color: 'var(--brand-primary)' }} /> Gastos por Categoría
              </h2>
              {gastosCat.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sin gastos registrados.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {gastosCat.map((g, i) => {
                    const maxTotal = gastosCat[0]?.total || 1;
                    const pct = (g.total / maxTotal) * 100;
                    return (
                      <div key={g.categoriaId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.875rem' }}>
                          <span>{g.icono ? `${g.icono} ` : ''}{g.categoria}</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(g.total)}</span>
                        </div>
                        <div style={{ background: 'var(--bg-primary)', borderRadius: 999, height: 6 }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            borderRadius: 999,
                            background: `hsl(${250 - (i * 25)}, 70%, 60%)`,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Budget vs Actual (HU-06) */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Presupuesto vs Gasto
              </h2>
              {presVsGasto.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sin presupuestos configurados.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {presVsGasto.map(p => {
                    const color = ESTADO_COLOR[p.estado as keyof typeof ESTADO_COLOR];
                    const bg = ESTADO_BG[p.estado as keyof typeof ESTADO_BG];
                    return (
                      <div key={p.presupuestoId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.875rem' }}>
                          <span style={{ fontWeight: 500 }}>{p.icono ? `${p.icono} ` : ''}{p.categoria}</span>
                          <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>
                            {p.porcentaje.toFixed(1)}%
                          </span>
                        </div>
                        <div style={{ background: 'var(--bg-primary)', borderRadius: 999, height: 8 }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(p.porcentaje, 100)}%`,
                            borderRadius: 999,
                            background: color,
                            boxShadow: `0 0 8px ${color}60`,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          <span>Gastado: {formatCurrency(p.gastado)}</span>
                          <span>Límite: {formatCurrency(p.presupuesto)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} style={{ color: 'var(--brand-primary)' }} />
              <h2 style={{ fontSize: '1rem', margin: 0 }}>Transacciones Recientes</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(t.fecha).toLocaleDateString('es-CO')}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{t.categoria?.nombre}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.descripcion || '—'}</td>
                    <td style={{ fontWeight: 600, color: t.tipoTransaccion?.nombre === 'INGRESO' ? 'var(--success)' : 'var(--danger)' }}>
                      {t.tipoTransaccion?.nombre === 'INGRESO' ? '+' : '-'}{formatCurrency(t.monto)}
                    </td>
                  </tr>
                ))}
                {recientes.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>Sin transacciones recientes.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
