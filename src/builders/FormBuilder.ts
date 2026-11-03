import { FormController } from '../core/FormController';
import { AsyncValidatorFn, FieldConfig, ValidatorFn } from '../core/types';
import { validators } from '../validation/validators';

/**
 * Montador Fluído de Formulários.
 *
 * Padrão de Projeto: **Builder (Fluent Interface)**
 * Permite construir passo a passo um objeto complexo (`FormController<T>`) através de
 * chamadas encadeadas (`.campo().obrigatorio().email().construir()`), ocultando os detalhes
 * internos de montagem dos mapas de configuração e listas de validadores.
 */
export class FormBuilder<T extends Record<string, any> = Record<string, any>> {
  private configs: { [K in keyof T]?: FieldConfig<T, K> } = {};
  private campoAtual: keyof T | null = null;

  /**
   * Inicia a configuração de um campo do formulário e define seu valor inicial.
   */
  public campo<K extends keyof T>(
    nome: K,
    valorInicial: T[K] = '' as unknown as T[K]
  ): this {
    this.campoAtual = nome;
    if (!this.configs[nome]) {
      this.configs[nome] = {
        initialValue: valorInicial,
        validators: [],
        asyncValidators: [],
      };
    } else {
      this.configs[nome]!.initialValue = valorInicial;
    }
    return this;
  }

  /**
   * Adiciona a estratégia `obrigatorio` ao campo selecionado atualmente.
   */
  public obrigatorio(mensagem?: string): this {
    return this.validar(validators.obrigatorio(mensagem));
  }

  /**
   * Adiciona a estratégia `email` ao campo selecionado atualmente.
   */
  public email(mensagem?: string): this {
    return this.validar(validators.email(mensagem));
  }

  /**
   * Adiciona a estratégia `minLength` ao campo selecionado atualmente.
   */
  public minLength(min: number, mensagem?: string): this {
    return this.validar(validators.minLength(min, mensagem));
  }

  /**
   * Adiciona a estratégia `maxLength` ao campo selecionado atualmente.
   */
  public maxLength(max: number, mensagem?: string): this {
    return this.validar(validators.maxLength(max, mensagem));
  }

  /**
   * Adiciona a estratégia `padrao` (Regex) ao campo selecionado atualmente.
   */
  public padrao(regex: RegExp, mensagem?: string): this {
    return this.validar(validators.padrao(regex, mensagem));
  }

  /**
   * Adiciona a estratégia `igualA` para comparar com outro campo do formulário.
   */
  public igualA(campoAlvo: keyof T, mensagem?: string): this {
    return this.validar(validators.igualA<T>(campoAlvo, mensagem));
  }

  /**
   * Extensibilidade (Open/Closed Principle):
   * Permite que o desenvolvedor cliente plugue qualquer regra de validação customizada
   * (ou decorada via `validatorDecorators`) sem alterar o código-fonte da biblioteca.
   */
  public validar(validadorCustomizado: ValidatorFn<T>): this {
    this.garantirCampoSelecionado();
    this.configs[this.campoAtual!]!.validators.push(validadorCustomizado);
    return this;
  }

  /**
   * Extensibilidade Assíncrona (Open/Closed Principle):
   * Permite injetar validações assíncronas (ex: consulta de CPF/e-mail em API) no campo atual.
   */
  public validarAsync(validadorAssincrono: AsyncValidatorFn<T>): this {
    this.garantirCampoSelecionado();
    this.configs[this.campoAtual!]!.asyncValidators!.push(validadorAssincrono);
    return this;
  }

  /**
   * Finaliza a montagem e devolve a instância configurada do `FormController<T>`.
   */
  public construir(): FormController<T> {
    return new FormController<T>(
      this.configs as { [K in keyof T]: FieldConfig<T, K> }
    );
  }

  /**
   * Alias em inglês para `construir()`.
   */
  public build(): FormController<T> {
    return this.construir();
  }

  private garantirCampoSelecionado(): void {
    if (this.campoAtual === null) {
      throw new Error(
        'FormFlexReact: Chame .campo("nomeDoCampo") antes de adicionar regras de validação.'
      );
    }
  }
}

/**
 * Função Fábrica para iniciar a construção fluída de um formulário.
 *
 * Padrão de Projeto: **Factory Method / Simple Factory**
 * Encapsula a instanciação do `FormBuilder<T>` já tipado com o contrato Genérico `<T>`.
 */
export function criarForm<
  T extends Record<string, any> = Record<string, any>
>(): FormBuilder<T> {
  return new FormBuilder<T>();
}

