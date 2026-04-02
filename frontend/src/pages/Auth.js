import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const validate = () => {
    const nextErrors = { email: '', password: '' };
    const trimmedEmail = form.email.trim().toLowerCase();

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!form.password) nextErrors.password = 'Password is required.';

    setFieldErrors(nextErrors);
    return nextErrors;
  };

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    const nextErrors = validate();
    if (nextErrors.email || nextErrors.password) {
      if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
      return;
    }
    setLoading(true);
    try { await login(form.email.trim().toLowerCase(), form.password); navigate('/'); }
    catch (err) {
      const data = err.response?.data || {};
      const loginMessage = data?.non_field_errors?.[0] || data?.detail || 'Invalid email or password';
      setFieldErrors({
        email: data?.email?.[0] || '',
        password: data?.password?.[0] || '',
      });
      setError(loginMessage);
    }
    finally { setLoading(false); }
  };

  const onFieldChange = (key, value) => {
    setForm(p => ({ ...p, [key]: value }));
    setFieldErrors(p => ({ ...p, [key]: '' }));
    setError('');
  };

  const handlePasswordKeyEvent = (e) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  return (
    <div className="container page" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:440}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:'3rem',marginBottom:8}}>🥘</div>
          <h1 style={{fontSize:'1.8rem'}}>Welcome back</h1>
          <p style={{color:'var(--text-muted)'}}>Sign in to your Pantry Pal account</p>
        </div>
        <div className="form-card">
          {error && (
            <div role="alert" aria-live="assertive" style={{background:'#FEE2E2',color:'#991B1B',padding:'10px 14px',borderRadius:'var(--radius-sm)',marginBottom:20,fontSize:'0.9rem'}}>
              {error}
            </div>
          )}
          <form onSubmit={handle} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                className="form-input"
                value={form.email}
                onChange={e => onFieldChange('email', e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              />
              {fieldErrors.email && (
                <div id="login-email-error" className="form-error" role="status" aria-live="polite">
                  {fieldErrors.email}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{position:'relative'}}>
                <input
                  id="login-password"
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={form.password}
                  onChange={e => onFieldChange('password', e.target.value)}
                  onKeyDown={handlePasswordKeyEvent}
                  onKeyUp={handlePasswordKeyEvent}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                  style={{paddingRight:88}}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',border:'none',background:'transparent',color:'var(--orange)',fontWeight:700,cursor:'pointer'}}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {capsLockOn && (
                <div className="form-error" role="status" aria-live="polite">
                  Caps Lock is on.
                </div>
              )}
              {fieldErrors.password && (
                <div id="login-password-error" className="form-error" role="status" aria-live="polite">
                  {fieldErrors.password}
                </div>
              )}
            </div>
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:8}} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p style={{textAlign:'center',marginTop:20,fontSize:'0.9rem',color:'var(--text-muted)'}}>
            Don't have an account? <Link to="/register" style={{color:'var(--orange)',fontWeight:600}}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await register(form.email, form.password, form.full_name); navigate('/'); }
    catch (err) {
      const data = err.response?.data;
      setError(data?.email?.[0] || data?.password?.[0] || 'Registration failed. Try a different email.');
    }
    finally { setLoading(false); }
  };

  return (
    <div className="container page" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:440}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:'3rem',marginBottom:8}}>🥘</div>
          <h1 style={{fontSize:'1.8rem'}}>Join Pantry Pal</h1>
          <p style={{color:'var(--text-muted)'}}>Create your free account</p>
        </div>
        <div className="form-card">
          {error && <div style={{background:'#FEE2E2',color:'#991B1B',padding:'10px 14px',borderRadius:'var(--radius-sm)',marginBottom:20,fontSize:'0.9rem'}}>{error}</div>}
          <form onSubmit={handle}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))} placeholder="Jane Smith" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="Min 8 characters" required minLength={8} />
            </div>
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:8}} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p style={{textAlign:'center',marginTop:20,fontSize:'0.9rem',color:'var(--text-muted)'}}>
            Already have an account? <Link to="/login" style={{color:'var(--orange)',fontWeight:600}}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
