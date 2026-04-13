// [FILE] frontend/src/pages/Resumen/ResumenPage.tsx
// HU-07 FRONTEND: Resumen Financiero Mensual
//
// CRITERIA IMPLEMENTED:
//   ☑ Consultar resumen de un período seleccionado (dropdown de períodos)
//   ☑ Total ingresos, total egresos, balance neto (KPI cards)
//   ☑ Desglose de gastos por categoría con participación porcentual (Donut chart)
//   ☑ Estado de cada presupuesto: cumplido/alerta/excedido (table with icons)
//   ☑ Consultable para cualquier período histórico (period selector)

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet,
  CheckCircle, AlertTriangle, XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API = 'http://localhost:3000/api/v1';

// Donut chart color palette — vibrant and distinguishable
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#84cc16'];

// Budget status icons and colors
const ESTADO_CONFIG = {
  CUMPLIDO: { icon: CheckCircle, color: 'var(--success)', label: 'Cumplido', bg: 'rgba(16,185,129,0.1)' },
  ADVERTENCIA: { icon: AlertTriangle, color: 'var(--warning)', label: 'En Alerta', bg: 'rgba(245,158,11,0.1)' },
  EXCEDIDO: { icon: XCircle, color: 'var(--danger)', label: 'Excedido', bg: 'rgba(239,68,68,0.1)' },
};

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
        {sub && <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function ResumenPage() {
  const { usuario } = useAuth();
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [resumen, setResumen] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/periodos`).then(res => {
      const p = res.data.data;
      setPeriodos(p);
      const activo = p.find((x: any) => x.estado === 'ACTIVO');
      if (activo) setSelectedPeriodo(String(activo.id));
    });
  }, []);

  useEffect(() => {
    if (selectedPeriodo) fetchResumen();
  }, [selectedPeriodo]);

  const fetchResumen = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/dashboard/resumen/${selectedPeriodo}`);
      setResumen(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatCurrency = (n: number) =>
    `$${n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Tooltip personalizado para el donut chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.[0]) {
      const d = payload[0].payload;
      return (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 600 }}>{d.categoria}</div>
          <div style={{ color: 'var(--text-secondary)' }}>{formatCurrency(d.total)} ({d.participacion}%)</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1>Resumen Financiero</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Evalúa tu salud financiera por período.</p>
        </div>
        {/* Period Selector — HU-07: "Se puede consultar para cualquier período histórico" */}
        <select value={selectedPeriodo} onChange={e => setSelectedPeriodo(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
          {periodos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} {p.estado === 'ACTIVO' ? '✦' : ''}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-secondary)' }}>
          Calculando resumen financiero...
        </div>
      ) : !resumen ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
          Selecciona un período para ver el resumen.
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            <KpiCard icon={TrendingUp} label="Total Ingresos" value={formatCurrency(resumen.totalIngresos)}
              color="var(--success)" sub={`${resumen.cantidadIngresos} transacciones`} />
            <KpiCard icon={TrendingDown} label="Total Gastos" value={formatCurrency(resumen.totalGastos)}
              color="var(--danger)" sub={`${resumen.cantidadGastos} transacciones`} />
            <KpiCard icon={Wallet} label="Balance Neto" value={formatCurrency(resumen.balance)}
              color={resumen.balance >= 0 ? 'var(--success)' : 'var(--danger)'}
              sub={resumen.balance >= 0 ? 'Saldo positivo ✓' : 'Déficit ⚠️'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* DONUT CHART — HU-07: "Desglose de gastos por categoría con participación porcentual" */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>Distribución de Gastos por Categoría</h2>
              {resumen.desglosePorCategoria.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: 32 }}>Sin egresos en este período.</p>
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
                      label={({ categoria, participacion }) => `${categoria} (${participacion}%)`}
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

            {/* BAR CHART — visual comparison of spending per category */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>Monto por Categoría</h2>
              {resumen.desglosePorCategoria.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: 32 }}>Sin datos.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={resumen.desglosePorCategoria} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <YAxis type="category" dataKey="categoria" tick={{ fill: 'var(--text-primary)', fontSize: 12 }} width={100} />
                    <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
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

          {/* BUDGET STATUS TABLE — HU-07: "Estado de cada presupuesto (cumplido, en alerta, excedido)" */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 14px' }}>
              <h2 style={{ fontSize: '1rem', margin: 0 }}>Estado de Presupuestos del Período</h2>
            </div>
            {resumen.estadoPresupuestos.length === 0 ? (
              <div style={{ padding: '24px 24px 32px', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
                No hay presupuestos configurados para este período.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Límite</th>
                    <th>Gastado</th>
                    <th>Uso</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.estadoPresupuestos.map((p: any) => {
                    const cfg = ESTADO_CONFIG[p.estado as keyof typeof ESTADO_CONFIG];
                    const Icon = cfg.icon;
                    return (
                      <tr key={p.presupuestoId}>
                        <td style={{ fontWeight: 500 }}>{p.icono ? `${p.icono} ` : ''}{p.categoria}</td>
                        <td>{formatCurrency(p.montoLimite)}</td>
                        <td style={{ color: p.estado === 'EXCEDIDO' ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 600 }}>
                          {formatCurrency(p.gastado)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: 999, height: 6 }}>
                              <div style={{
                                height: '100%', width: `${Math.min(p.porcentaje, 100)}%`,
                                borderRadius: 999, background: cfg.color,
                                transition: 'width 0.5s ease',
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
