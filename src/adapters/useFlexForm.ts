import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FormController } from '../core/FormController';
import { FormMemento, FormState } from '../core/types';

/**
 * Propriedades injetadas em um componente de campo via `register(name)`.
 */
export interface RegisteredFieldProps<V = any> {
  name: string;
  value: V;
  onChange: (
    eventOrValue:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | V
  ) => void;
  onBlur: () => void;
}

/**
 * Propriedades recebidas por qualquer componente de campo gerenciado pela Factory de UI.
 */
export interface FlexFieldRenderProps<V = any> extends RegisteredFieldProps<V> {
  label?: string;
  placeholder?: string;
  error?: string | null;
  touched?: boolean;
  validating?: boolean;
  type?: string;
}

/**
 * Contrato de um renderizador de campo (Padrão Factory Method / Abstract Component).
 */
export type FieldRenderer<V = any> = (
  props: FlexFieldRenderProps<V>
) => React.ReactElement;

/**
 * Fábrica e Registro Extensível de Tipos de Campos Visuais.
 *
 * Padrão de Projeto: **Factory Method (com Registry)**
 * Permite que a biblioteca ofereça campos padrão prontos para uso (text, email, password, number)
 * e que o desenvolvedor cliente registre novos tipos de campos customizados (ex: 'cpf', 'moeda', 'datepicker')
 * respeitando o Princípio Aberto/Fechado (Open/Closed Principle).
 */
export class FieldComponentFactory {
  private static registry: Map<string, FieldRenderer> = new Map();

  static {
    const defaultInputRenderer: FieldRenderer = ({
      name,
      value,
      onChange,
      onBlur,
      label,
      placeholder,
      error,
      touched,
      type = 'text',
    }) =>
      React.createElement(
        'div',
        { className: `flexform-field flexform-field-${type}` },
        label
          ? React.createElement('label', { htmlFor: name }, label)
          : null,
        React.createElement('input', {
          id: name,
          name,
          type,
          value: value ?? '',
          placeholder,
          onChange,
          onBlur,
          'aria-invalid': Boolean(touched && error),
        }),
        touched && error
          ? React.createElement(
              'span',
              { role: 'alert', className: 'flexform-error' },
              error
            )
          : null
      );

    FieldComponentFactory.registry.set('text', defaultInputRenderer);
    FieldComponentFactory.registry.set('email', (props) =>
      defaultInputRenderer({ ...props, type: 'email' })
    );
    FieldComponentFactory.registry.set('password', (props) =>
      defaultInputRenderer({ ...props, type: 'password' })
    );
    FieldComponentFactory.registry.set('number', (props) =>
      defaultInputRenderer({ ...props, type: 'number' })
    );
  }

  /**
   * Registra um novo tipo de campo visual sem alterar o código-fonte da biblioteca (OCP).
   */
  public static registrarComponente<V = any>(
    tipo: string,
    renderer: FieldRenderer<V>
  ): void {
    FieldComponentFactory.registry.set(tipo, renderer);
  }

  /**
   * Cria o elemento React correspondente ao tipo solicitado usando o catálogo registrado.
   */
  public static criarComponente<V = any>(
    tipo: string,
    props: FlexFieldRenderProps<V>
  ): React.ReactElement {
    const renderer =
      FieldComponentFactory.registry.get(tipo) ??
      FieldComponentFactory.registry.get('text')!;
    return renderer({ ...props, type: tipo });
  }
}

/**
 * Hook de integração entre o `FormController` (Headless) e o React.
 *
 * Padrão de Projeto: **Adapter**
 * Adapta a interface de eventos e estado do motor em TypeScript puro (`FormController`)
 * para o ciclo de vida reativo do React (`useState` + `useEffect`) e traduz eventos
 * nativos do DOM (`ChangeEvent`, `FormEvent`) para chamadas aos métodos do controlador.
 */
