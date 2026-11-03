import React, { useState } from 'react';
import { criarForm, useFlexForm } from '../../src';

interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

/**
 * DEMONSTRAÇÃO 1: Uso Padrão (Out-of-the-Box)
 * Utiliza apenas os validadores e recursos nativos que já vêm prontos na biblioteca.
 */
const formCadastroPadrao = criarForm<DadosCadastro>()
  .campo('nome', '')
    .obrigatorio('O nome completo é obrigatório.')
    .minLength(3, 'Digite pelo menos 3 caracteres.')
  .campo('email', '')
    .obrigatorio('O e-mail é obrigatório.')
    .email('Informe um endereço de e-mail válido.')
  .campo('senha', '')
    .obrigatorio('Crie uma senha.')
    .minLength(8, 'A senha deve ter no mínimo 8 caracteres.')
  .campo('confirmarSenha', '')
    .obrigatorio('Confirme sua senha.')
    .igualA('senha', 'A confirmação de senha não confere.')
  .construir();

export function FormularioPadraoCadastro() {
  const [enviado, setEnviado] = useState<DadosCadastro | null>(null);

  const {
    register,
    handleSubmit,
    errors,
    fields,
    isValid,
    isDirty,
    isSubmitting,
    reset,
  } = useFlexForm(formCadastroPadrao);

  const aoSubmeter = (valores: DadosCadastro) => {
    setEnviado(valores);
  };

  return (
    <section>
      <h2>1. Caso de Uso Padrão (Out-of-the-Box)</h2>
      <p>
        Construído com <code>criarForm()</code> + validadores nativos (
        <code>obrigatorio</code>, <code>email</code>, <code>minLength</code>,{' '}
        <code>igualA</code>) + Hook <code>useFlexForm</code>.
      </p>

      <form onSubmit={handleSubmit(aoSubmeter)}>
        <div>
          <label>Nome Completo</label>
          <input {...register('nome')} placeholder="Ex.: Maria Souza" />
          {fields.nome.touched && errors.nome && <span>{errors.nome}</span>}
        </div>

        <div>
          <label>E-mail</label>
          <input
            type="email"
            {...register('email')}
            placeholder="maria@exemplo.com"
          />
          {fields.email.touched && errors.email && <span>{errors.email}</span>}
        </div>

        <div>
          <label>Senha</label>
          <input
            type="password"
            {...register('senha')}
            placeholder="Mínimo 8 caracteres"
          />
          {fields.senha.touched && errors.senha && <span>{errors.senha}</span>}
        </div>

        <div>
          <label>Confirmar Senha</label>
          <input
            type="password"
            {...register('confirmarSenha')}
            placeholder="Repita a senha"
          />
          {fields.confirmarSenha.touched && errors.confirmarSenha && (
            <span>{errors.confirmarSenha}</span>
          )}
        </div>

        <div>
          <button type="submit" disabled={!isValid || isSubmitting}>
            Cadastrar Conta
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={() => {
              reset();
              setEnviado(null);
            }}
          >
            Resetar (Memento Inicial)
          </button>
        </div>
      </form>

      {enviado && (
        <pre>Payload enviado com sucesso: {JSON.stringify(enviado, null, 2)}</pre>
      )}
    </section>
  );
}

