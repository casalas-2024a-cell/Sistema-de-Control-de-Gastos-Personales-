import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ nombres: '', apellidos: '', email: '', password: '', moneda: 'COP' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register({ nombres: form.nombres, apellidos: form.apellidos, email: form.email, password: form.password, moneda: form.moneda });
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Error al procesar la solicitud');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: 500, height: 500, borderRadius: '50%', background: 'var(--brand-primary)', filter: 'blur(160px)', opacity: 0.12 }} />
      <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: 600, height: 600, borderRadius: '50%', background: 'var(--brand-accent)', filter: 'blur(180px)', opacity: 0.1 }} />

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: 40, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>
            {isRegister ? <UserPlus size={26} color="white" /> : <LogIn size={26} color="white" />}
          </div>
          <h1 style={{ fontSize: '1.7rem', marginBottom: 4 }}>CoopFinance</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {isRegister ? 'Crea tu cuenta para empezar' : 'Sistema de Control de Gastos'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label>Nombres</label>
                <input type="text" value={form.nombres} onChange={e => setForm({ ...form, nombres: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Apellidos</label>
                <input type="text" value={form.apellidos} onChange={e => setForm({ ...form, apellidos: e.target.value })} required />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Correo Electrónico</label>
            <input type="email" placeholder="usuario@cooperativa.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required autoFocus={!isRegister} />
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <label>Contraseña</label>
            <input type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: 14, top: 36, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {isRegister && (
            <div className="input-group">
              <label>Moneda Preferida</label>
              <select value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}>
                <option value="COP">COP - Pesos Colombianos</option>
                <option value="USD">USD - Dólares</option>
                <option value="EUR">EUR - Euros</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', marginTop: 10, height: 48, fontSize: '1rem' }}>
            {loading ? 'Procesando...' : isRegister ? <><UserPlus size={18} /> Crear Cuenta</> : <><LogIn size={18} /> Iniciar Sesión</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button type="button" onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            {isRegister ? 'Inicia Sesión' : 'Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
}
