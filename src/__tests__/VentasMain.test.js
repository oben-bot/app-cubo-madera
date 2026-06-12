import React from 'react';
import { render } from '@testing-library/react';
import VentasMain from '../modules/Sales/VentasMain';

describe('VentasMain', () => {
  it('renderiza el componente sin errores', () => {
    render(<VentasMain />);
  });
});
