import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Pencil, Trash2, Save, X, Filter } from 'lucide-react';
import { clsx } from 'clsx';

const API = 'http://localhost:3000/api/v1';
const USUARIO_ID = 1; // Simulated - would come from auth context in production

interface Transaccion {
  id: number;
  monto: number;
  descripcion?: string;
  fecha: string;
  categoria: { nombre: string; tipo: string; icono?: string };
  tipoTransaccion: { nombre: string };
}

export default function TransaccionesList() {
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
  const [form, setForm] = useState({ monto: '', descripcion: '', fecha: '', tipoTransaccionId: '', categoriaId: '', periodoId: '' });
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [alertaMsg, setAlertaMsg] = useState<{ tipo: string; msg: string } | null>(null);

  useEffect(() => {
    // Load all catalog data on mount
    Promise.all([
      axios.get(`${API}/periodos`),
      axios.get(`${API}/categorias/usuario/${USUARIO_ID}`),
      axios.get(`${API}/tipo-transaccion`),
    ]).then(([p, c, t]) => {
      setPeriodos(p.data.data);
      setCategorias(c.data.data);
      setTiposTransaccion(t.data.data);
      // Auto-select the first active period
      const activo = p.data.data.find((x: any) => x.estado === 'ACTIVO');
      if (activo) setFiltroPeriodo(String(activo.id));
    });
  }, []);

  // [HU-04] Dynamic category filtering based on selected TipoTransaccion
  // When user picks "INGRESO" type, only show INGRESO categories — and vice versa.
  useEffect(() => {
    if (form.tipoTransaccionId) {
      const tipo = tiposTransaccion.find(t => String(t.id) === form.tipoTransaccionId);
      if (tipo) {
        const filtered = categorias.filter(c => c.tipo === tipo.nombre);
        setCategoriasFiltradas(filtered);
        setForm(f => ({ ...f, categoriaId: '' })); // Reset category when type changes
      }
    } else {
      setCategoriasFiltradas([]);
    }
  }, [form.tipoTransaccionId, tiposTransaccion, categorias]);

  useEffect(() => {
    if (filtroPeriodo) fetchTransacciones();
  }, [filtroPeriodo, filtroCategoria]);

  const fetchTransacciones = async () => {
    if (!filtroPeriodo) return;
    try {
      const params = new URLSearchParams({ periodoId: filtroPeriodo, usuarioId: String(USUARIO_ID) });
      if (filtroCategoria) params.append('categoriaId', filtroCategoria);
      const res = await axios.get(`${API}/transacciones?${params}`);
      setTransacciones(res.data.data);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg('');
    setAlertaMsg(null);
    try {
      const payload = {
        monto: parseFloat(form.monto),
        descripcion: form.descripcion,
        fecha: form.fecha,
        usuarioId: USUARIO_ID,
        categoriaId: parseInt(form.categoriaId),
        tipoTransaccionId: parseInt(form.tipoTransaccionId),
        periodoId: parseInt(form.periodoId),
      };

      let res;
      if (editId) {
        res = await axios.patch(`${API}/transacciones/${editId}`, payload);
      } else {
        res = await axios.post(`${API}/transacciones`, payload);
        // [HU-06] Check if budget alert was triggered
        if (res.data.data.alerta) {
          const a = res.data.data.alerta;
          setAlertaMsg({ tipo: a.tipoAlerta, msg: a.mensaje });
        }
      }
      resetForm();
      fetchTransacciones();
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Error al guardar la transacción');
    }
  };

  const resetForm = () => {
    setForm({ monto: '', descripcion: '', fecha: '', tipoTransaccionId: '', categoriaId: '', periodoId: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    try {
      await axios.delete(`${API}/transacciones/${id}`);
      fetchTransacciones();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleEdit = (t: any) => {
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
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1>Registro de Transacciones</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gestiona tus ingresos y egresos.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setAlertaMsg(null); }} className="btn btn-primary">
          {showForm ? <X size={18} /> : <PlusCircle size={18} />}
          {showForm ? 'Cancelar' : 'Nueva Transacción'}
        </button>
      </div>

      {/* Alert Banner (HU-06) */}
      {alertaMsg && (
        <div style={{
          padding: '14px 20px',
          borderRadius: 10,
          marginBottom: 20,
          background: alertaMsg.tipo === 'EXCEDIDO' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
          border: `1px solid ${alertaMsg.tipo === 'EXCEDIDO' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
          color: alertaMsg.tipo === 'EXCEDIDO' ? 'var(--danger)' : 'var(--warning)',
          fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          {alertaMsg.msg}
          <button onClick={() => setAlertaMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
        </div>
      )}

      {/* Transaction Form */}
      {showForm && (
        <div className="glass-panel" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>{editId ? 'Editar Transacción' : 'Nueva Transacción'}</h2>
          {errorMsg && <div style={{ color: 'var(--danger)', marginBottom: 14, fontSize: '0.875rem' }}>{errorMsg}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {/* Step 1: Tipo de Transacción */}
            <div className="input-group">
              <label>① Tipo de Transacción</label>
              <select value={form.tipoTransaccionId} onChange={e => setForm({ ...form, tipoTransaccionId: e.target.value })} required>
                <option value="">Seleccionar tipo...</option>
                {tiposTransaccion.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>

            {/* Step 2: Category filtered by Type */}
            <div className="input-group">
              <label>② Categoría ({form.tipoTransaccionId ? categoriasFiltradas.length : '—'} disponibles)</label>
              <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: e.target.value })} required disabled={!form.tipoTransaccionId}>
                <option value="">Seleccionar categoría...</option>
                {categoriasFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            {/* Step 3: Period */}
            <div className="input-group">
              <label>③ Período</label>
              <select value={form.periodoId} onChange={e => setForm({ ...form, periodoId: e.target.value })} required>
                <option value="">Seleccionar período...</option>
                {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Monto</label>
              <input type="number" step="0.01" min="0.01" placeholder="0.00" value={form.monto}
                onChange={e => setForm({ ...form, monto: e.target.value })} required />
            </div>

            <div className="input-group">
              <label>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
            </div>

            <div className="input-group">
              <label>Descripción (opcional)</label>
              <input type="text" placeholder="Nota..." value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            </div>

            <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={resetForm} className="btn btn-secondary"><X size={16} /> Cancelar</button>
              <button type="submit" className="btn btn-primary"><Save size={16} /> {editId ? 'Actualizar' : 'Registrar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
        <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
          <option value="">Todos los períodos</option>
          {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>)}
        </select>
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
              <th>Monto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transacciones.map(t => (
              <tr key={t.id}>
                <td style={{ fontSize: '0.85rem' }}>{new Date(t.fecha).toLocaleDateString('es-CO')}</td>
                <td>
                  <span style={{ fontWeight: 500 }}>{t.categoria.nombre}</span>
                </td>
                <td>
                  <span className={clsx('badge', t.tipoTransaccion.nombre === 'INGRESO' ? 'badge-success' : 'badge-danger')}>
                    {t.tipoTransaccion.nombre}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t.descripcion || '—'}</td>
                <td style={{ fontWeight: 600, color: t.tipoTransaccion.nombre === 'INGRESO' ? 'var(--success)' : 'var(--danger)' }}>
                  {t.tipoTransaccion.nombre === 'INGRESO' ? '+' : '-'}${t.monto.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEdit(t)} className="btn btn-secondary" style={{ padding: '6px 10px' }}><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(t.id)} className="btn btn-danger" style={{ padding: '6px 10px' }}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {transacciones.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
                {filtroPeriodo ? 'No hay transacciones para este período.' : 'Selecciona un período para ver transacciones.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
