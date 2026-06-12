import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginScreen from './components/Auth/LoginScreen';
import WelcomeScreen from './components/WelcomeScreen';
import DashboardMenu from './components/DashboardMenu';
import Warehouse from './modules/Warehouse/Warehouse';
import ClientesMain from './modules/Customers/ClientesMain';
import FinanzasMain from './modules/Finance/FinanzasMain';
import ProductionMain from './modules/Production/ProductionMain';
import CotizacionesMain from './modules/Quotations/CotizacionesMain';
import Assistant from './components/IA/Assistant';
import VentasMain from './modules/Sales/VentasMain';
import LibraryMain from './modules/Library/LibraryMain';
import systemMonitor from './components/Core/SystemMonitor';
import ErrorBoundary from './components/Core/ErrorBoundary';
import TrashShortcut from './components/Trash/TrashShortcut';
import TrashBin from './components/Trash/TrashBin';
import CalendarShortcut from './modules/Calendar/CalendarShortcut';
import CalendarWidget from './modules/Calendar/CalendarWidget';
import { cotizaciones } from './mock/cotizacionesData';
import { trabajosPendientes } from './mock/trabajosData';

// Puedes agregar aquí los imports de Producción e IA si los tienes
// import ProduccionMain from "./components/Produccion/ProduccionMain";
// import IAMain from "./components/IA/IAMain";

function PrivateRoute({ children }) {
  const isAuth = localStorage.getItem('isAuth') === 'true';
  return isAuth ? children : <Navigate to="/" replace />;
}

// Wrapper para Clientes
function ClientesMainWrapper() {
  const navigate = useNavigate();
  return <ClientesMain onBackToDashboard={() => navigate("/dashboard")} />;
}

// Wrapper para Finanzas
function FinanzasMainWrapper() {
  const navigate = useNavigate();
  return <FinanzasMain onBackToDashboard={() => navigate("/dashboard")} />;
}

// Wrapper para Producción
function ProductionMainWrapper() {
  const navigate = useNavigate();
  return <ProductionMain onBackToDashboard={() => navigate("/dashboard")} />;
}

// Wrapper para Cotizaciones
function CotizacionesMainWrapper() {
  const navigate = useNavigate();
  return <CotizacionesMain onBackToDashboard={() => navigate("/dashboard")} />;
}

// Wrapper para Assistant
function AssistantWrapper() {
  const navigate = useNavigate();
  return <Assistant navigateTo={navigate} />;
}

function LibraryMainWrapper() {
  const navigate = useNavigate();
  return <LibraryMain onBackToDashboard={() => navigate('/dashboard')} />;
}

// Si tienes Producción e IA, puedes agregar wrappers similares:
// function ProduccionMainWrapper() {
//   const navigate = useNavigate();
//   return <ProduccionMain onBackToDashboard={() => navigate("/dashboard")} />;
// }
// function IAMainWrapper() {
//   const navigate = useNavigate();
//   return <IAMain onBackToDashboard={() => navigate("/dashboard")} />;

