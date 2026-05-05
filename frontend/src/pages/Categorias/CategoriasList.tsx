// [FILE] frontend/src/pages/Categorias/CategoriasList.tsx
// HU-02 + HU-10: Gestión de Categorías con formulario inline, validación cliente, 
// estados de carga y toast notifications.

import { useState, useEffect } from 'react';
import { Pencil, Trash2, PlusCircle, Save, X, Loader, Tags } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { categoriasApi } from '../../lib/api';

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: 'INGRESO' | 'EGRESO';
}

// Skeleton loader row
function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3].map(i => (
        <td key={i}>
          <div style={{
            height: 16, borderRadius: 6,
            background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            width: i === 3 ? '60px' : '100%',
          }} />
        </td>
      ))}
    </tr>
  );
}

export default function CategoriasList() {
  const { usuario } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', tipo: 'EGRESO' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (usuario?.id) fetchCategorias();
  }, [usuario]);

  const fetchCategorias = async () => {
    if (!usuario?.id) return;
    setLoading(true);
    try {
      const res = await categoriasApi.getByUsuario(usuario.id);
      setCategorias(res.data.data ?? []);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  // Client-side validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    else if (form.nombre.trim().length < 2) errs.nombre = 'Mínimo 2 caracteres';
    return errs;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario?.id) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      if (isEditing && editId) {
        await categoriasApi.update(editId, { ...form, usuarioId: usuario.id });
        toast.success('✅ Categoría actualizada correctamente');
      } else {
        await categoriasApi.create({ ...form, usuarioId: usuario.id });
        toast.success('✅ Categoría creada correctamente');
      }
      resetForm();
      fetchCategorias();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al guardar'));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ nombre: '', descripcion: '', tipo: 'EGRESO' });
    setIsEditing(false);
    setEditId(null);
    setErrors({});
    setShowForm(false);
  };

  const openEdit = (cat: Categoria) => {
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '', tipo: cat.tipo });
    setEditId(cat.id);
    setIsEditing(true);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await categoriasApi.delete(id);
      toast.success('Categoría eliminada');
      fetchCategorias();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al eliminar'));
    }
  };

  const ingreso = categorias.filter(c => c.tipo === 'INGRESO');
  const egreso = categorias.filter(c => c.tipo === 'EGRESO');

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tags size={28} style={{ color: 'var(--brand-primary)' }} />
            Mis Categorías
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Clasifica tus transacciones financieras. 
            <span style={{ marginLeft: 12 }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{ingreso.length} ingresos</span>
              {' · '}
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{egreso.length} gastos</span>
            </span>
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (isEditing) resetForm(); }}
          className="btn btn-primary"
          id="btn-nueva-categoria"
        >
          {showForm && !isEditing ? <X size={18} /> : <PlusCircle size={18} />}
          {showForm && !isEditing ? 'Cancelar' : 'Nueva Categoría'}
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            {isEditing ? <Pencil size={18} style={{ color: 'var(--brand-primary)' }} /> : <PlusCircle size={18} style={{ color: 'var(--brand-primary)' }} />}
            {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>

          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Nombre *</label>
              <input
                type="text"
                id="cat-nombre"
                value={form.nombre}
                onChange={e => { setForm({ ...form, nombre: e.target.value }); setErrors(p => ({ ...p, nombre: '' })); }}
                placeholder="Ej: Alimentación, Salario..."
                style={{ borderColor: errors.nombre ? 'var(--danger)' : undefined }}
              />
              {errors.nombre && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.nombre}</span>}
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label>Descripción</label>
              <input
                type="text"
                id="cat-descripcion"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Descripción opcional..."
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label>Tipo *</label>
              <select
                id="cat-tipo"
                value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value })}
                disabled={isEditing} // Type cannot change after creation
              >
                <option value="EGRESO">💸 EGRESO (Gasto)</option>
                <option value="INGRESO">💰 INGRESO (Ganancia)</option>
              </select>
              {isEditing && <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>El tipo no se puede cambiar</span>}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: '20px' }}>
              {isEditing && (
                <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ padding: '10px 14px' }}>
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="btn btn-primary" id="btn-guardar-categoria" disabled={saving} style={{ whiteSpace: 'nowrap' }}>
                {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                {isEditing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th style={{ textAlign: 'right', paddingRight: 24 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : categorias.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '48px 24px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏷️</div>
                  Aún no hay categorías. ¡Crea tu primera categoría!
                </td>
              </tr>
            ) : (
              categorias.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {c.descripcion || <span style={{ opacity: 0.4 }}>Sin descripción</span>}
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: c.tipo === 'INGRESO' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: c.tipo === 'INGRESO' ? 'var(--success)' : 'var(--danger)',
                    }}>
                      {c.tipo === 'INGRESO' ? '💰' : '💸'} {c.tipo}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 16 }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(c)} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(c.id, c.nombre)} className="btn btn-danger" style={{ padding: '6px 10px' }} title="Eliminar">
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
