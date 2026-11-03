import {
  AsyncValidatorFn,
  ValidatorFn,
  validatorDecorators,
  validators,
} from '../../../src';

export interface DadosCheckout {
  nomeCliente: string;
  email: string;
  tipoPessoa: 'PF' | 'PJ';
  cpf: string;
  cnpj: string;
  valorDoacao: string;
  cupomDesconto: string;
}

/**
 * EXTENSÃO 1 (Padrão Strategy):
 * Regra síncrona criada pelo desenvolvedor cliente para validar CPF
 * sem modificar o código-fonte da biblioteca FormFlexReact.
 */
export const validarCPF: ValidatorFn<DadosCheckout> = (valor) => {
  const limpo = String(valor ?? '').replace(/\D/g, '');
  if (!limpo) return null;

  if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) {
    return 'CPF inválido: informe os 11 dígitos numéricos.';
  }
  return null;
};

/**
 * EXTENSÃO 2 (Padrão Decorator + Strategy):
 * Usa `validatorDecorators.quando` e `comSanitizacao` para exigir CNPJ
 * apenas quando `tipoPessoa === 'PJ'`.
 */
export const validarCNPJSePessoaJuridica = validatorDecorators.quando<DadosCheckout>(
  (valores) => valores?.tipoPessoa === 'PJ',
  validatorDecorators.comSanitizacao(
    (valor) => String(valor ?? '').replace(/\D/g, ''),
    validators.minLength(14, 'Para Pessoa Jurídica, informe um CNPJ com 14 dígitos.')
  )
);

/**
 * EXTENSÃO 3 (Padrão Strategy Assíncrono + Chain of Responsibility):
 * Simula uma consulta HTTP em uma API externa para validar se um cupom existe.
 */
export const validarCupomNaAPI: AsyncValidatorFn<DadosCheckout> = async (cupom) => {
  const codigo = String(cupom ?? '').trim().toUpperCase();
  if (!codigo) return null; // Cupom é opcional

  // Simula latência de rede (600ms)
  await new Promise((resolve) => setTimeout(resolve, 600));

  const cuponsAtivos = ['DESCONTO10', 'BEMVINDO', 'DESIGNPATTERNS'];
  if (!cuponsAtivos.includes(codigo)) {
    return 'Cupom inválido ou expirado. Tente: DESCONTO10 ou DESIGNPATTERNS.';
  }
  return null;
};

