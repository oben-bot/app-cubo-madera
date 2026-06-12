import './ClientesMain.css';
import React, { useState, useEffect } from 'react';
import systemMonitor from '../../components/Core/SystemMonitor';
import { deleteWithTrash } from '../../utils/deleteWithTrash';

const clientesFrecuentes = [
  { nombre: "Maderas del Norte", area: "Producción" },
  { nombre: "Tableros Express", area: "Producción" },
  { nombre: "ConstruyeFácil", area: "Producción" },
];

const ClientesMain = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", correo: "", telefono: "" });

  // Monitoreo: Registrar render y evento de apertura
  React.useEffect(() => {
    systemMonitor.recordMetric('renders', Date.now());
    systemMonitor.log('clientes_render', {});
  }, []);

  // Cargar clientes desde localStorage al iniciar
  useEffect(() => {
    const guardados = localStorage.getItem("clientes");
    if (guardados) setClientes(JSON.parse(guardados));
  }, []);

  // Guardar clientes en localStorage cada vez que cambian
  useEffect(() => {
    localStorage.setItem("clientes", JSON.stringify(clientes));
  }, [clientes]);

  const handleInputChange = e => {
    setNuevoCliente({ ...nuevoCliente, [e.target.name]: e.target.value });
  };

  const handleAgregarCliente = e => {
    e.preventDefault();
    if (nuevoCliente.nombre.trim() === "") return;
    setClientes([...clientes, { ...nuevoCliente }]);
    setNuevoCliente({ nombre: "", correo: "", telefono: "" });
  };

  const handleEliminarCliente = idx => {
    const cliente = clientes[idx];
    deleteWithTrash({
      id: `cliente-${idx}-${cliente.nombre}`,
      name: cliente.nombre,
      type: 'cliente'
    });
    setClientes(clientes.filter((_, i) => i !== idx));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'registro':
        return (
          <div className="clientes-tab-content">
            <h2>Registro de Clientes</h2>
            <form onSubmit={handleAgregarCliente} style={{ marginBottom: 24 }}>
              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                value={nuevoCliente.nombre}
                onChange={handleInputChange}
                required
                className="input-cliente"
              />
              <input
                type="email"
                name="correo"
                placeholder="Correo"
                value={nuevoCliente.correo}
                onChange={handleInputChange}
                className="input-cliente"
              />
              <input
                type="tel"
                name="telefono"
                placeholder="Teléfono"
                value={nuevoCliente.telefono}
                onChange={handleInputChange}
                className="input-cliente"
              />
              <button type="submit" className="btn-registrar">Agregar</button>
            </form>
            <ul className="lista-clientes">
              {clientes.map((c, idx) => (
                <li key={idx}>
                  <span>{c.nombre} {c.correo && `- ${c.correo}`} {c.telefono && `- ${c.telefono}`}</span>
                  <button className="btn-eliminar" onClick={() => handleEliminarCliente(idx)}>Eliminar</button>
                </li>
              ))}
              {clientes.length === 0 && <li>No hay clientes registrados.</li>}
            </ul>
          </div>
        );
      case 'historial':
        return (
          <div className="clientes-tab-content">
            <h2>Clientes Frecuentes</h2>
            <ul className="lista-clientes">
              {clientesFrecuentes.map((c, idx) => (
                <li key={idx}>
                  <span>{c.nombre} - Área: {c.area}</span>
                </li>
              ))}
            </ul>
            <p style={{marginTop: 16, color: "#aaa"}}>Este historial se basa en los clientes con más pedidos en el área de producción.</p>
          </div>
        );
      case 'comunicacion':
        return (
          <div className="clientes-tab-content">
            <h2>Comunicación</h2>
            <p>Opciones:</p>
            <ul>
              <li>Enviar notificación por correo a todos los clientes</li>
              <li>Enviar mensaje personalizado</li>
              <li>Ver historial de comunicaciones</li>
            </ul>
            <button className="btn-accion">Simular envío de notificación</button>
          </div>
        );
      case 'fidelizacion':
        return (
          <div className="clientes-tab-content">
            <h2>Fidelización</h2>
            <p>Opciones de programas de recompensas:</p>
            <ul>
              <li>Descuentos por compras frecuentes</li>
              <li>Acumulación de puntos por cada compra</li>
              <li>Premios especiales a clientes leales</li>
            </ul>
            <button className="btn-accion">Simular activar programa</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: 'url("/asset/clientes-bg.jpg") center center/cover no-repeat',
        padding: "40px"
      }}
    >
      <div className="clientes-main-container">
        <h1 className="clientes-title">Gestión de Clientes</h1>
        {!activeTab && (
          <div className="almacen-menu-botones">
            <button className="flecha-css-btn" onClick={() => setActiveTab('registro')}>
              Registro
            </button>
            <button className="flecha-css-btn" onClick={() => setActiveTab('historial')}>
              Historial
            </button>
            <button className="flecha-css-btn" onClick={() => setActiveTab('comunicacion')}>
              Comunicación
            </button>
            <button className="flecha-css-btn" onClick={() => setActiveTab('fidelizacion')}>
              Fidelización
            </button>
          </div>
        )}
        {activeTab && (
          <>
            {renderTabContent()}
            <button className="volver-btn" onClick={() => setActiveTab(null)}>
              ← Volver al menú de Clientes
            </button>
          </>
        )}
        <button className="volver-dashboard-btn" onClick={onBackToDashboard}>
          ← Volver al menú principal
        </button>
      </div>
    </div>
  );
};

export default ClientesMain;