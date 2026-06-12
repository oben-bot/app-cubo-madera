import React from 'react';
import { render } from '@testing-library/react';
import WarehouseMain from '../modules/Warehouse/WarehouseMain';

describe('WarehouseMain', () => {
  it('renderiza el componente sin errores', () => {
    render(<AlmacenMain />);
  });
});
