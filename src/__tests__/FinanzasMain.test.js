import React from 'react';
import { render } from '@testing-library/react';
import FinanzasMain from '../modules/Finance/FinanzasMain';

describe('FinanzasMain', () => {
  it('renderiza el componente sin errores', () => {
    render(<FinanzasMain />);
  });
});
