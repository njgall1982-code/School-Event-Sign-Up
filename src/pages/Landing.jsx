import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user, loginWithGoogle, loginWithEmail, signupWithEmail, loginAsGuest } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" />;
  }
  const [authMode, setAuthMode] = useState('choice'); // 'choice', 'email-login', 'email-signup', 'guest-warn'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'email-login') {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, name);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAuthContent = () => {
    switch (authMode) {
      case 'choice':
        return (
          <>
            <h2>Ready to get started?</h2>
            <p className="muted" style={{ marginBottom: '2rem' }}>
              Choose how you'd like to participate in our school community.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button className="btn-primary" onClick={loginWithGoogle}>
                Sign in with Google
              </button>
              <button className="btn-secondary" onClick={() => setAuthMode('email-login')}>
                Use Email & Password
              </button>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', marginTop: '1rem' }}
                onClick={() => setAuthMode('guest-warn')}
              >
                Continue as Guest
              </button>
            </div>
          </>
        );

      case 'email-login':
      case 'email-signup':
        return (
          <form onSubmit={handleEmailAuth}>
            <h2>{authMode === 'email-login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="muted" style={{ marginBottom: '1.5rem' }}>
              {authMode === 'email-login' ? 'Sign in to manage your events.' : 'Sign up to track your contributions.'}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              {authMode === 'email-signup' && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Processing...' : authMode === 'email-login' ? 'Sign In' : 'Create Account'}
              </button>
              
              <button 
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                onClick={() => setAuthMode(authMode === 'email-login' ? 'email-signup' : 'email-login')}
              >
                {authMode === 'email-login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
              
              <button 
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                onClick={() => setAuthMode('choice')}
              >
                ← Back to other options
              </button>
            </div>
          </form>
        );

      case 'guest-warn':
        return (
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ color: '#f59e0b' }}>⚠️ Guest Mode</h2>
            <p className="muted" style={{ margin: '1.5rem 0' }}>
              You are about to continue as a guest. Please note:
            </p>
            <ul style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              <li>❌ You won't receive email reminders for your sign-ups.</li>
              <li>❌ Your contributions won't be tracked for "Top Donor" rewards.</li>
              <li>❌ You may not be able to update your sign-up if you leave the site.</li>
            </ul>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={loginAsGuest}>
                I Understand, Continue
              </button>
              <button className="btn-secondary" onClick={() => setAuthMode('choice')}>
                Go Back
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>St. Paul</h1>
        <p className="muted" style={{ fontSize: '1.2rem' }}>Event Coordinator</p>
      </header>
      
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        {renderAuthContent()}
      </div>
    </div>
  );
};

export default Landing;
