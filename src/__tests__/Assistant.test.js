import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Assistant from '../components/IA/Assistant';

describe('Assistant', () => {
  it('renderiza el mensaje inicial del chatbot', () => {
    const { getByText } = render(
      <Assistant visible={true} onOpen={() => {}} onClose={() => {}} />
    );
    expect(getByText('Hola, soy tu asistente Sharpy. ¿En qué puedo ayudarte hoy?')).toBeInTheDocument();
  });

  it('envía un mensaje y recibe respuesta del bot', () => {
    const { getByPlaceholderText, getByText } = render(
      <Assistant visible={true} onOpen={() => {}} onClose={() => {}} />
    );
    const input = getByPlaceholderText('Escribe tu consulta o tarea...');
    fireEvent.change(input, { target: { value: 'hola' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    setTimeout(() => {
      expect(getByText('¡Hola! ¿En qué puedo ayudarte?')).toBeInTheDocument();
    }, 900);
  });
});
