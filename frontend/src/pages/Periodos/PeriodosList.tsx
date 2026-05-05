// [FILE] frontend/src/pages/Periodos/PeriodosList.tsx
// HU-03 + HU-10: Gestión de Períodos contables con toast, loading states y validación cliente.

import { useState, useEffect } from 'react';
import { Pencil, Play, Pause, Save, X, Calendar, Loader, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { periodosApi } from '../../lib/api';

interface Periodo {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export default function PeriodosList() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', fechaInicio: '', fechaFin: '', estado: 'INACTIVO' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPeriodos(); }, []);

  const fetchPeriodos = async () => {
    setLoading(true);
    try {
      const res = await periodosApi.getAll();
      setPeriodos(res.data.data ?? []);
    } catch (e) {
      toast.error('Error al cargar períodos');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!form.fechaInicio) errs.fechaInicio = 'La fecha de inicio es obligatoria';
    if (!form.fechaFin) errs.fechaFin = 'La fecha de fin es obligatoria';
    if (form.fechaInicio && form.fechaFin && form.fechaFin <= form.fechaInicio) {
      errs.fechaFin = 'La fecha de fin debe ser posterior a la de inicio';
    }
    return errs;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      if (isEditing && editId) {
        await periodosApi.update(editId, form);
        toast.success('✅ Período actualizado correctamente');
      } else {
        await periodosApi.create(form);
        toast.success('✅ Período creado correctamente');
      }
      resetForm();
      fetchPeriodos();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al guardar'));
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (p: Periodo) => {
    const nuevoEstado = p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await periodosApi.update(p.id, { estado: nuevoEstado });
      toast.success(`Período ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'}`);
      fetchPeriodos();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al cambiar estado'));
    }
  };

  const resetForm = () => {
    setForm({ nombre: '', fechaInicio: '', fechaFin: '', estado: 'INACTIVO' });
    setIsEditing(false);
    setEditId(null);
    setErrors({});
    setShowForm(false);
  };

  const openEdit = (p: Periodo) => {
    setForm({
      nombre: p.nombre,
      fechaInicio: p.fechaInicio.split('T')[0],
      fechaFin: p.fechaFin.split('T')[0],
      estado: p.estado,
    });
    setEditId(p.id);
    setIsEditing(true);
    setShowForm(true);
    setErrors({});
  };

  const activeCount = periodos.filter(p => p.estado === 'ACTIVO').length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Calendar size={28} style={{ color: 'var(--brand-primary)' }} />
            Períodos Contables
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Organiza bloques temporales para tus transacciones.
            {activeCount > 0 && (
              <span style={{ marginLeft: 10, color: 'var(--success)', fontWeight: 600 }}>
                ● 1 período activo
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (isEditing) resetForm(); }}
          className="btn btn-primary"
          id="btn-nuevo-periodo"
        >
          {showForm && !isEditing ? <X size={18} /> : <PlusCircle size={18} />}
          {showForm && !isEditing ? 'Cancelar' : 'Nuevo Período'}
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>
            {isEditing ? 'Editar Período' : 'Nuevo Período'}
          </h2>
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Nombre del Período *</label>
              <input
                type="text"
                id="periodo-nombre"
                value={form.nombre}
                onChange={e => { setForm({ ...form, nombre: e.target.value }); setErrors(p => ({ ...p, nombre: '' })); }}
                placeholder="Ej: Mayo 2025"
                style={{ borderColor: errors.nombre ? 'var(--danger)' : undefined }}
              />
              {errors.nombre && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.nombre}</span>}
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Fecha Inicio *</label>
              <input
                type="date"
                id="periodo-fechaInicio"
                value={form.fechaInicio}
                onChange={e => { setForm({ ...form, fechaInicio: e.target.value }); setErrors(p => ({ ...p, fechaInicio: '' })); }}
                style={{ borderColor: errors.fechaInicio ? 'var(--danger)' : undefined }}
              />
              {errors.fechaInicio && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.fechaInicio}</span>}
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Fecha Fin *</label>
              <input
                type="date"
                id="periodo-fechaFin"
                value={form.fechaFin}
                onChange={e => { setForm({ ...form, fechaFin: e.target.value }); setErrors(p => ({ ...p, fechaFin: '' })); }}
                style={{ borderColor: errors.fechaFin ? 'var(--danger)' : undefined }}
              />
              {errors.fechaFin && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.fechaFin}</span>}
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="INACTIVO">INACTIVO</option>
                <option value="ACTIVO">ACTIVO</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: '20px' }}>
              {isEditing && (
                <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ padding: '10px 14px' }}>
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                {isEditing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Período</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right', paddingRight: 24 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5].map(j => (
                    <td key={j}>
                      <div style={{ height: 16, borderRadius: 6, background: 'var(--bg-tertiary)', width: '80%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : periodos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '48px 24px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>📅</div>
                  No hay períodos registrados. ¡Crea el primer período!
                </td>
              </tr>
            ) : (
              periodos.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {new Date(p.fechaInicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {new Date(p.fechaFin).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                      background: p.estado === 'ACTIVO' ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)',
                      color: p.estado === 'ACTIVO' ? 'var(--success)' : 'var(--text-secondary)',
                    }}>
                      {p.estado === 'ACTIVO' ? '● ACTIVO' : '○ INACTIVO'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 16 }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => toggleEstado(p)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px' }}
                        title={p.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                      >
                        {p.estado === 'ACTIVO' ? <Pause size={15} /> : <Play size={15} />}
                      </button>
                      <button onClick={() => openEdit(p)} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Editar">
                        <Pencil size={15} />
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