export function useFlexForm<T extends Record<string, any>>(
  controllerOrFactory: FormController<T> | (() => FormController<T>)
) {
  const controllerRef = useRef<FormController<T> | null>(null);
  if (!controllerRef.current) {
    controllerRef.current =
      typeof controllerOrFactory === 'function'
        ? controllerOrFactory()
        : controllerOrFactory;
  }
  const controller = controllerRef.current;

  const [state, setState] = useState<FormState<T>>(() => controller.getState());

  useEffect(() => {
    // Inscreve o componente React como Observer do FormController
    const unsubscribe = controller.quandoMudar((novoEstado) => {
      setState(novoEstado);
    });
    return unsubscribe;
  }, [controller]);

  /**
   * Conecta um input do React ou componente customizado diretamente a um campo do FormController.
   */
  const register = useCallback(
    <K extends keyof T>(name: K): RegisteredFieldProps<T[K]> => {
      const currentField = state.fields[name];

      return {
        name: String(name),
        value: currentField ? currentField.value : ('' as unknown as T[K]),
        onChange: (eventOrValue) => {
          let novoValor: any = eventOrValue;

          if (
            eventOrValue &&
            typeof eventOrValue === 'object' &&
            'target' in eventOrValue &&
            eventOrValue.target !== undefined
          ) {
            const target = eventOrValue.target as HTMLInputElement;
            novoValor =
              target.type === 'checkbox' ? target.checked : target.value;
          }

          controller.setValue(name, novoValor as T[K]);
        },
        onBlur: () => {
          controller.setTouched(name, true);
        },
      };
    },
    [controller, state.fields]
  );

  /**
   * Adapta o evento `onSubmit` do formulário HTML, prevenindo o recarregamento da página,
   * executando todas as cadeias de validação (síncronas e assíncronas) e invocando o callback
   * `onValid` apenas se todos os campos estiverem válidos.
   */
  const handleSubmit = useCallback(
    (
      onValid: (values: T) => void | Promise<void>,
      onInvalid?: (errors: { [K in keyof T]: string | null }) => void
    ) => {
      return async (event?: React.FormEvent) => {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }

        controller.setSubmitting(true);
        try {
          const isValid = await controller.validarTudoAsync();
          const currentState = controller.getState();

          if (isValid) {
            await onValid(currentState.values);
          } else if (onInvalid) {
            onInvalid(currentState.errors);
          }
        } finally {
          controller.setSubmitting(false);
        }
      };
    },
    [controller]
  );

  const setValue = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      controller.setValue(name, value);
    },
    [controller]
  );

  const reset = useCallback(() => {
    controller.resetar();
  }, [controller]);

  const criarSnapshot = useCallback((): FormMemento<T> => {
    return controller.criarSnapshot();
  }, [controller]);

  const restaurarSnapshot = useCallback(
    (memento: FormMemento<T>) => {
      controller.restaurarSnapshot(memento);
    },
    [controller]
  );

  /**
   * Renderiza um campo utilizando a `FieldComponentFactory` já conectado ao estado do formulário.
   */
  const renderField = useCallback(
    <K extends keyof T>(
      name: K,
      options?: {
        type?: string;
        label?: string;
        placeholder?: string;
      }
    ): React.ReactElement => {
      const reg = register(name);
      const fieldState = state.fields[name];
      return FieldComponentFactory.criarComponente(options?.type ?? 'text', {
        ...reg,
        label: options?.label,
        placeholder: options?.placeholder,
        error: fieldState?.error ?? null,
        touched: fieldState?.touched ?? false,
        validating: fieldState?.validating ?? false,
      });
    },
    [register, state.fields]
  );

  return {
    values: state.values,
    errors: state.errors,
    fields: state.fields,
    isValid: state.isValid,
    isDirty: state.isDirty,
    isSubmitting: state.isSubmitting,
    register,
    handleSubmit,
    setValue,
    reset,
    criarSnapshot,
    restaurarSnapshot,
    renderField,
    controller,
  };
}

