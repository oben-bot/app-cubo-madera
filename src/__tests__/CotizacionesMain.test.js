import React from 'react';
import { render } from '@testing-library/react';
import CotizacionesMain from '../modules/Quotations/CotizacionesMain';

describe('CotizacionesMain', () => {
  it('renderiza el componente sin errores', () => {
    render(<CotizacionesMain />);
  });
});
