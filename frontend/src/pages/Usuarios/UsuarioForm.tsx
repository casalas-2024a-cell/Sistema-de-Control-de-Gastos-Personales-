import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

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
      }).catch(err => {
        console.error(err);
        toast.error('No se pudo cargar la información del usuario');
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<typeof form> = { ...form };
      if (isEditing && !payload.password) delete payload.password; // Don't send empty password

      if (isEditing) {
        await axios.put(`http://localhost:3000/api/v1/usuarios/${id}`, payload);
        toast.success('Usuario actualizado correctamente');
      } else {
        await axios.post('http://localhost:3000/api/v1/usuarios', payload);
        toast.success('Usuario creado correctamente');
      }
      navigate('/usuarios');
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        toast.error(error.response.data.message || 'Verification Error');
      } else {
        toast.error('Error de conexión');
      }
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
