import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./DashboardMenu.css";
import SettingsMenu from "./SettingsMenu";
import NotesModal from "./NotesModal";

const icons = [
  <svg width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>, // Almacén
  <svg width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>, // Cotizaciones
  <svg width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>, // Finanzas
  <svg width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>, // Producción (Trabajo)
  <svg width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>, // Clientes
  <svg width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>, // IA
];

const labels = [
  "Almacén",
  "Cotizaciones",
  "Finanzas",
  "Producción",
  "Clientes",
  "IA"
];

const DashboardMenu = ({ setShowAssistant }) => {
  const radius = 210;
  const center = 250;
  const btnWidth = 210;
  const btnHeight = 180;
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [alertaMateriales, setAlertaMateriales] = useState([]);
  const [showAlerta, setShowAlerta] = useState(false);

  useEffect(() => {
    const checkAlmacen = () => {
      const almacen = JSON.parse(localStorage.getItem("materiales") || "null") || [];
      const bajos = almacen.filter(m => m.cantidad === 1);
      setAlertaMateriales(bajos);
      setShowAlerta(bajos.length > 0);
    };
    checkAlmacen();
    const interval = setInterval(checkAlmacen, 2000); // Actualiza cada 2 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-menu-bg">
      {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
      {showNotes && <NotesModal onClose={() => setShowNotes(false)} />}
      {showAlerta && (
        <div className="bg-rose-900/90 border border-rose-700 text-rose-200 px-6 py-4 rounded-lg mb-6 flex flex-col items-center max-w-xl mx-auto z-50" style={{position:'absolute',top:30,left:'50%',transform:'translateX(-50%)'}}>
          <span className="font-bold text-lg mb-2">⚠️ Materiales a punto de agotarse</span>
          <ul className="mb-2">
            {alertaMateriales.map(m => (
              <li key={m.id}>{m.nombre} (quedan 1)</li>
            ))}
          </ul>
          <button className="bg-rose-700 hover:bg-rose-600 text-white px-4 py-2 rounded" onClick={()=>setShowAlerta(false)}>Cerrar</button>
        </div>
      )}
      <div className="circle-menu" style={{ width: center * 2, height: center * 2 }}>
        {/* Botón central para cerrar sesión */}
        <button
          className="center-button"
          title="Cerrar sesión"
          onClick={() => {
            localStorage.removeItem("isAuth");
            navigate("/");
          }}
        >
          <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2">
            <circle cx="12" cy="12" r="10" stroke="#111" strokeWidth="2" fill="none"/>
            <path d="M12 6v6" stroke="#111" strokeWidth="2"/>
            <circle cx="12" cy="16" r="1" fill="#111"/>
          </svg>
        </button>
        {/* Botones tipo ruleta */}
        {labels.map((label, i) => {
          const angle = (i / labels.length) * 2 * Math.PI - Math.PI / 2 + Math.PI;
          const x = center + radius * Math.cos(angle) - btnWidth / 2;
          const y = center + radius * Math.sin(angle) - btnHeight / 2;
          const isGreen = i % 2 === 1;

          // Lógica para activar cada botón según la ruta
          const lower = label.toLowerCase();
          const isClientes = lower === "clientes" && location.pathname.startsWith("/clientes");
          const isFinanzas = lower === "finanzas" && location.pathname.startsWith("/finanzas");
          const isProduccion = lower === "producción" && location.pathname.startsWith("/production");
          const isIA = lower === "ia" && location.pathname.startsWith("/assistant");
          const isCotizaciones = lower === "cotizaciones" && location.pathname.startsWith("/cotizaciones");
          const isAlmacen = lower === "almacén" && location.pathname.startsWith("/warehouse");
          const isActive = isClientes || isFinanzas || isProduccion || isIA || isCotizaciones || isAlmacen;

          const btnClass = `circle-button${isGreen ? " green" : ""}${isActive ? " active" : ""}`;
          const rotate = (angle * 180) / Math.PI + 90;
          return (
            <button
              key={label}
              className={btnClass}
              style={{
                left: x,
                top: y,
                color: isGreen ? "#111" : "#39ff14",
                transform: `rotate(${rotate}deg)`,
              }}
              onClick={() => {
                if (label === "Almacén") navigate("/warehouse");
                else if (label === "Clientes") navigate("/clientes");
                else if (label === "Finanzas") navigate("/finanzas");
                else if (label === "Producción") navigate("/production");
                else if (label === "IA") setShowAssistant(true);
                else if (label === "Cotizaciones") navigate("/cotizaciones");
              }}
            >
              <div
                className="circle-icon"
                style={{
                  transform: `rotate(-${rotate}deg)`,
                }}
              >
                {icons[i]}
              </div>
              <span
                className="circle-label"
                style={{
                  transform: `rotate(-${rotate}deg)`,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Botones de las esquinas */}
      <button className="corner-button top-left" onClick={() => setShowSettings(true)}>
        <svg width="48" height="48" fill="none" stroke="#00bfff" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/></svg>
        Configuraciones
      </button>
      <button className="corner-button top-right" onClick={() => navigate('/ventas')}>
        <svg width="48" height="48" fill="none" stroke="#00bfff" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>
        Ventas
      </button>
      <button className="corner-button bottom-left" onClick={() => setShowNotes(true)}>
        <svg width="48" height="48" fill="none" stroke="#00bfff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
        Notas
      </button>
      <button className="corner-button bottom-right" onClick={() => navigate('/library')}>
        <svg width="48" height="48" fill="none" stroke="#00bfff" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="2" width="7" height="20" rx="1"/><rect x="14" y="2" width="7" height="20" rx="1"/></svg>
        📚 Biblioteca Laser
      </button>
    </div>
  );
};

export default DashboardMenu;