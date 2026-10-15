import { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF' });
  const [error, setError] = useState('');

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api(isRegister ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: form,
      });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={submit}>
        <h2>Biomedical Device Calibration & Maintenance</h2>
        <p className="muted">{isRegister ? 'Create an account' : 'Sign in to continue'}</p>

        {isRegister && (
          <input name="name" placeholder="Full name" value={form.name} onChange={change} required />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} required />
        <input name="password" type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={change} required />
        {isRegister && (
          <select name="role" value={form.role} onChange={change}>
            <option value="STAFF">Staff (view only)</option>
            <option value="TECHNICIAN">Technician (add & edit records)</option>
          </select>
        )}

        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit">{isRegister ? 'Register' : 'Login'}</button>

        <p className="small muted center">
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister); setError(''); }}>
            {isRegister ? 'Login' : 'Register'}
          </a>
        </p>
        {isRegister && <p className="small muted center">The first account created becomes Admin.</p>}
      </form>
    </div>
  );
}
