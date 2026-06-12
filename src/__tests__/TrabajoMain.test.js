import React from 'react';
import { render } from '@testing-library/react';
import ProductionMain from '../modules/Production/ProductionMain';

describe('ProductionMain', () => {
  it('renderiza el componente sin errores', () => {
    render(<TrabajoMain />);
  });
});
