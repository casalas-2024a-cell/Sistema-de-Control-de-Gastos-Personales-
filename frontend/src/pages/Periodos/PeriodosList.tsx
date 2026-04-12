import { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Play, Pause, Save, X } from 'lucide-react';
import { clsx } from 'clsx';

export default function PeriodosList() {
  const [periodos, setPeriodos] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', fechaInicio: '', fechaFin: '', estado: 'INACTIVO' });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPeriodos();
  }, []);

  const fetchPeriodos = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/v1/periodos');
      if (res.data.success) {
        setPeriodos(res.data.data);
      }
    } catch (e) { console.error(e); }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isEditing && editId) {
        await axios.put(`http://localhost:3000/api/v1/periodos/${editId}`, form);
      } else {
        await axios.post('http://localhost:3000/api/v1/periodos', form);
      }
      resetForm();
      fetchPeriodos();
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Error al guardar');
    }
  };

  const toggleEstado = async (p: any) => {
    const nuevoEstado = p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await axios.put(`http://localhost:3000/api/v1/periodos/${p.id}`, { estado: nuevoEstado });
      fetchPeriodos();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const resetForm = () => {
    setForm({ nombre: '', fechaInicio: '', fechaFin: '', estado: 'INACTIVO' });
    setIsEditing(false);
    setEditId(null);
  };

  const openEdit = (p: any) => {
    setForm({ 
        nombre: p.nombre, 
        fechaInicio: p.fechaInicio.split('T')[0], 
        fechaFin: p.fechaFin.split('T')[0], 
        estado: p.estado 
    });
    setEditId(p.id);
    setIsEditing(true);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1>Configuración de Períodos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Organiza bloques temporales. (Solo 1 activo)</p>
        </div>

        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Período</th>
                <th>Rango de Fechas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {periodos.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {p.fechaInicio.split('T')[0]} / {p.fechaFin.split('T')[0]}
                  </td>
                  <td>
                    <span className={clsx('badge', p.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger')}>
                      {p.estado}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => toggleEstado(p)} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Cambiar Estado">
                      {p.estado === 'ACTIVO' ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button onClick={() => openEdit(p)} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Editar">
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {periodos.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No hay periodos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel sticky-top">
        <h2 style={{ fontSize: '1.2rem' }}>{isEditing ? 'Editar Período' : 'Nuevo Período'}</h2>
        {errorMsg && <div style={{ color: 'var(--danger)', marginBottom: 15, fontSize: '0.8rem' }}>{errorMsg}</div>}
        
        <form onSubmit={handleSave}>
          <div className="input-group">
            <label>Nombre del Período</label>
            <input type="text" placeholder="Ej. Junio 2025" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Fecha de Inicio</label>
            <input type="date" value={form.fechaInicio} onChange={e => setForm({...form, fechaInicio: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Fecha de Fin</label>
            <input type="date" value={form.fechaFin} onChange={e => setForm({...form, fechaFin: e.target.value})} required />
          </div>
          <div className="input-group">
             <label>Estado Inicial</label>
             <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                <option value="INACTIVO">INACTIVO</option>
                <option value="ACTIVO">ACTIVO</option>
             </select>
          </div>
          
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {isEditing && (
              <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ flex: 1 }}>
                <X size={18} />
              </button>
            )}
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              <Save size={18} /> {isEditing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
