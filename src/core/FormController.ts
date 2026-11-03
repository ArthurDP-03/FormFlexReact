import {
  AsyncValidatorFn,
  FieldConfig,
  FieldState,
  FormMemento,
  FormState,
  Listener,
  ValidatorFn,
} from './types';

/**
 * Núcleo reativo e agnóstico de framework (Headless) para gerenciamento de formulários.
 *
 * Padrões de Projeto aplicados nesta classe:
 * 1. **Chain of Responsibility**: Execução sequencial da cadeia de validadores por campo,
 *    interrompendo (short-circuit) na primeira regra que retornar erro.
 * 2. **Observer (Pub/Sub)**: Gerenciamento de ouvintes (`Set<Listener<T>>`) notificados
 *    automaticamente a cada transição de estado via `quandoMudar` / `subscribe`.
 * 3. **Memento**: Captura e restauração de snapshots imutáveis do estado (`criarSnapshot`,
 *    `restaurarSnapshot` e `resetar`) sem expor a estrutura interna mutável.
 */
export class FormController<T extends Record<string, any>> {
  private configs: { [K in keyof T]: FieldConfig<T, K> };
  private fields: { [K in keyof T]: FieldState<T[K]> };
  private isSubmitting = false;
  private listeners: Set<Listener<T>> = new Set();
  private initialMemento: FormMemento<T>;

  constructor(configs: { [K in keyof T]: FieldConfig<T, K> }) {
    this.configs = configs;
    this.fields = {} as { [K in keyof T]: FieldState<T[K]> };

    for (const key in configs) {
      if (Object.prototype.hasOwnProperty.call(configs, key)) {
        this.fields[key] = {
          value: configs[key].initialValue,
          error: null,
          touched: false,
          dirty: false,
          validating: false,
        };
      }
    }

    // Salva o estado inicial utilizando o padrão Memento para permitir reset futuro
    this.initialMemento = this.criarSnapshot();
  }

  /**
   * Constrói e retorna uma visão imutável do estado atual do formulário.
   */
  public getState(): FormState<T> {
    const values = {} as T;
    const errors = {} as { [K in keyof T]: string | null };
    const fieldsCopy = {} as { [K in keyof T]: FieldState<T[K]> };
    let isValid = true;
    let isDirty = false;

    for (const key in this.fields) {
      if (Object.prototype.hasOwnProperty.call(this.fields, key)) {
        const field = this.fields[key];
        fieldsCopy[key] = { ...field };
        values[key] = field.value;
        errors[key] = field.error;

        if (field.error !== null || field.validating) {
          isValid = false;
        }
        if (field.dirty) {
          isDirty = true;
        }
      }
    }

    return {
      fields: fieldsCopy,
      values,
      errors,
      isValid,
      isDirty,
      isSubmitting: this.isSubmitting,
    };
  }

  /**
   * Obtém o valor atual de um campo específico.
   */
  public getValue<K extends keyof T>(name: K): T[K] {
    return this.fields[name].value;
  }

  /**
   * Atualiza o valor de um campo, executa a cadeia de validação e notifica os inscritos.
   */
  public setValue<K extends keyof T>(name: K, value: T[K]): void {
    const currentField = this.fields[name];
    if (!currentField) return;

    const initialValue = this.configs[name].initialValue;
    this.fields[name] = {
      ...currentField,
      value,
      dirty: value !== initialValue,
    };

    this.executarCadeiaValidacao(name);
    this.notificar();

    if (
      this.fields[name].error === null &&
      this.configs[name].asyncValidators &&
      this.configs[name].asyncValidators!.length > 0
    ) {
      void this.validarCampoAsync(name);
    }
  }

  /**
   * Marca um campo como tocado (ex: no evento onBlur) e dispara sua validação.
   */
  public setTouched<K extends keyof T>(name: K, touched = true): void {
    const currentField = this.fields[name];
    if (!currentField) return;

    this.fields[name] = {
      ...currentField,
      touched,
    };

    this.executarCadeiaValidacao(name);
    this.notificar();
  }

  /**
   * Padrão **Chain of Responsibility**:
   * Passa o valor do campo por uma fila sequencial de validadores síncronos.
   * Caso um elo da cadeia retorne erro, a execução é interrompida imediatamente (short-circuit).
   */
  private executarCadeiaValidacao<K extends keyof T>(name: K): string | null {
    const config = this.configs[name];
    const currentField = this.fields[name];
    if (!config || !currentField) return null;

    const currentValues = this.extrairValores();
    let errorMessage: string | null = null;

    for (const validator of config.validators) {
      const erro = validator(currentField.value, currentValues);
      if (erro !== null) {
        errorMessage = erro;
        break; // Interrompe a cadeia no primeiro erro encontrado
      }
    }

    this.fields[name] = {
      ...currentField,
      error: errorMessage,
    };

    return errorMessage;
  }

  /**
   * Valida um único campo de forma síncrona e notifica os ouvintes.
   */
  public validarCampo<K extends keyof T>(name: K): string | null {
    const erro = this.executarCadeiaValidacao(name);
    this.notificar();
    return erro;
  }

