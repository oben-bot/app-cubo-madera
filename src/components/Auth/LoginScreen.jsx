import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginScreen.css';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  // Credenciales por defecto (en producción, esto vendría de una BD segura)
  const DEFAULT_EMAIL = 'obenrojas@gmail.com';
  const DEFAULT_PASSWORD = 'CuboManager2026'; // Cambiar en producción

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulación de validación (en producción usar IPC hacia main process)
      if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
        // Guardar autenticación
        localStorage.setItem('isAuth', 'true');
        localStorage.setItem('userEmail', email);

        // Notificar al main process para guardar credenciales
        if (window.electronAPI) {
          await window.electronAPI.invoke('save-auth', { email, theme: 'dark' });
        }

        // Navegar al dashboard
        setTimeout(() => navigate('/dashboard'), 300);
      } else {
        setError('Email o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error al iniciar sesión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    setRecoveryMessage('');

    if (recoveryEmail !== DEFAULT_EMAIL) {
      setRecoveryMessage('❌ Este email no está registrado en el sistema');
      return;
    }

    try {
      // Solicitar envío de email al main process
      if (window.electronAPI) {
        await window.electronAPI.invoke('send-recovery-email', { email: recoveryEmail });
      }
      setRecoveryMessage('✅ Email de recuperación enviado a ' + recoveryEmail);
      setTimeout(() => {
        setShowRecovery(false);
        setRecoveryEmail('');
        setRecoveryMessage('');
      }, 3000);
    } catch (err) {
      setRecoveryMessage('❌ Error al enviar email: ' + err.message);
    }
  };

  return (
    <div className="login-container">
      {/* Fondo animado con gradiente */}
      <div className="login-bg-gradient"></div>

      {/* Contenedor principal */}
      <div className="login-main">
        {/* Panel izquierdo con branding */}
        <div className="login-branding">
          <div className="login-logo-section">
            <div className="login-logo">🔷</div>
            <h1 className="login-app-name">Cubo Manager</h1>
            <p className="login-tagline">Sistema de gestión para taller láser</p>
          </div>

          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">📦</span>
              <h3>Inventario</h3>
              <p>Gestión inteligente de materiales</p>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">💼</span>
              <h3>Proyectos</h3>
              <p>Cotizaciones y trabajos en tiempo real</p>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📊</span>
              <h3>Analytics</h3>
              <p>Finanzas y reportes detallados</p>
            </div>
          </div>
        </div>

        {/* Panel derecho con formulario */}
        <div className="login-form-container">
          {!showRecovery ? (
            <>
              <div className="login-form-header">
                <h2>Bienvenido</h2>
                <p>Inicia sesión para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="login-form">
                <div className="login-form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="login-form-group">
                  <label htmlFor="password">Contraseña</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>

                {error && <div className="login-error">{error}</div>}

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </form>

              <div className="login-recovery-link">
                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="login-link"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Credenciales de prueba */}
              <div className="login-demo-info">
                <p className="login-demo-label">Demo credentials:</p>
                <p className="login-demo-text">Email: {DEFAULT_EMAIL}</p>
                <p className="login-demo-text">Pass: {DEFAULT_PASSWORD}</p>
              </div>
            </>
          ) : (
            <>
              <div className="login-form-header">
                <h2>Recuperar contraseña</h2>
                <p>Te enviaremos un email de recuperación</p>
              </div>

              <form onSubmit={handleRecovery} className="login-form">
                <div className="login-form-group">
                  <label htmlFor="recoveryEmail">Email registrado</label>
                  <input
                    type="email"
                    id="recoveryEmail"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                {recoveryMessage && (
                  <div className={recoveryMessage.includes('✅') ? 'login-success' : 'login-error'}>
                    {recoveryMessage}
                  </div>
                )}

                <button type="submit" className="login-button">
                  Enviar email de recuperación
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setShowRecovery(false);
                  setRecoveryEmail('');
                  setRecoveryMessage('');
                }}
                className="login-link"
                style={{ marginTop: '20px' }}
              >
                ← Volver al login
              </button>
            </>
          )}

          {/* Footer */}
          <div className="login-footer">
            <p>© 2026 Cubo Manager • Gestión de Taller Láser</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
