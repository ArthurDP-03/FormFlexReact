/**
 * Contrato para funções de validação síncronas (Padrão Strategy).
 * Recebe o valor atual do campo e todos os valores do formulário,
 * retornando uma mensagem de erro (string) ou null se válido.
 */
export type ValidatorFn<T = any> = (
  value: any,
  formValues?: T
) => string | null;

/**
 * Contrato para funções de validação assíncronas (Padrão Strategy).
 * Permite validações externas (ex: verificar disponibilidade de e-mail/CPF em API)
 * sem alterar o núcleo de controle de estado (Open/Closed Principle).
 */
export type AsyncValidatorFn<T = any> = (
  value: any,
  formValues?: T
) => Promise<string | null>;

/**
 * Representa o estado individual de um campo gerenciado pelo FormController.
 */
export interface FieldState<V = any> {
  /** Valor atual do campo */
  value: V;
  /** Mensagem de erro atual, ou null caso o campo seja válido */
  error: string | null;
  /** Indica se o usuário já interagiu/focou neste campo */
  touched: boolean;
  /** Indica se o valor atual foi modificado em relação ao valor inicial */
  dirty: boolean;
  /** Indica se uma validação assíncrona está em andamento para este campo */
  validating: boolean;
}

/**
 * Representa o estado global e imutável exposto pelo formulário para os inscritos.
 */
export interface FormState<T extends Record<string, any>> {
  /** Mapa com o estado detalhado de cada campo */
  fields: { [K in keyof T]: FieldState<T[K]> };
  /** Objeto chave-valor apenas com os valores atuais dos campos */
  values: T;
  /** Mapa chave-valor com as mensagens de erro de cada campo */
  errors: { [K in keyof T]: string | null };
  /** Indica se todos os campos do formulário estão válidos no momento */
  isValid: boolean;
  /** Indica se algum campo foi modificado em relação ao estado inicial */
  isDirty: boolean;
  /** Indica se o formulário está em processo de submissão ou validação assíncrona */
  isSubmitting: boolean;
}

/**
 * Contrato de função ouvinte para o Padrão Observer (Pub/Sub).
 */
export type Listener<T extends Record<string, any>> = (
  state: FormState<T>
) => void;

/**
 * Configuração interna de um campo registrada durante a montagem (Builder).
 */
export interface FieldConfig<T extends Record<string, any>, K extends keyof T = keyof T> {
  initialValue: T[K];
  validators: ValidatorFn<T>[];
  asyncValidators?: AsyncValidatorFn<T>[];
}

/**
 * Snapshot imutável do estado do formulário (Padrão Memento).
 * Permite salvar e restaurar o estado sem violar o encapsulamento do FormController.
 */
export interface FormMemento<T extends Record<string, any>> {
  readonly timestamp: number;
  readonly stateSnapshot: FormState<T>;
}

