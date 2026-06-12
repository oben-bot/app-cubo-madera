import React, { useState } from 'react';
import systemMonitor from '../Core/SystemMonitor';

const LayoutSidebar = ({ activeSection, setActiveSection }) => {
  // Monitoreo de renderizado y cambios de sección
  React.useEffect(() => {
    systemMonitor.recordMetric('renders', Date.now());
    systemMonitor.log('sidebar_render', { activeSection });
  }, [activeSection]);

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    systemMonitor.log('sidebar_section_change', { sectionId });
  };

  const sections = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊', color: 'emerald' },
    { id: 'warehouse', name: 'Warehouse', icon: '📦', color: 'amber' },
    { id: 'finanzas', name: 'Finanzas', icon: '💰', color: 'blue' },
    { id: 'production', name: 'Producción', icon: '🔧', color: 'rose' },
    { id: 'cotizaciones', name: 'Cotizaciones', icon: '📝', color: 'violet' },
    { id: 'ventas', name: 'Ventas Web', icon: '🛒', color: 'cyan' },
    { id: 'clientes', name: 'Clientes', icon: '👥', color: 'lime' }
  ];

  const colorMap = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
    cyan: 'bg-cyan-500',
    lime: 'bg-lime-500'
  };

  return (
    <div className="w-full md:w-64 bg-gray-800 shadow-xl rounded-lg p-4 mr-0 md:mr-6 mb-6 md:mb-0">
      <h2 className="text-xl font-bold text-gray-100 mb-6">Menú Principal</h2>
      <nav>
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => handleSectionClick(section.id)}
                className={`w-full flex items-center p-3 rounded-lg transition-all ${activeSection === section.id ? `${colorMap[section.color]} text-white` : 'text-gray-300 hover:bg-gray-700'}`}
              >
                <span className="mr-3">{section.icon}</span>
                {section.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default LayoutSidebar;