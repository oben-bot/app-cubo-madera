// Pruebas unitarias y de integración para LayoutSidebar
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import LayoutSidebar from '../Layout/LayoutSidebar';

describe('LayoutSidebar', () => {
  it('renderiza todas las secciones correctamente', () => {
    const { getByText } = render(
      <LayoutSidebar activeSection="dashboard" setActiveSection={() => {}} />
    );
    expect(getByText('Dashboard')).toBeInTheDocument();
    expect(getByText('Almacén')).toBeInTheDocument();
    expect(getByText('Finanzas')).toBeInTheDocument();
    expect(getByText('Proceso de Trabajo')).toBeInTheDocument();
    expect(getByText('Cotizaciones')).toBeInTheDocument();
    expect(getByText('Ventas Web')).toBeInTheDocument();
    expect(getByText('Clientes')).toBeInTheDocument();
  });

  it('cambia la sección activa al hacer click', () => {
    const setActiveSection = jest.fn();
    const { getByText } = render(
      <LayoutSidebar activeSection="dashboard" setActiveSection={setActiveSection} />
    );
    fireEvent.click(getByText('Almacén'));
    expect(setActiveSection).toHaveBeenCalledWith('almacen');
  });
});
