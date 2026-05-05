// [FILE] frontend/src/pages/Presupuestos/PresupuestosList.tsx
// HU-05 + HU-06 + HU-10: Gestión de Presupuestos con barras de progreso,
// alertas de estado, validación cliente y centralized api.ts.

import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, Save, X, RefreshCw, Loader, PiggyBank } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { presupuestosApi, categoriasApi, periodosApi } from '../../lib/api';

interface EstadoPresupuesto {
  id: number;
  categoria: { id: number; nombre: string; tipo: string; icono: string | null };
  montoLimite: number;
  totalGastado: number;
  porcentajeUso: number;
  estadoAlerta: 'OK' | 'ADVERTENCIA' | 'EXCEDIDO';
}

function BarraProgreso({ porcentaje, estado }: { porcentaje: number; estado: string }) {
  const colores = { OK: 'var(--success)', ADVERTENCIA: 'var(--warning)', EXCEDIDO: 'var(--danger)' };
  const color = colores[estado as keyof typeof colores] || colores.OK;
  const width = Math.min(porcentaje, 100);
  return (
    <div>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 999, height: 8, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{
          height: '100%', width: `${width}%`,
          background: color, borderRadius: 999,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <span style={{ color, fontWeight: 600 }}>{porcentaje.toFixed(1)}% usado</span>
        {estado !== 'OK' && (
          <span style={{
            background: estado === 'EXCEDIDO' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
            color, padding: '1px 8px', borderRadius: 999, fontWeight: 700,
          }}>
            {estado === 'ADVERTENCIA' ? '⚠️ Advertencia' : '🔴 Excedido'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PresupuestosList() {
  const { usuario } = useAuth();
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [estados, setEstados] = useState<EstadoPresupuesto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoriaId: '', periodoId: '', montoLimite: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!usuario?.id) return;
    Promise.all([
      periodosApi.getAll(),
      categoriasApi.getByUsuario(usuario.id),
    ]).then(([p, c]) => {
      const ps = p.data.data ?? [];
      setPeriodos(ps);
      // Only EGRESO categories for budgets (budgets cap spending, not income)
      setCategorias((c.data.data ?? []).filter((cat: any) => cat.tipo === 'EGRESO'));
      const activo = ps.find((x: any) => x.estado === 'ACTIVO');
      if (activo) {
        setFiltroPeriodo(String(activo.id));
        setForm(f => ({ ...f, periodoId: String(activo.id) }));
      }
    }).catch(() => toast.error('Error al cargar datos'));
  }, [usuario]);

  const fetchEstados = useCallback(async () => {
    if (!filtroPeriodo || !usuario?.id) return;
    setLoading(true);
    try {
      const res = await presupuestosApi.getEstado(Number(filtroPeriodo), usuario.id);
      setEstados(res.data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filtroPeriodo, usuario]);

  useEffect(() => { fetchEstados(); }, [fetchEstados]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.categoriaId) errs.categoriaId = 'Selecciona una categoría';
    if (!form.periodoId) errs.periodoId = 'Selecciona un período';
    if (!form.montoLimite || parseFloat(form.montoLimite) <= 0) errs.montoLimite = 'El monto debe ser mayor a 0';
    return errs;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario?.id) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      await presupuestosApi.create({
        usuarioId: usuario.id,
        categoriaId: parseInt(form.categoriaId),
        periodoId: parseInt(form.periodoId),
        montoLimite: parseFloat(form.montoLimite),
      });
      toast.success('✅ Presupuesto creado correctamente');
      setForm({ categoriaId: '', periodoId: filtroPeriodo, montoLimite: '' });
      setShowForm(false);
      fetchEstados();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al crear el presupuesto'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este presupuesto? Las alertas asociadas también se eliminarán.')) return;
    try {
      await presupuestosApi.delete(id);
      toast.success('Presupuesto eliminado');
      fetchEstados();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al eliminar'));
    }
  };

  const excedidos = estados.filter(e => e.estadoAlerta === 'EXCEDIDO').length;
  const advertencias = estados.filter(e => e.estadoAlerta === 'ADVERTENCIA').length;
  const ok = estados.filter(e => e.estadoAlerta === 'OK').length;
  const fmtCurrency = (n: number) => `$${n.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PiggyBank size={28} style={{ color: 'var(--brand-primary)' }} />
            Gestión de Presupuestos
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Controla tus límites de gasto por categoría.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchEstados} className="btn btn-secondary" title="Refrescar datos">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary" id="btn-nuevo-presupuesto">
            {showForm ? <X size={18} /> : <PlusCircle size={18} />}
            {showForm ? 'Cancelar' : 'Nuevo Presupuesto'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {estados.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'En regla', count: ok, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
            { label: 'En advertencia', count: advertencias, color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)', icon: '⚠️' },
            { label: 'Excedidos', count: excedidos, color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)', icon: '🔴' },
          ].map(card => (
            <div key={card.label} className="glass-panel" style={{ textAlign: 'center', padding: '20px 24px', background: card.bg, border: `1px solid ${card.color}30` }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{card.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: card.color }}>{card.count}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Nuevo Presupuesto</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Categoría de Gasto *</label>
              <select
                id="pres-categoria"
                value={form.categoriaId}
                onChange={e => { setForm({ ...form, categoriaId: e.target.value }); setErrors(p => ({ ...p, categoriaId: '' })); }}
                style={{ borderColor: errors.categoriaId ? 'var(--danger)' : undefined }}
              >
                <option value="">Seleccionar categoría...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              {errors.categoriaId && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.categoriaId}</span>}
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Período *</label>
              <select
                id="pres-periodo"
                value={form.periodoId}
                onChange={e => { setForm({ ...form, periodoId: e.target.value }); setErrors(p => ({ ...p, periodoId: '' })); }}
                style={{ borderColor: errors.periodoId ? 'var(--danger)' : undefined }}
              >
                <option value="">Seleccionar período...</option>
                {periodos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.estado === 'ACTIVO' ? '(Activo)' : ''}</option>
                ))}
              </select>
              {errors.periodoId && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.periodoId}</span>}
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Monto Límite *</label>
              <input
                type="number" step="0.01" min="0.01" placeholder="0.00"
                id="pres-monto"
                value={form.montoLimite}
                onChange={e => { setForm({ ...form, montoLimite: e.target.value }); setErrors(p => ({ ...p, montoLimite: '' })); }}
                style={{ borderColor: errors.montoLimite ? 'var(--danger)' : undefined }}
              />
              {errors.montoLimite && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.montoLimite}</span>}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <button type="submit" className="btn btn-primary" id="btn-guardar-presupuesto" disabled={saving} style={{ height: 46 }}>
                {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Period Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Ver período:</label>
        <select
          value={filtroPeriodo}
          onChange={e => setFiltroPeriodo(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
        >
          <option value="">Seleccionar período...</option>
          {periodos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} {p.estado === 'ACTIVO' ? '● Activo' : ''}</option>
          ))}
        </select>
        {loading && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Calculando...
          </span>
        )}
      </div>

      {/* Budget Cards with progress bars */}
      {!loading && estados.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📊</div>
          {filtroPeriodo
            ? 'No hay presupuestos para este período. ¡Crea el primero!'
            : 'Selecciona un período para ver el estado de los presupuestos.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-panel">
                  <div style={{ height: 20, borderRadius: 6, background: 'var(--bg-tertiary)', marginBottom: 12 }} />
                  <div style={{ height: 14, borderRadius: 6, background: 'var(--bg-tertiary)', width: '60%', marginBottom: 20 }} />
                  <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-tertiary)' }} />
                </div>
              ))
            : estados.map(estado => (
                <div
                  key={estado.id}
                  className="glass-panel"
                  style={{
                    borderColor: estado.estadoAlerta === 'EXCEDIDO'
                      ? 'rgba(239,68,68,0.3)' : estado.estadoAlerta === 'ADVERTENCIA'
                      ? 'rgba(245,158,11,0.3)' : 'var(--glass-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                        {estado.categoria.icono && <span style={{ marginRight: 6 }}>{estado.categoria.icono}</span>}
                        {estado.categoria.nombre}
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
                        background: 'rgba(239,68,68,0.12)', color: 'var(--danger)',
                      }}>GASTO</span>
                    </div>
                    <button onClick={() => handleDelete(estado.id)} className="btn btn-danger" style={{ padding: '5px 8px' }} title="Eliminar presupuesto">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginBottom: 2 }}>Gastado</div>
                      <div style={{
                        fontWeight: 700, fontSize: '1.25rem',
                        color: estado.estadoAlerta === 'EXCEDIDO' ? 'var(--danger)' : 'var(--text-primary)',
                      }}>
                        {fmtCurrency(estado.totalGastado)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginBottom: 2 }}>Límite</div>
                      <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{fmtCurrency(estado.montoLimite)}</div>
                    </div>
                  </div>

                  <BarraProgreso porcentaje={estado.porcentajeUso} estado={estado.estadoAlerta} />
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
