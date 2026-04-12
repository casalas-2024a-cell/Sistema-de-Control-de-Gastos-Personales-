import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';

export default function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  
  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/v1/usuarios');
      if (res.data.success) {
        setUsuarios(res.data.data.usuarios);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/v1/usuarios/${id}`);
      fetchUsuarios();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Gestión de Usuarios</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Administra los miembros de la cooperativa.</p>
        </div>
        <Link to="/usuarios/new" className="btn btn-primary">
          <UserPlus size={18} /> Nuevo Usuario
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Moneda</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u: any) => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{u.nombres} {u.apellidos}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {u.id}</div>
                </td>
                <td>{u.email}</td>
                <td><span className="badge badge-info">{u.moneda}</span></td>
                <td style={{ display: 'flex', gap: '8px' }}>
                  <Link to={`/usuarios/${u.id}`} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                    <Pencil size={16} />
                  </Link>
                  <button onClick={() => deleteUser(u.id)} className="btn btn-danger" style={{ padding: '6px 10px' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No hay usuarios.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
