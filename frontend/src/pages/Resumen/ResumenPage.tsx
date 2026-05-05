// [FILE] frontend/src/pages/Resumen/ResumenPage.tsx
// HU-07 + HU-10: Resumen Financiero por período seleccionable con donut chart,
// bar chart, KPIs y tabla de estado de presupuestos. Usa centralized api.ts.

import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet,
  CheckCircle, AlertTriangle, XCircle, FileBarChart, Loader,
} from 'lucide-react';
import { dashboardApi, periodosApi } from '../../lib/api';

// Donut chart color palette
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#84cc16'];

const ESTADO_CONFIG = {
  OK:         { icon: CheckCircle,  color: 'var(--success)', label: 'En regla',   bg: 'rgba(16,185,129,0.1)' },
  CUMPLIDO:   { icon: CheckCircle,  color: 'var(--success)', label: 'Cumplido',   bg: 'rgba(16,185,129,0.1)' },
  ADVERTENCIA:{ icon: AlertTriangle,color: 'var(--warning)', label: 'En Alerta',  bg: 'rgba(245,158,11,0.1)' },
  EXCEDIDO:   { icon: XCircle,      color: 'var(--danger)',  label: 'Excedido',   bg: 'rgba(239,68,68,0.1)'  },
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
        {sub && <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload;
    return (
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem',
      }}>
        <div style={{ fontWeight: 600 }}>{d.categoria}</div>
        <div style={{ color: 'var(--text-secondary)' }}>
          ${d.total?.toLocaleString('es-CO', { minimumFractionDigits: 2 })} ({d.participacion}%)
        </div>
      </div>
    );
  }
  return null;
};

export default function ResumenPage() {
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [resumen, setResumen] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPeriodos, setLoadingPeriodos] = useState(true);

  useEffect(() => {
    setLoadingPeriodos(true);
    periodosApi.getAll()
      .then(res => {
        const ps = res.data.data ?? [];
        setPeriodos(ps);
        const activo = ps.find((x: any) => x.estado === 'ACTIVO');
        if (activo) setSelectedPeriodo(String(activo.id));
      })
      .catch(() => {})
      .finally(() => setLoadingPeriodos(false));
  }, []);

  useEffect(() => {
    if (selectedPeriodo) fetchResumen();
  }, [selectedPeriodo]);

  const fetchResumen = async () => {
    setLoading(true);
    setResumen(null);
    try {
      const res = await dashboardApi.getResumenPorPeriodo(Number(selectedPeriodo));
      setResumen(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    `$${n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileBarChart size={28} style={{ color: 'var(--brand-primary)' }} />
            Resumen Financiero
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Evalúa tu salud financiera por período.</p>
        </div>

        {/* Period Selector */}
        <div style={{ position: 'relative' }}>
          {loadingPeriodos ? (
            <div style={{ padding: '10px 16px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Cargando períodos...
            </div>
          ) : (
            <select
              value={selectedPeriodo}
              onChange={e => setSelectedPeriodo(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem', minWidth: 220 }}
            >
              <option value="">Seleccionar período...</option>
              {periodos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.estado === 'ACTIVO' ? '✦ Activo' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--text-secondary)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Calculando resumen financiero...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !resumen && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '64px 48px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📈</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: 8 }}>Selecciona un período</div>
          <div style={{ fontSize: '0.875rem' }}>Elige un período en el selector de arriba para ver tu resumen financiero.</div>
        </div>
      )}

      {/* Content */}
      {!loading && resumen && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            <KpiCard
              icon={TrendingUp} label="Total Ingresos"
              value={formatCurrency(resumen.totalIngresos)}
              color="var(--success)"
              sub={`${resumen.cantidadIngresos ?? 0} transacciones`}
            />
            <KpiCard
              icon={TrendingDown} label="Total Gastos"
              value={formatCurrency(resumen.totalGastos)}
              color="var(--danger)"
              sub={`${resumen.cantidadGastos ?? 0} transacciones`}
            />
            <KpiCard
              icon={Wallet} label="Balance Neto"
              value={formatCurrency(resumen.balance)}
              color={resumen.balance >= 0 ? 'var(--success)' : 'var(--danger)'}
              sub={resumen.balance >= 0 ? 'Saldo positivo ✓' : 'Déficit ⚠️'}
            />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Donut Chart */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>Distribución de Gastos por Categoría</h2>
              {!resumen.desglosePorCategoria?.length ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🥧</div>
                  Sin egresos registrados en este período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={resumen.desglosePorCategoria}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={100}
                      paddingAngle={3}
                      dataKey="total"
                      nameKey="categoria"
                      label={(props: any) => `${props.categoria ?? ''} (${props.participacion ?? 0}%)`}
                      labelLine={false}
                    >
                      {resumen.desglosePorCategoria.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar Chart */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>Monto por Categoría</h2>
              {!resumen.desglosePorCategoria?.length ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
                  Sin datos disponibles.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={resumen.desglosePorCategoria} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="categoria" tick={{ fill: 'var(--text-primary)', fontSize: 12 }} width={100} />
                    <Tooltip
                      formatter={(v: any) => [formatCurrency(v), 'Monto']}
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                      {resumen.desglosePorCategoria.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Budget Status Table */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 14px' }}>
              <h2 style={{ fontSize: '1rem', margin: 0 }}>Estado de Presupuestos del Período</h2>
            </div>
            {!resumen.estadoPresupuestos?.length ? (
              <div style={{ padding: '24px 24px 40px', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>💼</div>
                No hay presupuestos configurados para este período.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'right' }}>Límite</th>
                    <th style={{ textAlign: 'right' }}>Gastado</th>
                    <th>Uso</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.estadoPresupuestos.map((p: any) => {
                    const key = (p.estado as string) in ESTADO_CONFIG ? p.estado : 'OK';
                    const cfg = ESTADO_CONFIG[key as keyof typeof ESTADO_CONFIG];
                    const Icon = cfg.icon;
                    return (
                      <tr key={p.presupuestoId}>
                        <td style={{ fontWeight: 500 }}>{p.icono ? `${p.icono} ` : ''}{p.categoria}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(p.montoLimite)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: p.estado === 'EXCEDIDO' ? 'var(--danger)' : 'var(--text-primary)' }}>
                          {formatCurrency(p.gastado)}
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: 999, height: 6 }}>
                              <div style={{
                                height: '100%', width: `${Math.min(p.porcentaje, 100)}%`,
                                borderRadius: 999, background: cfg.color, transition: 'width 0.5s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: cfg.color, minWidth: 44, textAlign: 'right' }}>
                              {p.porcentaje.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: cfg.bg, color: cfg.color,
                            padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                          }}>
                            <Icon size={13} /> {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
