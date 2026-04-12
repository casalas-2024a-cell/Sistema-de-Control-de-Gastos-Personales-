import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Save, ArrowLeft } from 'lucide-react';

export default function UsuarioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    fechaNacimiento: '',
    moneda: 'COP'
  });

  useEffect(() => {
    if (isEditing) {
      axios.get(`http://localhost:3000/api/v1/usuarios/${id}`).then(res => {
        if (res.data.success) {
          const user = res.data.data;
          setForm({
            nombres: user.nombres,
            apellidos: user.apellidos,
            email: user.email,
            password: '', 
            fechaNacimiento: user.fechaNacimiento ? user.fechaNacimiento.split('T')[0] : '',
            moneda: user.moneda
          });
        }
      });
    }
  }, [id]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (isEditing && !payload.password) delete payload.password; // Don't send empty password

      if (isEditing) {
        await axios.put(`http://localhost:3000/api/v1/usuarios/${id}`, payload);
      } else {
        await axios.post('http://localhost:3000/api/v1/usuarios', payload);
      }
      navigate('/usuarios');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Verification Error');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 600 }}>
      <button onClick={() => navigate('/usuarios')} className="btn btn-secondary" style={{ marginBottom: 20 }}>
        <ArrowLeft size={18} /> Volver
      </button>

      <h1>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h1>

      <div className="glass-panel">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>Correo Electrónico</label>
            <input type="email" value={form.email} disabled={isEditing} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>

          <div className="input-group">
            <label>Nombres</label>
            <input type="text" value={form.nombres} onChange={e => setForm({...form, nombres: e.target.value})} required />
          </div>

          <div className="input-group">
            <label>Apellidos</label>
            <input type="text" value={form.apellidos} onChange={e => setForm({...form, apellidos: e.target.value})} required />
          </div>

          <div className="input-group">
            <label>Contraseña {isEditing && '(Opcional)'}</label>
            <input type="password" placeholder="Min 8 caracteres" value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength={8} required={!isEditing} />
          </div>

          <div className="input-group">
            <label>Moneda Pref.</label>
            <select value={form.moneda} onChange={e => setForm({...form, moneda: e.target.value})}>
              <option value="COP">COP - Pesos Colombianos</option>
              <option value="USD">USD - Dólares</option>
              <option value="EUR">EUR - Euros</option>
            </select>
          </div>

          <div className="input-group" style={{ gridColumn: 'span 2' }}>
             <label>Fecha de Nacimiento</label>
             <input type="date" value={form.fechaNacimiento} onChange={e => setForm({...form, fechaNacimiento: e.target.value})} />
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="submit" className="btn btn-primary">
              <Save size={18} /> Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
