import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Mail, Lock, ArrowRight, GraduationCap, Sparkles, Users, Shield } from 'lucide-react';

const Login = () => {
  const [view, setView] = useState('login'); // 'login', 'verify', 'forgot', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loginRole, setLoginRole] = useState('student'); // 'student' or 'teacher'

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await api.post('/auth/login', {
        email, password, role: loginRole
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      if (err.response?.data?.pendingApproval) {
        setError(err.response.data.message);
      } else if (err.response?.data?.requiresVerification) {
        setView('verify');
        setError(err.response?.data?.message);
        // Automatically resend OTP
        api.post('/auth/resend-otp', { email }).catch(e => console.error(e));
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await api.post('/auth/verify-registration', {
        email, otp
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'teacher' && !user.is_approved) {
        setError(response.data.message);
        setView('login');
      } else {
        navigate(user.role === 'teacher' ? '/teacher' : '/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccessMsg(response.data.message);
      setView('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await api.post('/auth/reset-password', {
        email, otp, newPassword
      });
      setSuccessMsg(response.data.message);
      setView('login');
      setPassword('');
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          z-index: 0;
          animation: float 10s infinite ease-in-out alternate;
        }
        .orb-1 {
          top: -10%; left: -5%; width: 40vw; height: 40vw; max-width: 500px; max-height: 500px;
          background: var(--primary); opacity: 0.3;
        }
        .orb-2 {
          bottom: -10%; right: -5%; width: 30vw; height: 30vw; max-width: 400px; max-height: 400px;
          background: var(--secondary); opacity: 0.2;
          animation-delay: -5s;
        }
        @keyframes float {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-20px) scale(1.05); }
        }
        .login-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          width: 100%;
          max-width: 1050px;
          background: var(--surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-strong);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          z-index: 1;
        }
        .login-left {
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(16, 185, 129, 0.05));
          padding: 4rem 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid var(--border-subtle);
          position: relative;
        }
        .login-right {
          padding: 4.5rem 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: rgba(15, 23, 42, 0.3);
        }
        @media (max-width: 850px) {
          .login-grid { grid-template-columns: 1fr; max-width: 500px; }
          .login-left { display: none; }
          .login-right { padding: 3rem 2rem; }
        }
        .login-input-wrapper {
          position: relative;
          width: 100%;
        }
        .login-input {
          width: 100%;
          height: 3.5rem;
          padding-left: 3.25rem;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-strong);
          color: var(--text-primary);
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .login-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25);
          background: rgba(15, 23, 42, 0.9);
        }
        .login-input::placeholder { color: #64748b; }
        .login-icon {
          position: absolute;
          left: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          transition: color 0.3s ease;
          pointer-events: none;
        }
        .login-input:focus ~ .login-icon { color: var(--primary); }
        
        .login-btn {
          width: 100%;
          height: 3.5rem;
          margin-top: 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.05rem;
          font-weight: 600;
          border-radius: 12px;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px -3px rgba(79, 70, 229, 0.4);
        }
        .role-selector {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .role-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 10px;
          border: 1px solid var(--border-strong);
          background: rgba(15, 23, 42, 0.4);
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .role-option.active {
          background: rgba(79, 70, 229, 0.2);
          border-color: var(--primary);
          color: var(--primary);
        }
      `}</style>

      <div className="login-wrapper">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>

        <div className="login-grid animate-fade-in">
          {/* Left Side: Brand & Message */}
          <div className="login-left">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '14px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.4)' }}>
                  <GraduationCap size={28} color="white" />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px', background: 'linear-gradient(to right, #818cf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  AutoGrade
                </h1>
              </div>
              <h2 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: '1.15', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                Empower your<br />learning journey.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: '1.6', maxWidth: '400px' }}>
                Access your personalized dashboard, track your progress, and master new subjects with our AI-driven examination system.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '3rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem 1.5rem', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
              <Sparkles size={20} color="var(--secondary)" />
              <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '500' }}>Secure & AI Enhanced Platform</span>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="login-right">
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Welcome Back</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Sign in to continue to your account.</p>
            </div>

            {error && (
              <div className="alert alert-error animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>!</div>
                <span style={{ fontSize: '0.95rem' }}>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <span style={{ fontSize: '0.95rem' }}>{successMsg}</span>
              </div>
            )}

            {view === 'login' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Login as</label>
                  <div className="role-selector">
                    <div
                      className={`role-option ${loginRole === 'student' ? 'active' : ''}`}
                      onClick={() => setLoginRole('student')}
                    >
                      <GraduationCap size={16} /> Student
                    </div>
                    <div
                      className={`role-option ${loginRole === 'teacher' ? 'active' : ''}`}
                      onClick={() => setLoginRole('teacher')}
                    >
                      <Users size={16} /> Teacher
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Email Address</label>
                  <div className="login-input-wrapper">
                    <input
                      type="email"
                      className="login-input"
                      placeholder="you@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Mail size={20} className="login-icon" />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)' }}>Password</label>
                    <a href="#" onClick={(e) => { e.preventDefault(); setError(null); setSuccessMsg(null); setView('forgot'); }} style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-hover)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--primary)'}>Forgot password?</a>
                  </div>
                  <div className="login-input-wrapper">
                    <input
                      type="password"
                      className="login-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Lock size={20} className="login-icon" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }}></div>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Email Address</label>
                  <div className="login-input-wrapper">
                    <input
                      type="email"
                      className="login-input"
                      placeholder="you@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Mail size={20} className="login-icon" />
                  </div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Enter your email address to receive a password reset code.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }}></div>
                  ) : (
                    <span>Send Reset OTP</span>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setError(null); setSuccessMsg(null); setView('login'); }} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
                    Back to Login
                  </a>
                </div>
              </form>
            )}

            {view === 'reset' && (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>6-Digit OTP</label>
                  <div className="login-input-wrapper">
                    <input
                      type="text"
                      className="login-input"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 6) setOtp(val);
                      }}
                      maxLength="6"
                      required
                      style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', paddingLeft: '1rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>New Password</label>
                  <div className="login-input-wrapper">
                    <input
                      type="password"
                      className="login-input"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <Lock size={20} className="login-icon" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-btn"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }}></div>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setError(null); setSuccessMsg(null); setView('login'); }} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
                    Back to Login
                  </a>
                </div>
              </form>
            )}

            {view === 'verify' && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Verify Your Email</label>
                  <div className="login-input-wrapper">
                    <input
                      type="text"
                      className="login-input"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 6) setOtp(val);
                      }}
                      maxLength="6"
                      required
                      style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', paddingLeft: '1rem' }}
                    />
                  </div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Your account is not verified. Please enter the verification code sent to {email}.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-btn"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }}></div>
                  ) : (
                    <span>Verify and Sign In</span>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      api.post('/auth/resend-otp', { email })
                        .then(res => setSuccessMsg(res.data.message))
                        .catch(err => setError(err.response?.data?.message || 'Failed to resend.'));
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
                  >
                    Resend Verification OTP
                  </button>
                  <br /><br />
                  <a href="#" onClick={(e) => { e.preventDefault(); setError(null); setSuccessMsg(null); setView('login'); }} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
                    Back to Login
                  </a>
                </div>
              </form>
            )}

            <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{
                  color: 'var(--primary)',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
