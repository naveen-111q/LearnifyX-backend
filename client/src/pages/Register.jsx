import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { User, Mail, Lock, Shield, ArrowRight, GraduationCap, Sparkles, BookOpen, Clock } from 'lucide-react';

const Register = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [section, setSection] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await api.post('/auth/register', {
        name, email, password, role, section
      });

      if (response.data.requiresVerification) {
        setSuccessMsg(response.data.message);
        setStep(2);
      } else {
        // Fallback if not using OTP
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate(user.role === 'teacher' ? '/teacher' : '/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
    try {
      const response = await api.post('/auth/verify-registration', {
        email, otp
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'teacher' && !user.is_approved) {
        setSuccessMsg(response.data.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        navigate(user.role === 'teacher' ? '/teacher' : '/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await api.post('/auth/resend-otp', { email });
      setSuccessMsg(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .register-wrapper {
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
        .register-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          width: 100%;
          max-width: 1100px;
          background: var(--surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-strong);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          z-index: 1;
        }
        .register-left {
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(16, 185, 129, 0.05));
          padding: 4rem 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid var(--border-subtle);
          position: relative;
        }
        .register-right {
          padding: 3rem 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: rgba(15, 23, 42, 0.3);
        }
        @media (max-width: 900px) {
          .register-grid { grid-template-columns: 1fr; max-width: 500px; }
          .register-left { display: none; }
          .register-right { padding: 3rem 2rem; }
        }
        .register-input-wrapper {
          position: relative;
          width: 100%;
        }
        .register-input {
          width: 100%;
          height: 3.25rem;
          padding-left: 3.25rem;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-strong);
          color: var(--text-primary);
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .register-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25);
          background: rgba(15, 23, 42, 0.9);
        }
        .register-input::placeholder { color: #64748b; }
        .register-icon {
          position: absolute;
          left: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          transition: color 0.3s ease;
          pointer-events: none;
        }
        .register-input:focus ~ .register-icon { color: var(--primary); }
        
        .register-select {
          appearance: none;
          padding-right: 3rem;
        }
        .select-arrow {
          position: absolute;
          right: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .role-selector {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .role-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.8rem;
          border-radius: 12px;
          border: 1px solid var(--border-strong);
          background: rgba(15, 23, 42, 0.4);
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .role-option.active {
          background: rgba(79, 70, 229, 0.2);
          border-color: var(--primary);
          color: var(--primary);
        }

        .register-btn {
          width: 100%;
          height: 3.5rem;
          margin-top: 0.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.05rem;
          font-weight: 600;
          border-radius: 12px;
        }
        .register-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px -3px rgba(79, 70, 229, 0.4);
        }
        
        .form-row {
          display: flex;
          gap: 1rem;
        }
        .form-row > div {
          flex: 1;
        }
        @media (max-width: 600px) {
          .form-row { flex-direction: column; gap: 1.25rem; }
        }
      `}</style>

      <div className="register-wrapper">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>

        <div className="register-grid animate-fade-in">
          {/* Left Side: Brand & Message */}
          <div className="register-left">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '14px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.4)' }}>
                  <GraduationCap size={28} color="white" />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px', background: 'linear-gradient(to right, #818cf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  LearnifyX
                </h1>
              </div>
              <h2 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: '1.15', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                Start your<br />journey today.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: '1.6', maxWidth: '400px' }}>
                Create a free account to unlock intelligent practice tests, detailed AI feedback, and personalized learning pathways.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '3rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem 1.5rem', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
              <Sparkles size={20} color="var(--primary)" />
              <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '500' }}>Join thousands of learners</span>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="register-right">
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Create Account</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Fill in your details to get started.</p>
            </div>

            {error && (
              <div className="alert alert-error animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', minWidth: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>!</div>
                <span style={{ fontSize: '0.95rem' }}>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <span style={{ fontSize: '0.95rem' }}>{successMsg}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Role Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>I am a...</label>
                  <div className="role-selector">
                    <div
                      className={`role-option ${role === 'student' ? 'active' : ''}`}
                      onClick={() => setRole('student')}
                    >
                      <BookOpen size={18} /> Student
                    </div>
                    <div
                      className={`role-option ${role === 'teacher' ? 'active' : ''}`}
                      onClick={() => {
                        setRole('teacher');
                        setSection('');
                      }}
                    >
                      <Shield size={18} /> Teacher
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Full Name</label>
                  <div className="register-input-wrapper">
                    <input
                      type="text"
                      className="register-input"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <User size={18} className="register-icon" />
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Email Address</label>
                    <div className="register-input-wrapper">
                      <input
                        type="email"
                        className="register-input"
                        placeholder="you@school.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Mail size={18} className="register-icon" />
                    </div>
                  </div>

                  {role === 'student' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Academic Section</label>
                      <div className="register-input-wrapper">
                        <input
                          type="text"
                          className="register-input"
                          placeholder="e.g. A"
                          value={section}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            if (val === '' || /^[A-Z]+$/.test(val)) {
                              setSection(val);
                            }
                          }}
                          maxLength="5"
                          required
                        />
                        <GraduationCap size={18} className="register-icon" />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Password</label>
                  <div className="register-input-wrapper">
                    <input
                      type="password"
                      className="register-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Lock size={18} className="register-icon" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary register-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }}></div>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>6-Digit OTP</label>
                  <div className="register-input-wrapper">
                    <input
                      type="text"
                      className="register-input"
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
                    Enter the verification code sent to {email}.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary register-btn"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }}></div>
                  ) : (
                    <>
                      <span>Verify Account</span>
                      <Lock size={20} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}
                  >
                    Resend OTP
                  </button>
                  <br />
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      marginTop: '1rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Change Email / details
                  </button>
                </div>
              </form>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                Already have an account?{' '}
                <Link to="/login" style={{
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
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
