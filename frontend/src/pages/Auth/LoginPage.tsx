import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { saveToken, saveUser } from '../../lib/auth';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const API = 'http://localhost:3000/api/v1';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, form);
      const { accessToken, usuario } = res.data.data;
      saveToken(accessToken);
      saveUser(usuario);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative glows */}
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: 500, height: 500, borderRadius: '50%', background: 'var(--brand-primary)', filter: 'blur(160px)', opacity: 0.12 }} />
      <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: 600, height: 600, borderRadius: '50%', background: 'var(--brand-accent)', filter: 'blur(180px)', opacity: 0.1 }} />

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: 40, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)'
          }}>
            <LogIn size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 6 }}>CoopFinance</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sistema de Control de Gastos</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
            color: 'var(--danger)', fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              placeholder="usuario@cooperativa.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <label>Contraseña</label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: 14, top: 36, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, height: 48, fontSize: '1rem' }}
          >
            {loading ? 'Ingresando...' : <><LogIn size={18} /> Iniciar Sesión</>}
          </button>
        </form>
      </div>
    </div>
  );
}
