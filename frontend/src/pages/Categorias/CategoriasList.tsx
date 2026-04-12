import { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2, PlusCircle, Save, X } from 'lucide-react';
import { clsx } from 'clsx';

export default function CategoriasList() {
  const [categorias, setCategorias] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', tipo: 'EGRESO', usuarioId: 1 });
  const [errorMsg, setErrorMsg] = useState('');

  // En un sistema real, el usuario tomaría el ID del token JWT
  const USUARIO_ID_SIMULADO = 1;

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/v1/categorias/usuario/${USUARIO_ID_SIMULADO}`);
      if (res.data.success) {
        setCategorias(res.data.data);
      }
    } catch (e) { console.error(e); }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isEditing && editId) {
        await axios.put(`http://localhost:3000/api/v1/categorias/${editId}`, form);
      } else {
        await axios.post('http://localhost:3000/api/v1/categorias', { ...form, usuarioId: USUARIO_ID_SIMULADO });
      }
      resetForm();
      fetchCategorias();
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Error al guardar');
    }
  };

  const resetForm = () => {
    setForm({ nombre: '', descripcion: '', tipo: 'EGRESO', usuarioId: USUARIO_ID_SIMULADO });
    setIsEditing(false);
    setEditId(null);
  };

  const openEdit = (cat: any) => {
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '', tipo: cat.tipo, usuarioId: USUARIO_ID_SIMULADO });
    setEditId(cat.id);
    setIsEditing(true);
  };

  const deleteCategoria = async (id: number) => {
    if (!confirm('¿Desea eliminar la categoría?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/v1/categorias/${id}`);
      fetchCategorias();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1>Mis Categorías</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Clasifica tus transacciones financieras.</p>
        </div>

        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.nombre}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.descripcion}</div>
                  </td>
                  <td>
                    <span className={clsx('badge', c.tipo === 'INGRESO' ? 'badge-success' : 'badge-danger')}>
                      {c.tipo}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(c)} className="btn btn-secondary" style={{ padding: '6px 10px' }}><Pencil size={16} /></button>
                    <button onClick={() => deleteCategoria(c.id)} className="btn btn-danger" style={{ padding: '6px 10px' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {categorias.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Aún no hay categorías registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel sticky-top">
        <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          {isEditing ? <Pencil size={20} className="text-brand" /> : <PlusCircle size={20} className="text-brand" />}
          {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
        </h2>
        {errorMsg && <div style={{ color: 'var(--danger)', marginBottom: 15, fontSize: '0.8rem' }}>{errorMsg}</div>}
        
        <form onSubmit={handleSave}>
          <div className="input-group">
            <label>Nombre</label>
            <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Descripción</label>
            <input type="text" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Tipo de Transacción</label>
            <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
              <option value="EGRESO">EGRESO (Gasto)</option>
              <option value="INGRESO">INGRESO (Ganancia)</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {isEditing && (
              <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ flex: 1 }}>
                <X size={18} /> Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Save size={18} /> {isEditing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
