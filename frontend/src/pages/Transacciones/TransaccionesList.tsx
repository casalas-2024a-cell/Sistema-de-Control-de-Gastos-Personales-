// [FILE] frontend/src/pages/Transacciones/TransaccionesList.tsx
// HU-04 + HU-10: Registro de Transacciones con select dinámico tipo→categoría,
// validación cliente, loading states, alertas de presupuesto (HU-06) y toasts.

import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Pencil, Trash2, Save, X, Filter, Loader, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { transaccionesApi, categoriasApi, periodosApi, tiposTransaccionApi } from '../../lib/api';

interface Transaccion {
  id: number;
  monto: number;
  descripcion?: string;
  fecha: string;
  tipoTransaccionId: number;
  categoriaId: number;
  periodoId: number;
  categoria: { nombre: string; tipo: string; icono?: string };
  tipoTransaccion: { nombre: string };
}

function LoadingRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i}>
          <div style={{ height: 14, borderRadius: 6, background: 'var(--bg-tertiary)', width: i === 6 ? '80px' : '90%' }} />
        </td>
      ))}
    </tr>
  );
}

export default function TransaccionesList() {
  const { usuario } = useAuth();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [tiposTransaccion, setTiposTransaccion] = useState<any[]>([]);

  // Filters
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    monto: '', descripcion: '', fecha: '', tipoTransaccionId: '', categoriaId: '', periodoId: ''
  });
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alertaMsg, setAlertaMsg] = useState<{ tipo: string; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!usuario?.id) return;
    Promise.all([
      periodosApi.getAll(),
      categoriasApi.getByUsuario(usuario.id),
      tiposTransaccionApi.getAll(),
    ]).then(([p, c, t]) => {
      setPeriodos(p.data.data ?? []);
      setCategorias(c.data.data ?? []);
      setTiposTransaccion(t.data.data ?? []);
      const activo = (p.data.data ?? []).find((x: any) => x.estado === 'ACTIVO');
      if (activo) {
        setFiltroPeriodo(String(activo.id));
        setForm(f => ({ ...f, periodoId: String(activo.id) }));
      }
    }).catch(() => toast.error('Error al cargar datos de referencia'));
  }, [usuario]);

  // Dynamic category filtering based on selected TipoTransaccion
  useEffect(() => {
    if (form.tipoTransaccionId) {
      const tipo = tiposTransaccion.find(t => String(t.id) === form.tipoTransaccionId);
      if (tipo) {
        const filtered = categorias.filter(c => c.tipo === tipo.nombre);
        setCategoriasFiltradas(filtered);
        setForm(f => ({ ...f, categoriaId: '' }));
      }
    } else {
      setCategoriasFiltradas([]);
    }
  }, [form.tipoTransaccionId, tiposTransaccion, categorias]);

  const fetchTransacciones = useCallback(async () => {
    if (!filtroPeriodo || !usuario?.id) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {
        periodoId: filtroPeriodo,
        usuarioId: String(usuario.id),
      };
      if (filtroCategoria) params.categoriaId = filtroCategoria;
      const res = await transaccionesApi.getAll(params);
      setTransacciones(res.data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filtroPeriodo, filtroCategoria, usuario]);

  useEffect(() => { fetchTransacciones(); }, [fetchTransacciones]);

  // Client-side validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.tipoTransaccionId) errs.tipoTransaccionId = 'Selecciona un tipo';
    if (!form.categoriaId) errs.categoriaId = 'Selecciona una categoría';
    if (!form.periodoId) errs.periodoId = 'Selecciona un período';
    if (!form.monto || parseFloat(form.monto) <= 0) errs.monto = 'El monto debe ser mayor a 0';
    if (!form.fecha) errs.fecha = 'La fecha es obligatoria';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario?.id) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setAlertaMsg(null);
    setSaving(true);
    try {
      const payload = {
        monto: parseFloat(form.monto),
        descripcion: form.descripcion,
        fecha: form.fecha,
        usuarioId: usuario.id,
        categoriaId: parseInt(form.categoriaId),
        tipoTransaccionId: parseInt(form.tipoTransaccionId),
        periodoId: parseInt(form.periodoId),
      };

      let res;
      if (editId) {
        res = await transaccionesApi.update(editId, payload);
        toast.success('✅ Transacción actualizada correctamente');
      } else {
        res = await transaccionesApi.create(payload);
        toast.success('✅ Transacción registrada correctamente');
        if (res.data.data?.alerta) {
          const a = res.data.data.alerta;
          setAlertaMsg({ tipo: a.tipoAlerta, msg: a.mensaje });
        }
      }
      resetForm();
      fetchTransacciones();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al guardar la transacción'));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ monto: '', descripcion: '', fecha: '', tipoTransaccionId: '', categoriaId: '', periodoId: filtroPeriodo });
    setEditId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta transacción? Esta acción no se puede deshacer.')) return;
    try {
      await transaccionesApi.delete(id);
      toast.success('Transacción eliminada');
      fetchTransacciones();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al eliminar'));
    }
  };

  const handleEdit = (t: Transaccion) => {
    setForm({
      monto: String(t.monto),
      descripcion: t.descripcion || '',
      fecha: t.fecha.split('T')[0],
      tipoTransaccionId: String(t.tipoTransaccionId),
      categoriaId: String(t.categoriaId),
      periodoId: String(t.periodoId),
    });
    setEditId(t.id);
    setShowForm(true);
    setAlertaMsg(null);
    setErrors({});
  };

  const fmtCurrency = (n: number) => `$${n.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;

  // Summary stats
  const totalIngresos = transacciones.filter(t => t.tipoTransaccion.nombre === 'INGRESO').reduce((s, t) => s + t.monto, 0);
  const totalEgresos = transacciones.filter(t => t.tipoTransaccion.nombre === 'EGRESO').reduce((s, t) => s + t.monto, 0);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ArrowLeftRight size={28} style={{ color: 'var(--brand-primary)' }} />
            Transacciones
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Gestiona tus ingresos y egresos.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (editId) resetForm(); }}
          className="btn btn-primary"
          id="btn-nueva-transaccion"
        >
          {showForm && !editId ? <X size={18} /> : <PlusCircle size={18} />}
          {showForm && !editId ? 'Cancelar' : 'Nueva Transacción'}
        </button>
      </div>

      {/* Summary KPIs (shown when period is selected) */}
      {filtroPeriodo && transacciones.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Ingresos del Período', value: fmtCurrency(totalIngresos), color: 'var(--success)' },
            { label: 'Egresos del Período', value: fmtCurrency(totalEgresos), color: 'var(--danger)' },
            { label: 'Balance', value: fmtCurrency(totalIngresos - totalEgresos), color: totalIngresos >= totalEgresos ? 'var(--success)' : 'var(--danger)' },
          ].map(card => (
            <div key={card.label} className="glass-panel" style={{ padding: '16px 20px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Budget Alert Banner (HU-06) */}
      {alertaMsg && (
        <div style={{
          padding: '14px 20px', borderRadius: 10, marginBottom: 20, fontWeight: 500,
          background: alertaMsg.tipo === 'EXCEDIDO' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
          border: `1px solid ${alertaMsg.tipo === 'EXCEDIDO' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
          color: alertaMsg.tipo === 'EXCEDIDO' ? 'var(--danger)' : 'var(--warning)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ flex: 1 }}>{alertaMsg.msg}</span>
          <button onClick={() => setAlertaMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Transaction Form */}
      {showForm && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>{editId ? 'Editar Transacción' : 'Nueva Transacción'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {/* Step 1: Type */}
            <div className="input-group">
              <label>① Tipo de Transacción *</label>
              <select
                id="txn-tipo"
                value={form.tipoTransaccionId}
                onChange={e => { setForm({ ...form, tipoTransaccionId: e.target.value }); setErrors(p => ({ ...p, tipoTransaccionId: '' })); }}
                style={{ borderColor: errors.tipoTransaccionId ? 'var(--danger)' : undefined }}
              >
                <option value="">Seleccionar tipo...</option>
                {tiposTransaccion.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
              {errors.tipoTransaccionId && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.tipoTransaccionId}</span>}
            </div>

            {/* Step 2: Category (dynamic, filtered by type) */}
            <div className="input-group">
              <label>② Categoría {form.tipoTransaccionId ? `(${categoriasFiltradas.length} disponibles)` : ''} *</label>
              <select
                id="txn-categoria"
                value={form.categoriaId}
                onChange={e => { setForm({ ...form, categoriaId: e.target.value }); setErrors(p => ({ ...p, categoriaId: '' })); }}
                disabled={!form.tipoTransaccionId}
                style={{ borderColor: errors.categoriaId ? 'var(--danger)' : undefined, opacity: !form.tipoTransaccionId ? 0.5 : 1 }}
              >
                <option value="">Seleccionar categoría...</option>
                {categoriasFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              {!form.tipoTransaccionId && <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Primero selecciona el tipo</span>}
              {errors.categoriaId && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.categoriaId}</span>}
            </div>

            {/* Step 3: Period */}
            <div className="input-group">
              <label>③ Período *</label>
              <select
                id="txn-periodo"
                value={form.periodoId}
                onChange={e => { setForm({ ...form, periodoId: e.target.value }); setErrors(p => ({ ...p, periodoId: '' })); }}
                style={{ borderColor: errors.periodoId ? 'var(--danger)' : undefined }}
              >
                <option value="">Seleccionar período...</option>
                {periodos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.estado === 'ACTIVO' ? '(Activo)' : ''}
                  </option>
                ))}
              </select>
              {errors.periodoId && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.periodoId}</span>}
            </div>

            <div className="input-group">
              <label>Monto *</label>
              <input
                type="number" step="0.01" min="0.01" placeholder="0.00"
                id="txn-monto"
                value={form.monto}
                onChange={e => { setForm({ ...form, monto: e.target.value }); setErrors(p => ({ ...p, monto: '' })); }}
                style={{ borderColor: errors.monto ? 'var(--danger)' : undefined }}
              />
              {errors.monto && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.monto}</span>}
            </div>

            <div className="input-group">
              <label>Fecha *</label>
              <input
                type="date"
                id="txn-fecha"
                value={form.fecha}
                onChange={e => { setForm({ ...form, fecha: e.target.value }); setErrors(p => ({ ...p, fecha: '' })); }}
                style={{ borderColor: errors.fecha ? 'var(--danger)' : undefined }}
              />
              {errors.fecha && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.fecha}</span>}
            </div>

            <div className="input-group">
              <label>Descripción (opcional)</label>
              <input
                type="text" placeholder="Nota sobre la transacción..."
                id="txn-descripcion"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                <X size={16} /> Cancelar
              </button>
              <button type="submit" className="btn btn-primary" id="btn-guardar-txn" disabled={saving}>
                {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                {editId ? 'Actualizar' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
        <select
          value={filtroPeriodo}
          onChange={e => setFiltroPeriodo(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
        >
          <option value="">Todos los períodos</option>
          {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>)}
        </select>
        {loading && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Cargando...
        </span>}
      </div>

      {/* Transactions Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th style={{ textAlign: 'right' }}>Monto</th>
              <th style={{ textAlign: 'right', paddingRight: 24 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <LoadingRow key={i} />)
            ) : transacciones.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '48px 24px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>💸</div>
                  {filtroPeriodo ? 'No hay transacciones para este período.' : 'Selecciona un período para ver transacciones.'}
                </td>
              </tr>
            ) : (
              transacciones.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(t.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ fontWeight: 500 }}>{t.categoria.nombre}</td>
                  <td>
                    <span style={{
                      padding: '3px 9px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                      background: t.tipoTransaccion.nombre === 'INGRESO' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: t.tipoTransaccion.nombre === 'INGRESO' ? 'var(--success)' : 'var(--danger)',
                    }}>
                      {t.tipoTransaccion.nombre}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t.descripcion || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: t.tipoTransaccion.nombre === 'INGRESO' ? 'var(--success)' : 'var(--danger)' }}>
                    {t.tipoTransaccion.nombre === 'INGRESO' ? '+' : '-'}{fmtCurrency(t.monto)}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 16 }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(t)} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="btn btn-danger" style={{ padding: '6px 10px' }} title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