function getUpcomingEvents(events) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1); // Lunes de la semana
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return events.filter(ev => {
    const evDate = new Date(ev.date);
    // Eventos de esta semana o mañana
    return (evDate >= monday && evDate <= sunday) ||
      (evDate.getDate() === today.getDate() + 1 && evDate.getMonth() === today.getMonth() && evDate.getFullYear() === today.getFullYear());
  });
}

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState(() => {
    // Sincronizar con cotizaciones y trabajos
    const cotizEvents = cotizaciones.map(c => ({
      title: `Entrega: ${c.trabajo}`,
      date: c.fecha,
      type: 'trabajo',
    }));
    const trabajoEvents = trabajosPendientes.map(t => ({
      title: `Entrega: ${t.trabajo}`,
      date: t.fechaEstimada,
      type: 'trabajo',
    }));
    return [...cotizEvents, ...trabajoEvents];
  });
  const location = useLocation();
  const isWelcome = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';

  useEffect(() => {
    setIsAuth(localStorage.getItem('isAuth') === 'true');
    setLoading(false);
  }, []);

  useEffect(() => {
    systemMonitor.recordMetric('renders', Date.now());
    systemMonitor.log('app_render', {});
  }, []);

  // Cerrar ventanas modales al cambiar de ruta o cerrar sesión
  useEffect(() => {
    setShowCalendar(false);
    setShowTrash(false);
  }, [location.pathname, isAuth]);

  // Aquí deberías sincronizar calendarEvents con cotizaciones y trabajos
  // y cargar recordatorios de otras áreas

  const handleAddEvent = () => {
    // Lógica para abrir modal de agregar evento
    // Por ahora solo ejemplo
    const title = prompt('Título del evento/recordatorio:');
    if (!title) return;
    const date = prompt('Fecha (YYYY-MM-DD):');
    if (!date) return;
    const type = prompt('Tipo (urgente, importante, trabajo, prioridad, medio):');
    setCalendarEvents([...calendarEvents, { title, date, type }]);
  };

  // Notificaciones automáticas con IA
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const upcoming = getUpcomingEvents(calendarEvents);
    if (upcoming.length > 0 && (dayOfWeek === 1 || upcoming.some(ev => new Date(ev.date).getDate() === today.getDate() + 1))) {
      setShowAssistant(true);
      // Mensaje personalizado para la IA
      const msg = `Tienes los siguientes eventos próximos:\n` +
        upcoming.map(ev => `- ${ev.title} (${ev.date})`).join('\n') +
        '\n¿Deseas marcar alguno como confirmado, posponer o descartar?';
      localStorage.setItem('harviz_reminder_message', msg);
    }
  }, [calendarEvents]);

  if (loading) return null; // O un loader

  return (
    <ErrorBoundary>
      {/* Asistente IA flotante, SIEMPRE visible */}
      <Assistant
        visible={showAssistant}
        onOpen={() => setShowAssistant(true)}
        onClose={() => setShowAssistant(false)}
        reminderMessage={localStorage.getItem('harviz_reminder_message') || ''}
        onReminderAction={(action, event) => {
          // Lógica para actualizar el estado del evento en calendarEvents
          setCalendarEvents(evts => evts.map(ev =>
            ev.date === event.date && ev.title === event.title
              ? { ...ev, status: action }
              : ev
          ));
          // Limpiar mensaje de recordatorio
          localStorage.removeItem('harviz_reminder_message');
        }}
      />
      {/* Botón flotante de papelera y calendario solo en dashboard */}
      {isDashboard && (
        <>
          <TrashShortcut onClick={() => setShowTrash(true)} />
          <CalendarShortcut onClick={() => setShowCalendar(true)} />
        </>
      )}
      {showCalendar && (
        <CalendarWidget
          events={calendarEvents}
          onAddEvent={handleAddEvent}
          onSelectDay={date => alert('Día seleccionado: ' + date)}
          onClose={() => setShowCalendar(false)}
        />
      )}
      {showTrash && (
        <TrashBin onClose={() => setShowTrash(false)} />
      )}
      <Routes>
        <Route 
          path="/" 
          element={isAuth ? <Navigate to="/dashboard" replace /> : <LoginScreen />} 
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardMenu setShowAssistant={setShowAssistant} />
            </PrivateRoute>
          }
        />
        <Route path="/warehouse" element={<PrivateRoute><Warehouse /></PrivateRoute>} />
        <Route path="/clientes" element={<PrivateRoute><ClientesMainWrapper /></PrivateRoute>} />
        <Route path="/finanzas" element={<PrivateRoute><FinanzasMainWrapper /></PrivateRoute>} />
        <Route path="/production" element={<PrivateRoute><ProductionMainWrapper /></PrivateRoute>} />
        <Route path="/cotizaciones" element={<PrivateRoute><CotizacionesMainWrapper /></PrivateRoute>} />
        <Route path="/ventas" element={<PrivateRoute><VentasMain /></PrivateRoute>} />
        <Route path="/library" element={<PrivateRoute><LibraryMainWrapper /></PrivateRoute>} />
        <Route path="/assistant" element={<PrivateRoute><AssistantWrapper /></PrivateRoute>} />
        <Route path="/trash" element={<PrivateRoute><TrashBin /></PrivateRoute>} />
        {/* Agrega aquí más rutas si tienes Producción, IA, etc. */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;