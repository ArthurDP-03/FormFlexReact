import React from 'react';
import { FieldComponentFactory } from '../../../src';

/**
 * EXTENSÃO 4 (Padrão Factory Method + Open/Closed Principle):
 * O desenvolvedor cliente registra novos tipos de componentes visuais
 * ('cpf-mask' e 'moeda-brl') no catálogo da biblioteca sem alterar o pacote original.
 */
export function registrarComponentesCustomizadosDoCliente(): void {
  // 1. Componente com máscara automática de CPF (000.000.000-00)
  FieldComponentFactory.registrarComponente('cpf-mask', ({
    name,
    value,
    onChange,
    onBlur,
    label,
    placeholder,
    error,
    touched,
  }) => {
    const aplicarMascaraCPF = (texto: string) =>
      texto
        .replace(/\D/g, '')
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    return (
      <div className="campo-customizado">
        {label && <label htmlFor={name}>{label}</label>}
        <input
          id={name}
          name={name}
          value={value ?? ''}
          placeholder={placeholder ?? '000.000.000-00'}
          onChange={(e) => onChange(aplicarMascaraCPF(e.target.value))}
          onBlur={onBlur}
        />
        {touched && error && <span className="erro">{error}</span>}
      </div>
    );
  });

  // 2. Componente de valor monetário com prefixo R$
  FieldComponentFactory.registrarComponente('moeda-brl', ({
    name,
    value,
    onChange,
    onBlur,
    label,
    placeholder,
    error,
    touched,
  }) => (
    <div className="campo-customizado">
      {label && <label htmlFor={name}>{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <strong>R$</strong>
        <input
          id={name}
          name={name}
          type="number"
          step="0.01"
          min="1"
          value={value ?? ''}
          placeholder={placeholder ?? '0.00'}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>
      {touched && error && <span className="erro">{error}</span>}
    </div>
  ));
}

