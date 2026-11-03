import { ValidatorFn } from '../core/types';

/**
 * Conjunto de estratégias de validação prontas para uso imediato (Out-of-the-Box).
 *
 * Padrão de Projeto: **Strategy**
 * Cada função retorna uma implementação concreta de `ValidatorFn` (uma estratégia pura e isolada)
 * que recebe o valor do campo e retorna `string` (mensagem de erro) ou `null` (válido).
 */
export const validators = {
  /**
   * Valida se o campo foi preenchido (não nulo, não indefinido e não vazio).
   */
  obrigatorio: (
    mensagem = 'Este campo é obrigatório.'
  ): ValidatorFn => {
    return (value: any): string | null => {
      if (value === null || value === undefined) {
        return mensagem;
      }
      if (typeof value === 'string' && value.trim() === '') {
        return mensagem;
      }
      if (Array.isArray(value) && value.length === 0) {
        return mensagem;
      }
      return null;
    };
  },

  /**
   * Valida se o valor corresponde a um formato de e-mail válido.
   * Campos vazios não disparam erro de formato (delegando obrigatoriedade para `obrigatorio`).
   */
  email: (
    mensagem = 'Digite um endereço de e-mail válido.'
  ): ValidatorFn => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (value: any): string | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      return emailRegex.test(String(value).trim()) ? null : mensagem;
    };
  },

  /**
   * Valida o comprimento mínimo de um texto.
   */
  minLength: (
    min: number,
    mensagem = `Deve ter pelo menos ${min} caracteres.`
  ): ValidatorFn => {
    return (value: any): string | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      return String(value).length >= min ? null : mensagem;
    };
  },

  /**
   * Valida o comprimento máximo permitido de um texto.
   */
  maxLength: (
    max: number,
    mensagem = `Deve ter no máximo ${max} caracteres.`
  ): ValidatorFn => {
    return (value: any): string | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      return String(value).length <= max ? null : mensagem;
    };
  },

  /**
   * Valida se o texto obedece a uma Expressão Regular (Regex) customizada.
   */
  padrao: (
    regex: RegExp,
    mensagem = 'O formato informado é inválido.'
  ): ValidatorFn => {
    return (value: any): string | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      return regex.test(String(value)) ? null : mensagem;
    };
  },

  /**
   * Valida se o valor do campo atual é idêntico ao de outro campo do formulário
   * (ex: confirmação de senha ou confirmação de e-mail).
   */
  igualA: <T extends Record<string, any>>(
    campoAlvo: keyof T,
    mensagem = `O valor deve ser igual ao campo "${String(campoAlvo)}".`
  ): ValidatorFn<T> => {
    return (value: any, formValues?: T): string | null => {
      if (!formValues) {
        return null;
      }
      return value === formValues[campoAlvo] ? null : mensagem;
    };
  },
};

/**
 * Decoradores de Validação.
 *
 * Padrão de Projeto: **Decorator**
 * Envolve (wraps) uma função `ValidatorFn` existente para adicionar ou alterar
 * comportamentos dinamicamente (mensagens customizadas, execução condicional ou
 * pré-processamento do valor) sem modificar o código da estratégia original.
 */
export const validatorDecorators = {
  /**
   * Sobrescreve a mensagem de erro de qualquer validador existente sem alterar sua lógica.
   */
  comMensagem: <T = any>(
    validator: ValidatorFn<T>,
    novaMensagem: string
  ): ValidatorFn<T> => {
    return (value: any, formValues?: T): string | null => {
      const resultado = validator(value, formValues);
      return resultado !== null ? novaMensagem : null;
    };
  },

  /**
   * Executa o validador decorado apenas quando o predicado (condição) for verdadeiro.
   * Ideal para validações condicionais entre campos (ex: exigir CNPJ somente se tipoPessoa === 'PJ').
   */
  quando: <T = any>(
    condicao: (formValues?: T) => boolean,
    validator: ValidatorFn<T>
  ): ValidatorFn<T> => {
    return (value: any, formValues?: T): string | null => {
      if (!condicao(formValues)) {
        return null;
      }
      return validator(value, formValues);
    };
  },

  /**
   * Aplica uma função de transformação/sanitização (ex: remover máscara de CPF/CEP)
   * ao valor antes de repassá-lo ao validador decorado.
   */
  comSanitizacao: <T = any>(
    sanitizador: (value: any) => any,
    validator: ValidatorFn<T>
  ): ValidatorFn<T> => {
    return (value: any, formValues?: T): string | null => {
      const valorLimpo = sanitizador(value);
      return validator(valorLimpo, formValues);
    };
  },
};

