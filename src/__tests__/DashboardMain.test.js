import React from 'react';
import { render } from '@testing-library/react';
import DashboardMain from '../components/Dashboard/DashboardMain';

describe('DashboardMain', () => {
  it('renderiza el componente sin errores', () => {
    render(<DashboardMain />);
  });
});
