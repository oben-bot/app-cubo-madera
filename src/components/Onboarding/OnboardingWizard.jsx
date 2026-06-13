import React, { useState, useEffect } from 'react';
import './OnboardingWizard.css';

const OnboardingWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    language: 'es',
    theme: 'system',
    moneda: 'MXN',
    modules: {
      dashboard: true,
      customers: true,
      quotations: true,
      production: true,
      warehouse: true,
      sales: true,
      finance: true,
      calendar: true
    }
  });

  const totalSteps = 5;

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Guardar configuraciones
      await window.electron.config.set('language', config.language);
      await window.electron.config.set('theme', config.theme);
      await window.electron.config.set('moneda', config.moneda);
      
      for (const [module, active] of Object.entries(config.modules)) {
        await window.electron.config.set(`modulo_${module}_activo`, active);
      }
      
      // Marcar onboarding como completado
      await window.electron.config.set('onboarding_completed', true);
      
      onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-wizard">
        <div className="onboarding-progress">
          <div className="progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
          <span>Paso {step} de {totalSteps}</span>
        </div>

        {/* Paso 1: Bienvenida */}
        {step === 1 && (
          <div className="onboarding-step">
            <h1>🎉 Bienvenido a Cubo Manager</h1>
            <p>El sistema de gestión completo para tu taller de corte láser.</p>
            <p>Este asistente te guiará en la configuración inicial.</p>
          </div>
        )}

        {/* Paso 2: Idioma y Tema */}
        {step === 2 && (
          <div className="onboarding-step">
            <h2>🌐 Configuración básica</h2>
            <div className="form-group">
              <label>Idioma</label>
              <select value={config.language} onChange={(e) => setConfig({ ...config, language: e.target.value })}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tema</label>
              <div className="theme-buttons">
                <button className={config.theme === 'light' ? 'selected' : ''} onClick={() => setConfig({ ...config, theme: 'light' })}>
                  ☀️ Claro
                </button>
                <button className={config.theme === 'dark' ? 'selected' : ''} onClick={() => setConfig({ ...config, theme: 'dark' })}>
                  🌙 Oscuro
                </button>
                <button className={config.theme === 'system' ? 'selected' : ''} onClick={() => setConfig({ ...config, theme: 'system' })}>
                  💻 Sistema
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Moneda</label>
              <select value={config.moneda} onChange={(e) => setConfig({ ...config, moneda: e.target.value })}>
                <option value="MXN">Peso Mexicano (MXN)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
          </div>
        )}

        {/* Paso 3: Módulos */}
        {step === 3 && (
          <div className="onboarding-step">
            <h2>📦 Selecciona los módulos que usarás</h2>
            <div className="modules-grid-onboarding">
              <label><input type="checkbox" checked={config.modules.customers} onChange={(e) => setConfig({ ...config, modules: { ...config.modules, customers: e.target.checked } })} /> Clientes</label>
              <label><input type="checkbox" checked={config.modules.quotations} onChange={(e) => setConfig({ ...config, modules: { ...config.modules, quotations: e.target.checked } })} /> Cotizaciones</label>
              <label><input type="checkbox" checked={config.modules.production} onChange={(e) => setConfig({ ...config, modules: { ...config.modules, production: e.target.checked } })} /> Producción</label>
              <label><input type="checkbox" checked={config.modules.warehouse} onChange={(e) => setConfig({ ...config, modules: { ...config.modules, warehouse: e.target.checked } })} /> Almacén</label>
              <label><input type="checkbox" checked={config.modules.sales} onChange={(e) => setConfig({ ...config, modules: { ...config.modules, sales: e.target.checked } })} /> Ventas</label>
              <label><input type="checkbox" checked={config.modules.finance} onChange={(e) => setConfig({ ...config, modules: { ...config.modules, finance: e.target.checked } })} /> Finanzas</label>
              <label><input type="checkbox" checked={config.modules.calendar} onChange={(e) => setConfig({ ...config, modules: { ...config.modules, calendar: e.target.checked } })} /> Calendario</label>
            </div>
          </div>
        )}

        {/* Paso 4: Contraseña */}
        {step === 4 && (
          <div className="onboarding-step">
            <h2>🔒 Configura tu contraseña de administrador</h2>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" placeholder="Mínimo 6 caracteres" id="adminPassword" />
            </div>
            <div className="form-group">
              <label>Confirmar contraseña</label>
              <input type="password" placeholder="Repite la contraseña" id="confirmPassword" />
            </div>
            <p className="info">Usarás esta contraseña para iniciar sesión.</p>
          </div>
        )}

        {/* Paso 5: Final */}
        {step === 5 && (
          <div className="onboarding-step">
            <h2>✅ ¡Todo listo!</h2>
            <p>Tu app está configurada y lista para usar.</p>
            <p>Puedes cambiar cualquier ajuste en Configuración más tarde.</p>
            <div className="tips">
              <h3>💡 Tips rápidos:</h3>
              <ul>
                <li>Usa Ctrl+N para crear una nueva cotización</li>
                <li>Arrastra archivos a la Biblioteca para agregar diseños</li>
                <li>Los respaldos se hacen automáticamente cada día</li>
              </ul>
            </div>
          </div>
        )}

        <div className="onboarding-buttons">
          {step > 1 && <button onClick={handlePrev} className="btn-secondary">Anterior</button>}
          <button onClick={handleNext} className="btn-primary">
            {step === totalSteps ? 'Comenzar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
