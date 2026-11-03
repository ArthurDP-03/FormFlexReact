# FormFlexReact (`flexform-react`)

Biblioteca reativa, tipada e extensível para **construção programática de formulários e validação de dados** em aplicações React e TypeScript, projetada sob os princípios de **Clean Code**, **SOLID (Open/Closed Principle)** e **Design Patterns (GoF)**.

---

## 👥 Equipe (Integrantes)

| Aluno | Matrícula / GitHub | Padrões Apresentados no Vídeo |
| :--- | :--- | :--- |
| **Arthur Oliveira** *(preencher nome completo)* | [@ArthurDP-03](https://github.com/ArthurDP-03) | Strategy & Chain of Responsibility |
| **Caio** *(preencher nome completo)* | [@caiobozzprocopilot](https://github.com/caiobozzprocopilot) | Observer (Pub/Sub) & Builder (Fluent Interface) |
| **João Victor** *(preencher nome completo)* | [@Jvictoroak](https://github.com/Jvictoroak) | Adapter & Facade |
| **Matheus** *(preencher nome completo)* | [@MatheusDBS](https://github.com/MatheusDBS) | Decorator & Memento / Factory Method |

---

## 🎥 Vídeo de Apresentação (YouTube)

> 🔗 **Link para o vídeo de defesa arquitetural e demonstração prática (Não listado):**  
> **[👉 Assistir Apresentação no YouTube (Inserir Link Aqui)](https://www.youtube.com/watch?v=SEU_LINK_AQUI)**

---

## 🎯 Visão Geral e Problema Resolvido

No desenvolvimento Frontend moderno, o gerenciamento de formulários complexos frequentemente sofre com três grandes problemas de design:
1. **Forte acoplamento entre UI e regras de negócio:** Validações misturadas diretamente dentro de componentes visuais (`if/else` espalhados em handlers `onChange`/`onSubmit`).
2. **Dificuldade de extensão:** Bibliotecas rígidas que exigem gambiarras quando o desenvolvedor precisa adicionar validações assíncronas (ex.: consultar API), validações condicionais entre campos ou novos tipos de inputs mascarados.
3. **Renderizações desnecessárias e código repetitivo (boilerplate):** Controle manual de estados `value`, `error`, `touched`, `dirty` e `isSubmitting` para cada campo.

A **FormFlexReact** resolve esses problemas separando completamente o **motor reativo de estado e validação (Headless Core)** da **camada de adaptação e renderização visual (React Adapter & Field Factory)**.

---

## 📦 Instalação

Em um projeto React (`>= 18.0.0`) com TypeScript:

```bash
npm install flexform-react
```

---

## 🚀 Como Usar a Biblioteca (Documentação)

### 1. Caso de Uso Padrão (Out-of-the-Box)

A biblioteca já oferece validadores prontos (`obrigatorio`, `email`, `minLength`, `maxLength`, `padrao`, `igualA`), um construtor fluído (`criarForm`) e o Hook `useFlexForm` para conexão imediata com componentes React:

```tsx
import React from 'react';
import { criarForm, useFlexForm } from 'flexform-react';

// 1. Contrato de tipos do formulário (garante autocompletar e segurança de tipos)
interface CadastroForm {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

// 2. Construção declarativa com o Padrão Builder (Fluent Interface)
const formCadastro = criarForm<CadastroForm>()
  .campo('nome', '')
    .obrigatorio('O nome completo é obrigatório.')
    .minLength(3, 'O nome deve possuir pelo menos 3 caracteres.')
  .campo('email', '')
    .obrigatorio('O e-mail é obrigatório.')
    .email('Informe um e-mail válido.')
  .campo('senha', '')
    .obrigatorio('A senha é obrigatória.')
    .minLength(8, 'A senha deve ter no mínimo 8 caracteres.')
  .campo('confirmarSenha', '')
    .obrigatorio('Confirme sua senha.')
    .igualA('senha', 'As senhas não conferem.')
  .construir();

export function PaginaCadastro() {
  // 3. Conexão ao ciclo de vida do React com o Padrão Adapter (useFlexForm)
  const { register, handleSubmit, errors, fields, isValid, isSubmitting, reset } =
    useFlexForm(formCadastro);

  const enviarDados = async (dados: CadastroForm) => {
    console.log('Formulário válido! Enviando payload:', dados);
  };

  return (
    <form onSubmit={handleSubmit(enviarDados)}>
      <div>
        <label>Nome</label>
        <input {...register('nome')} placeholder="Seu nome" />
        {fields.nome.touched && errors.nome && <span>{errors.nome}</span>}
      </div>

      <div>
        <label>E-mail</label>
        <input type="email" {...register('email')} placeholder="seu@email.com" />
        {fields.email.touched && errors.email && <span>{errors.email}</span>}
      </div>

      <div>
        <label>Senha</label>
        <input type="password" {...register('senha')} />
        {fields.senha.touched && errors.senha && <span>{errors.senha}</span>}
      </div>

      <div>
        <label>Confirmar Senha</label>
        <input type="password" {...register('confirmarSenha')} />
        {fields.confirmarSenha.touched && errors.confirmarSenha && (
          <span>{errors.confirmarSenha}</span>
        )}
      </div>

      <button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Cadastrar'}
      </button>
      <button type="button" onClick={reset}>
        Limpar
      </button>
    </form>
  );
}
```

---

### 2. Extensibilidade (Open/Closed Principle)

A arquitetura da **FormFlexReact** foi desenhada para que o desenvolvedor cliente possa estender regras síncronas, regras assíncronas, decoradores de validação e novos tipos de campos visuais **sem alterar nenhuma linha do código-fonte original da biblioteca**.

#### 2.1. Criando Regras de Validação Customizadas (Síncronas, Assíncronas e Decoradas)

```tsx
import {
  criarForm,
  ValidatorFn,
  AsyncValidatorFn,
  validatorDecorators,
  validators,
} from 'flexform-react';

interface CheckoutForm {
  tipoPessoa: 'PF' | 'PJ';
  documento: string;
  cupom: string;
}

// ✅ Extensão 1: Estratégia Síncrona Customizada (Strategy)
const validarCPF: ValidatorFn<CheckoutForm> = (valor) => {
  const apenasNumeros = String(valor ?? '').replace(/\D/g, '');
  if (apenasNumeros.length !== 11) {
    return 'O CPF deve conter exatamente 11 dígitos numéricos.';
  }
  return null;
};

// ✅ Extensão 2: Estratégia Assíncrona Customizada (Async Strategy)
const verificarCupomNaAPI: AsyncValidatorFn<CheckoutForm> = async (cupom) => {
  if (!cupom) return null;
  await new Promise((resolve) => setTimeout(resolve, 400)); // Simula chamada HTTP
  const cuponsValidos = ['DESCONTO10', 'BEMVINDO'];
  return cuponsValidos.includes(String(cupom).toUpperCase())
    ? null
    : 'Cupom expirado ou inexistente.';
};

// ✅ Extensão 3: Uso de Decorators para validação condicional e sanitização
const validarCPFCondicional = validatorDecorators.quando<CheckoutForm>(
  (valores) => valores?.tipoPessoa === 'PF',
  validatorDecorators.comSanitizacao(
    (val) => String(val ?? '').replace(/\D/g, ''),
    validators.obrigatorio('CPF é obrigatório para Pessoa Física.')
  )
);

export const formCheckout = criarForm<CheckoutForm>()
  .campo('tipoPessoa', 'PF')
    .obrigatorio()
  .campo('documento', '')
    .validar(validarCPFCondicional)
    .validar(validarCPF)
  .campo('cupom', '')
    .validarAsync(verificarCupomNaAPI)
  .construir();
```

#### 2.2. Registrando Novos Tipos de Componentes Visuais (`FieldComponentFactory`)

O desenvolvedor pode registrar novos tipos de campos no catálogo da `FieldComponentFactory` e renderizá-los diretamente pelo método `renderField`:

```tsx
import React from 'react';
import { FieldComponentFactory, useFlexForm, criarForm } from 'flexform-react';

// Registra um novo tipo de campo 'cpf-mask' sem modificar a biblioteca
FieldComponentFactory.registrarComponente('cpf-mask', ({
  name,
  value,
  onChange,
  onBlur,
  label,
  error,
  touched,
}) => {
  const formatarCPF = (texto: string) =>
    texto
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');

  return (
    <div className="campo-customizado-cpf">
      {label && <label htmlFor={name}>{label}</label>}
      <input
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(formatarCPF(e.target.value))}
        onBlur={onBlur}
        placeholder="000.000.000-00"
      />
      {touched && error && <small className="erro">{error}</small>}
    </div>
  );
});

// Uso no componente React:
const form = criarForm<{ cpf: string }>().campo('cpf', '').obrigatorio().construir();

export function MeuFormularioCPF() {
  const { renderField, handleSubmit } = useFlexForm(form);

  return (
    <form onSubmit={handleSubmit((dados) => console.log(dados))}>
      {renderField('cpf', { type: 'cpf-mask', label: 'Digite seu CPF' })}
      <button type="submit">Confirmar</button>
    </form>
  );
}
```

#### 2.3. Controle de Histórico e Checkpoints com Memento (`criarSnapshot` / `restaurarSnapshot`)

```tsx
const { criarSnapshot, restaurarSnapshot, reset } = useFlexForm(formCadastro);

// Salva um ponto de restauração (checkpoint) durante um wizard multi-etapas
const checkpoint = criarSnapshot();

// Restaura exatamente o estado salvo caso o usuário cancele a edição da etapa
restaurarSnapshot(checkpoint);

// Ou volta para o estado inicial de fábrica
reset();
```

---

## 🏛️ Arquitetura e Design Patterns Aplicados

A estrutura do projeto divide claramente as responsabilidades em camadas independentes:

```text
FormFlexReact/
├── src/
│   ├── core/
│   │   ├── types.ts            # Contratos estáticos e Generics (<T>)
│   │   └── FormController.ts   # Motor Headless (Observer + Chain of Responsibility + Memento)
│   ├── validation/
│   │   └── validators.ts       # Estratégias puras e Decoradores (Strategy + Decorator)
│   ├── builders/
│   │   └── FormBuilder.ts      # Montador fluído e fábrica (Builder + Factory Method)
│   ├── adapters/
│   │   └── useFlexForm.ts      # Conector React e fábrica de UI (Adapter + Factory Method)
│   └── index.ts                # Ponto único de exportação (Facade)
├── package.json
└── tsconfig.json
```

### Resumo dos 8 Padrões de Projeto na Biblioteca

| # | Padrão de Projeto | Onde foi Implementado | Problema de Design Resolvido |
| :-: | :--- | :--- | :--- |
| **1** | **Strategy** | `src/validation/validators.ts` (`validators` e `ValidatorFn`) | Isola algoritmos de validação em funções puras e intercambiáveis, eliminando condicionais (`if/else`) rígidos no controlador e permitindo injeção de novas regras pelo usuário. |
| **2** | **Decorator** | `src/validation/validators.ts` (`validatorDecorators`) | Permite acoplar responsabilidades dinâmicas a qualquer validador existente (`comMensagem`, `quando`, `comSanitizacao`) sem modificar a função original. |
| **3** | **Chain of Responsibility** | `src/core/FormController.ts` (`executarCadeiaValidacao` e `validarCampoAsync`) | Processa uma fila ordenada de validadores para cada campo e interrompe a cadeia no primeiro erro encontrado (*short-circuit*), evitando processamento desnecessário. |
| **4** | **Observer (Pub/Sub)** | `src/core/FormController.ts` (`listeners`, `quandoMudar`, `notificar`) | Desacopla o motor de estado (`FormController`) do React, notificando quaisquer ouvintes inscritos apenas quando o estado do formulário sofre alteração. |
| **5** | **Memento** | `src/core/FormController.ts` (`criarSnapshot`, `restaurarSnapshot`, `resetar`) | Captura snapshots imutáveis do estado interno (`FormMemento<T>`) para suportar *reset* e restauração de checkpoints sem quebrar o encapsulamento. |
| **6** | **Builder (Fluent Interface)** | `src/builders/FormBuilder.ts` (`FormBuilder`) | Simplifica a construção passo a passo de formulários complexos com múltiplos campos e regras através de encadeamento fluído de métodos. |
| **7** | **Factory Method** | `src/builders/FormBuilder.ts` (`criarForm`) e `src/adapters/useFlexForm.ts` (`FieldComponentFactory`) | Abstrai a criação do builder tipado e permite registrar/instanciar dinamicamente componentes visuais de campos sem acoplamento concreto. |
| **8** | **Adapter & Facade** | `src/adapters/useFlexForm.ts` (`useFlexForm`) e `src/index.ts` | O **Adapter** traduz o motor agnóstico para Hooks e eventos DOM do React (`register`/`handleSubmit`), enquanto a **Facade** (`src/index.ts`) expõe uma API única e limpa para o pacote. |

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](./LICENSE) para mais informações.
