import React, { useState } from 'react';
import { FormularioEstendidoCheckout } from './FormularioEstendidoCheckout';
import { FormularioPadraoCadastro } from './FormularioPadraoCadastro';

/**
 * Aplicação de Demonstração (Mini-Projeto Cliente) consumindo a biblioteca `flexform-react`.
 * Ideal para exibir durante a etapa "Uso Prático" do vídeo de apresentação.
 */
export function App() {
  const [abaAtiva, setAbaAtiva] = useState<'padrao' | 'estendido'>('padrao');

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: 24 }}>
      <header>
        <h1>Demonstração Prática — Biblioteca FormFlexReact</h1>
        <p>
          Selecione abaixo o cenário para visualizar o uso padrão
          (Out-of-the-Box) ou o cenário onde o desenvolvedor cliente estende a
          biblioteca sem modificar seu código-fonte.
        </p>

        <nav style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setAbaAtiva('padrao')}
            style={{ fontWeight: abaAtiva === 'padrao' ? 'bold' : 'normal' }}
          >
            1. Uso Padrão (Cadastro)
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('estendido')}
            style={{ fontWeight: abaAtiva === 'estendido' ? 'bold' : 'normal' }}
          >
            2. Uso Estendido (Checkout + CPF + API Async + Memento)
          </button>
        </nav>
      </header>

      {abaAtiva === 'padrao' ? (
        <FormularioPadraoCadastro />
      ) : (
        <FormularioEstendidoCheckout />
      )}
    </main>
  );
}

export default App;

