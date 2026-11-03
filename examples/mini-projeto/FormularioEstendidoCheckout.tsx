import React, { useState } from 'react';
import { criarForm, FormMemento, useFlexForm } from '../../src';
import { registrarComponentesCustomizadosDoCliente } from './extensoes/componentesCliente';
import {
  DadosCheckout,
  validarCNPJSePessoaJuridica,
  validarCPF,
  validarCupomNaAPI,
} from './extensoes/validadoresCliente';

// Registra os componentes visuais customizados ('cpf-mask' e 'moeda-brl') na Factory
registrarComponentesCustomizadosDoCliente();

/**
 * DEMONSTRAÇÃO 2: Extensibilidade da Biblioteca (Open/Closed Principle)
 * O cliente injeta validadores síncronos (.validar), assíncronos (.validarAsync),
 * decoradores (validatorDecorators.quando) e novos componentes de UI (FieldComponentFactory).
 */
const formCheckoutEstendido = criarForm<DadosCheckout>()
  .campo('nomeCliente', '')
    .obrigatorio('Informe o nome do titular.')
  .campo('email', '')
    .obrigatorio('Informe o e-mail para recibo.')
    .email('E-mail inválido.')
  .campo('tipoPessoa', 'PF')
    .obrigatorio()
  .campo('cpf', '')
    .obrigatorio('O CPF é obrigatório.')
    .validar(validarCPF) // <-- Estratégia customizada criada pelo cliente!
  .campo('cnpj', '')
    .validar(validarCNPJSePessoaJuridica) // <-- Decorator condicional + sanitização!
  .campo('valorDoacao', '50.00')
    .obrigatorio('Informe um valor.')
  .campo('cupomDesconto', '')
    .validarAsync(validarCupomNaAPI) // <-- Estratégia assíncrona (API)!
  .construir();

export function FormularioEstendidoCheckout() {
  const [checkpoint, setCheckpoint] =
    useState<FormMemento<DadosCheckout> | null>(null);
  const [resultado, setResultado] = useState<DadosCheckout | null>(null);

  const {
    register,
    renderField,
    handleSubmit,
    values,
    errors,
    fields,
    isValid,
    isSubmitting,
    criarSnapshot,
    restaurarSnapshot,
    reset,
  } = useFlexForm(formCheckoutEstendido);

  return (
    <section>
      <h2>2. Caso Estendido pelo Cliente (Open/Closed Principle)</h2>
      <p>
        Demonstra regras customizadas síncronas (<code>validarCPF</code>),
        assíncronas (<code>validarCupomNaAPI</code>), Decorators condicionais (
        <code>quando</code>) e novos componentes visuais registrados na{' '}
        <code>FieldComponentFactory</code> (<code>cpf-mask</code> e{' '}
        <code>moeda-brl</code>).
      </p>

      <form onSubmit={handleSubmit((dados) => setResultado(dados))}>
        {renderField('nomeCliente', {
          type: 'text',
          label: 'Nome do Cliente',
          placeholder: 'Digite seu nome',
        })}

        {renderField('email', {
          type: 'email',
          label: 'E-mail para Nota Fiscal',
          placeholder: 'cliente@empresa.com',
        })}

        {/* Componente customizado 'cpf-mask' registrado pelo cliente na Factory */}
        {renderField('cpf', {
          type: 'cpf-mask',
          label: 'CPF (Componente Customizado com Máscara)',
        })}

        <div>
          <label>Tipo de Pessoa:</label>
          <select {...register('tipoPessoa')}>
            <option value="PF">Pessoa Física (PF)</option>
            <option value="PJ">Pessoa Jurídica (PJ - Exige CNPJ)</option>
          </select>
        </div>

        {values.tipoPessoa === 'PJ' && (
          <div>
            <label>CNPJ (Validado via Decorator Condicional)</label>
            <input {...register('cnpj')} placeholder="00.000.000/0001-00" />
            {fields.cnpj.touched && errors.cnpj && <span>{errors.cnpj}</span>}
          </div>
        )}

        {/* Componente customizado 'moeda-brl' registrado pelo cliente na Factory */}
        {renderField('valorDoacao', {
          type: 'moeda-brl',
          label: 'Valor do Pagamento (Componente Customizado Moeda)',
        })}

        <div>
          <label>
            Cupom de Desconto (Validação Assíncrona: tente{' '}
            <code>DESCONTO10</code>)
          </label>
          <input
            {...register('cupomDesconto')}
            placeholder="Ex.: DESCONTO10"
          />
          {fields.cupomDesconto.validating && (
            <small>⏳ Consultando cupom na API...</small>
          )}
          {!fields.cupomDesconto.validating && errors.cupomDesconto && (
            <span>{errors.cupomDesconto}</span>
          )}
        </div>

        <div>
          <button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Processando...' : 'Finalizar Checkout'}
          </button>

          <button
            type="button"
            onClick={() => setCheckpoint(criarSnapshot())}
          >
            Salvar Checkpoint (Memento)
          </button>

          <button
            type="button"
            disabled={!checkpoint}
            onClick={() => checkpoint && restaurarSnapshot(checkpoint)}
          >
            Restaurar Checkpoint
          </button>

          <button type="button" onClick={reset}>
            Resetar Tudo
          </button>
        </div>
      </form>

      {resultado && (
        <pre>Checkout concluído: {JSON.stringify(resultado, null, 2)}</pre>
      )}
    </section>
  );
}

