import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Lock, Shield, ArrowRight, GraduationCap, Mail } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', {
        email, password, role: 'admin'
      });

      const { token, user } = response.data;
      
      if (user.role !== 'admin') {
          setError("Access denied. This portal is for administrators only.");
          return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: radial-gradient(circle at top right, #1e1b4b, #020617);
        }
        .admin-box {
          width: 100%;
          max-width: 450px;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          text-align: center;
        }
        .admin-icon {
          width: 64px;
          height: 64px;
          background: var(--primary);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 8px 16px rgba(79, 70, 229, 0.4);
        }
        .admin-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          margin-bottom: 1.25rem;
          outline: none;
          transition: all 0.2s;
        }
        .admin-input:focus {
          border-color: var(--primary);
          background: rgba(15, 23, 42, 0.8);
        }
        .input-icon {
            position: absolute;
            left: 1rem;
            top: 1.1rem;
            color: #64748b;
        }
      `}</style>

      <div className="admin-box animate-fade-in">
        <div className="admin-icon">
          <Shield size={32} color="white" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>Admin Portal</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Secure access for system administrators.</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} className="input-icon" />
            <input 
              className="admin-input"
              type="text" 
              placeholder="Admin ID or Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} className="input-icon" />
            <input 
              className="admin-input"
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', height: '3.5rem', borderRadius: '12px', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
            {!loading && <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />}
          </button>
        </form>

        <div style={{ marginTop: '2rem' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
            Back to Public Site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
