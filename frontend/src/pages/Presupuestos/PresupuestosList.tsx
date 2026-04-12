import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Trash2, Save, X, TrendingUp, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

const API = 'http://localhost:3000/api/v1';
const USUARIO_ID = 1;

interface EstadoPresupuesto {
  id: number;
  categoria: { id: number; nombre: string; tipo: string; icono: string | null };
  montoLimite: number;
  totalGastado: number;
  porcentajeUso: number;
  estadoAlerta: 'OK' | 'ADVERTENCIA' | 'EXCEDIDO';
}

// [HU-06] Progress bar component with color coding.
// Green < 80%, Yellow 80–100%, Red > 100%
function BarraProgreso({ porcentaje, estado }: { porcentaje: number; estado: string }) {
  const colores = {
    OK: 'var(--success)',
    ADVERTENCIA: 'var(--warning)',
    EXCEDIDO: 'var(--danger)',
  };
  const bgColores = {
    OK: 'rgba(16,185,129,0.12)',
    ADVERTENCIA: 'rgba(245,158,11,0.12)',
    EXCEDIDO: 'rgba(239,68,68,0.12)',
  };
  const color = colores[estado as keyof typeof colores] || colores.OK;
  const bg = bgColores[estado as keyof typeof bgColores] || bgColores.OK;
  const width = Math.min(porcentaje, 100); // Cap bar at 100% width even if exceeded

  return (
    <div>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 999, height: 8, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          background: color,
          borderRadius: 999,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <span style={{ color, fontWeight: 600 }}>{porcentaje.toFixed(1)}% usado</span>
        {estado !== 'OK' && (
          <span style={{ 
            background: bg, 
            color, 
            padding: '2px 8px', 
            borderRadius: 999, 
            fontWeight: 600,
            fontSize: '0.7rem'
          }}>
            {estado === 'ADVERTENCIA' ? '⚠️ Advertencia' : '🔴 Excedido'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PresupuestosList() {
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [estados, setEstados] = useState<EstadoPresupuesto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoriaId: '', periodoId: '', montoLimite: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/periodos`),
      axios.get(`${API}/categorias/usuario/${USUARIO_ID}`),
    ]).then(([p, c]) => {
      setPeriodos(p.data.data);
      // Only show EGRESO categories for budgets (budgets cap spending, not income)
      setCategorias(c.data.data.filter((cat: any) => cat.tipo === 'EGRESO'));
      const activo = p.data.data.find((x: any) => x.estado === 'ACTIVO');
      if (activo) setFiltroPeriodo(String(activo.id));
    });
  }, []);

  useEffect(() => {
    if (filtroPeriodo) fetchEstados();
  }, [filtroPeriodo]);

  // [HU-06] Fetch budget status for the period — this calls GET /presupuestos/estado/:periodoId
  const fetchEstados = async () => {
    if (!filtroPeriodo) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/presupuestos/estado/${filtroPeriodo}?usuarioId=${USUARIO_ID}`);
      setEstados(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await axios.post(`${API}/presupuestos`, {
        usuarioId: USUARIO_ID,
        categoriaId: parseInt(form.categoriaId),
        periodoId: parseInt(form.periodoId),
        montoLimite: parseFloat(form.montoLimite),
      });
      setForm({ categoriaId: '', periodoId: '', montoLimite: '' });
      setShowForm(false);
      fetchEstados();
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Error al crear el presupuesto');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    try {
      await axios.delete(`${API}/presupuestos/${id}`);
      fetchEstados();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  // Summary stats for the header cards
  const excedidos = estados.filter(e => e.estadoAlerta === 'EXCEDIDO').length;
  const advertencias = estados.filter(e => e.estadoAlerta === 'ADVERTENCIA').length;
  const ok = estados.filter(e => e.estadoAlerta === 'OK').length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1>Gestión de Presupuestos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Controla tus límites de gasto por categoría.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchEstados} className="btn btn-secondary"><RefreshCw size={16} /></button>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? <X size={18} /> : <PlusCircle size={18} />}
            {showForm ? 'Cancelar' : 'Nuevo Presupuesto'}
          </button>
        </div>
      </div>

      {/* Summary Cards (HU-06) */}
      {estados.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'En regla', count: ok, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
            { label: 'Advertencia', count: advertencias, color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
            { label: 'Excedidos', count: excedidos, color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
          ].map(card => (
            <div key={card.label} className="glass-panel" style={{ textAlign: 'center', background: card.bg, border: `1px solid ${card.color}30` }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: card.color }}>{card.count}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="glass-panel" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Nuevo Presupuesto</h2>
          {errorMsg && <div style={{ color: 'var(--danger)', marginBottom: 14, fontSize: '0.875rem' }}>{errorMsg}</div>}
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Categoría (Gasto)</label>
              <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: e.target.value })} required>
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Período</label>
              <select value={form.periodoId} onChange={e => setForm({ ...form, periodoId: e.target.value })} required>
                <option value="">Seleccionar...</option>
                {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Monto Límite</label>
              <input type="number" step="0.01" min="0.01" placeholder="0.00" value={form.montoLimite}
                onChange={e => setForm({ ...form, montoLimite: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 46 }}>
              <Save size={16} /> Guardar
            </button>
          </form>
        </div>
      )}

      {/* Period Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <TrendingUp size={16} style={{ color: 'var(--text-secondary)' }} />
        <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
          <option value="">Seleccionar período...</option>
          {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.estado === 'ACTIVO' ? '(Activo)' : ''}</option>)}
        </select>
        {loading && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Calculando...</span>}
      </div>

      {/* Budget cards with progress bars (HU-06) */}
      {estados.length === 0 && !loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
          {filtroPeriodo ? 'No hay presupuestos definidos para este período.' : 'Selecciona un período para ver el estado de los presupuestos.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {estados.map(estado => (
            <div key={estado.id} className="glass-panel" style={{
              borderColor: estado.estadoAlerta === 'EXCEDIDO'
                ? 'rgba(239,68,68,0.3)'
                : estado.estadoAlerta === 'ADVERTENCIA'
                ? 'rgba(245,158,11,0.3)'
                : 'var(--glass-border)',
            }}>
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 2 }}>
                    {estado.categoria.icono && <span style={{ marginRight: 6 }}>{estado.categoria.icono}</span>}
                    {estado.categoria.nombre}
                  </div>
                  <span className={clsx('badge', 'badge-danger')} style={{ fontSize: '0.7rem' }}>EGRESO</span>
                </div>
                <button onClick={() => handleDelete(estado.id)} className="btn btn-danger" style={{ padding: '5px 8px' }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Amounts */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: 2 }}>Gastado</div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem', color: estado.estadoAlerta === 'EXCEDIDO' ? 'var(--danger)' : 'var(--text-primary)' }}>
                    ${estado.totalGastado.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: 2 }}>Límite</div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                    ${estado.montoLimite.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <BarraProgreso porcentaje={estado.porcentajeUso} estado={estado.estadoAlerta} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
