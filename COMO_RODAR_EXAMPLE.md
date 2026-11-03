# 🖥️ Como Rodar o Projeto de Exemplo (`examples/mini-projeto`)

Este guia explica como abrir, executar e testar o mini-projeto de demonstração localizado na pasta `examples/mini-projeto/`.

---

## 📂 Estrutura do Projeto de Exemplo

```text
examples/mini-projeto/
├── extensoes/
│   ├── validadoresCliente.ts       # Regras customizadas do cliente (CPF, CNPJ condicional, Cupom na API)
│   └── componentesCliente.tsx      # Componentes visuais customizados ('cpf-mask' e 'moeda-brl')
├── FormularioPadraoCadastro.tsx    # Aba 1: Demonstra o uso padrão (Out-of-the-Box)
├── FormularioEstendidoCheckout.tsx # Aba 2: Demonstra o uso estendido pelo cliente (OCP)
├── App.tsx                         # Componente principal alternando entre as 2 abas
├── main.tsx                        # Ponto de entrada React (para Vite)
├── package.json                    # Configuração opcional para rodar com Vite/Node
└── index.html                      # Versão executável direto no navegador (sem precisar de Node.js)
```

---

## 🚀 Opção 1: Rodar Direto no Navegador (Sem precisar instalar Node.js)

O arquivo **`examples/mini-projeto/index.html`** já possui o React 18 configurado via CDN para que você possa abrir e testar tudo imediatamente no navegador.

### Como abrir:
- **Pelo Terminal PowerShell do VS Code:**
  ```powershell
  Invoke-Item .\examples\mini-projeto\index.html
  ```
- **Ou pelo Windows Explorer:**
  Navegue até a pasta `examples\mini-projeto` e dê **2 cliques** no arquivo **`index.html`** para abri-lo no Chrome ou Edge.

---

## 🧪 Roteiro de Testes para Demonstrar no Navegador

Quando o `index.html` abrir no navegador, você verá duas abas no topo:

### 1️⃣ Aba "Caso de Uso Padrão (Out-of-the-Box)"
1. Digite um nome com menos de 3 letras e saia do campo (`Tab`) para ver o erro do `.minLength(3)`.
2. Digite um e-mail inválido (ex.: `teste@`) para ver o erro do `.email()`.
3. Digite senhas diferentes nos campos **Senha** e **Confirmar Senha** para ver o erro do `.igualA('senha')`.
4. Corrija os campos e observe o painel **"Estado Reativo em Tempo Real (Observer)"** à direita atualizando automaticamente a cada tecla digitada (`isValid: true`).
5. Clique em **Criar Conta** para validar o envio e depois em **Limpar (Memento Reset)** para voltar ao estado inicial.

---

### 2️⃣ Aba "Caso com Extensão (CPF + Cupom Async + Decorator + Memento)"
Clique no segundo botão do topo para demonstrar as extensões da pasta `extensoes/`:

1. **Componente Customizado com Máscara de CPF (`cpf-mask`):**
   - Digite números no campo **CPF**.
   - Veja a máscara `000.000.000-00` ser aplicada automaticamente pelo componente registrado via `FieldComponentFactory.registrarComponente('cpf-mask', ...)` e validada pela regra customizada `validarCPF`.
2. **Validação Condicional com Decorator (`validatorDecorators.quando`):**
   - No campo **Tipo de Cadastro**, troque de `Pessoa Física (PF)` para `Pessoa Jurídica (PJ)`.
   - O campo **CNPJ** aparecerá na tela e passará a exigir 14 dígitos automaticamente graças ao Decorator `quando`.
3. **Componente Customizado de Moeda (`moeda-brl`):**
   - Veja o campo **Valor do Pagamento** renderizado com o prefixo `R$` registrado na `FieldComponentFactory`.
4. **Validação Assíncrona simulando API (`.validarAsync`):**
   - No campo **Cupom de Desconto**, digite qualquer código inválido (ex.: `TESTE123`).
   - Observe a mensagem `⏳ Consultando disponibilidade do cupom na API...` (e `validating: true` no painel lateral) seguida do erro retornado após a consulta.
   - Agora digite **`DESCONTO10`** ou **`DESIGNPATTERNS`** e veja a validação assíncrona aprovar o cupom!
5. **Salvar e Restaurar Checkpoint (`Memento`):**
   - Com os campos preenchidos, clique em **📸 Salvar Checkpoint (Memento)**.
   - Altere ou apague vários campos (ou clique em **Limpar Tudo**).
   - Clique em **⏪ Restaurar Checkpoint** e veja todos os valores voltarem exatamente ao estado salvo!

---

## 💻 Opção 2: Rodar via Servidor de Desenvolvimento (Node.js + Vite)

Caso tenha o **Node.js** instalado na máquina e queira rodar os arquivos `.tsx` via servidor Vite:

```powershell
cd examples/mini-projeto
npm install
npm run dev
```

Depois, basta acessar o endereço local exibido no terminal (geralmente `http://localhost:5173`).

