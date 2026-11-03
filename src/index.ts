/**
 * Ponto de Entrada Público da Biblioteca (Vitrine).
 *
 * Padrão de Projeto: **Facade (Barrel Export)**
 * Fornece uma interface unificada, coesa e simplificada para todos os subsistemas internos
 * da biblioteca (`core`, `validation`, `builders` e `adapters`), desacoplando o código
 * consumidor da estrutura interna de diretórios do pacote.
 */

// Contratos e Tipagens (Core)
export type {
  ValidatorFn,
  AsyncValidatorFn,
  FieldState,
  FormState,
  Listener,
  FieldConfig,
  FormMemento,
} from './core/types';

// Cérebro / Motor Reativo Headless (Observer + Chain of Responsibility + Memento)
export { FormController } from './core/FormController';

// Regras de Validação e Decoradores (Strategy + Decorator)
export { validators, validatorDecorators } from './validation/validators';

// Construtor Fluído e Fábrica de Formulários (Builder + Factory Method)
export { FormBuilder, criarForm } from './builders/FormBuilder';

// Conector React e Fábrica Extensível de Componentes Visuais (Adapter + Factory Method)
export {
  useFlexForm,
  FieldComponentFactory,
  type RegisteredFieldProps,
  type FlexFieldRenderProps,
  type FieldRenderer,
} from './adapters/useFlexForm';