  /**
   * Padrão **Chain of Responsibility (Assíncrono)**:
   * Executa a fila de validadores assíncronos apenas se os validadores síncronos aprovarem o campo.
   */
  public async validarCampoAsync<K extends keyof T>(
    name: K
  ): Promise<string | null> {
    const erroSincrono = this.executarCadeiaValidacao(name);
    if (erroSincrono !== null) {
      this.notificar();
      return erroSincrono;
    }

    const asyncValidators = this.configs[name]?.asyncValidators ?? [];
    if (asyncValidators.length === 0) {
      this.notificar();
      return null;
    }

    this.fields[name] = {
      ...this.fields[name],
      validating: true,
    };
    this.notificar();

    const currentValues = this.extrairValores();
    const valorTestado = this.fields[name].value;
    let asyncError: string | null = null;

    for (const asyncValidator of asyncValidators) {
      const erro = await asyncValidator(valorTestado, currentValues);
      if (erro !== null) {
        asyncError = erro;
        break;
      }
    }

    // Garante que o valor não mudou enquanto a Promise resolvia
    if (this.fields[name].value === valorTestado) {
      this.fields[name] = {
        ...this.fields[name],
        error: asyncError,
        validating: false,
      };
      this.notificar();
    }

    return asyncError;
  }

  /**
   * Valida todos os campos de forma síncrona e retorna `true` se o formulário inteiro for válido.
   */
  public validarTudo(): boolean {
    let formularioValido = true;

    for (const key in this.fields) {
      if (Object.prototype.hasOwnProperty.call(this.fields, key)) {
        this.fields[key] = {
          ...this.fields[key],
          touched: true,
        };
        const erro = this.executarCadeiaValidacao(key);
        if (erro !== null) {
          formularioValido = false;
        }
      }
    }

    this.notificar();
    return formularioValido;
  }

  /**
   * Valida todos os campos (síncronos e assíncronos) antes da submissão.
   */
  public async validarTudoAsync(): Promise<boolean> {
    const sincronoValido = this.validarTudo();
    if (!sincronoValido) {
      return false;
    }

    const chaves = Object.keys(this.fields) as Array<keyof T>;
    const resultados = await Promise.all(
      chaves.map((key) => this.validarCampoAsync(key))
    );

    return resultados.every((erro) => erro === null);
  }

  /**
   * Define o estado de submissão em andamento e notifica os ouvintes.
   */
  public setSubmitting(submitting: boolean): void {
    this.isSubmitting = submitting;
    this.notificar();
  }

  /**
   * Extensibilidade (Open/Closed Principle):
   * Permite adicionar novas regras de validação síncronas em tempo de execução.
   */
  public adicionarValidador<K extends keyof T>(
    name: K,
    validator: ValidatorFn<T>
  ): void {
    if (!this.configs[name]) return;
    this.configs[name].validators.push(validator);
  }

  /**
   * Extensibilidade (Open/Closed Principle):
   * Permite adicionar novas regras de validação assíncronas em tempo de execução.
   */
  public adicionarValidadorAsync<K extends keyof T>(
    name: K,
    validator: AsyncValidatorFn<T>
  ): void {
    if (!this.configs[name]) return;
    if (!this.configs[name].asyncValidators) {
      this.configs[name].asyncValidators = [];
    }
    this.configs[name].asyncValidators!.push(validator);
  }

  /**
   * Padrão **Observer (Pub/Sub)**:
   * Inscreve uma função ouvinte que será invocada sempre que o estado do formulário mudar.
   * Retorna uma função `unsubscribe` para cancelar a inscrição.
   */
  public quandoMudar(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Alias padrão de mercado para `quandoMudar` (Padrão Observer).
   */
  public subscribe(listener: Listener<T>): () => void {
    return this.quandoMudar(listener);
  }

  /**
   * Dispara a notificação de mudança de estado para todos os inscritos.
   */
  private notificar(): void {
    const snapshotAtual = this.getState();
    this.listeners.forEach((listener) => listener(snapshotAtual));
  }

  /**
   * Padrão **Memento**:
   * Cria e retorna um snapshot imutável do estado atual do formulário.
   */
  public criarSnapshot(): FormMemento<T> {
    return Object.freeze({
      timestamp: Date.now(),
      stateSnapshot: this.getState(),
    });
  }

  /**
   * Padrão **Memento**:
   * Restaura o estado interno do formulário a partir de um Memento previamente salvo.
   */
  public restaurarSnapshot(memento: FormMemento<T>): void {
    const { fields } = memento.stateSnapshot;
    for (const key in fields) {
      if (Object.prototype.hasOwnProperty.call(fields, key) && this.fields[key]) {
        this.fields[key] = { ...fields[key] };
      }
    }
    this.isSubmitting = false;
    this.notificar();
  }

  /**
   * Restaura o formulário para seu estado inicial usando o Memento capturado na construção.
   */
  public resetar(): void {
    this.restaurarSnapshot(this.initialMemento);
  }

  private extrairValores(): T {
    const values = {} as T;
    for (const key in this.fields) {
      if (Object.prototype.hasOwnProperty.call(this.fields, key)) {
        values[key] = this.fields[key].value;
      }
    }
    return values;
  }
}

