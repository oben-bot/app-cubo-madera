import React from 'react';
import { render } from '@testing-library/react';
import ClientesMain from '../modules/Customers/ClientesMain';

describe('ClientesMain', () => {
  it('renderiza el componente sin errores', () => {
    render(<ClientesMain />);
  });
});
