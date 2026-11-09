# Celestial Chronicle (Pausa & Transições de Cena)

O **Celestial Chronicle** é o subsistema nativo do Endless Tower para pausas e transições de cena cinemáticas. Ele unifica e substitui os módulos de terceiros **Alternative Pause Icon** e **Tidbits**, eliminando conflitos de renderização e trazendo uma assinatura visual coesa com o Panteão Celestial e a estética do Ragnarok Online.

---

## Recursos Principais

### 1. Pausa Tática (Lower-Third)
- **Zero interferência tática**: Em vez de bloquear o centro da tela com um ícone rotativo pesado, o modo de pausa do Endless Tower exibe um banner inferior translúcido em vidro fosco (*frosted glass*), mantendo o centro do mapa 100% visível para discussões e decisões de combate.
- **Runa Minimalista**: O indicador de pausa utiliza glifos celestiais (`✧ || ✧`) com pulsação suave em ouro.
- **Rotação de Citações**: Durante intervalos prolongados (bio, lanche), as frases trocam automaticamente via *cross-fade* suave a cada 45 segundos (configurável).

### 2. Transições de Cena Cinemáticas (Living Art + Celestial Gate)
- **Arte Splash Completa**: Ao trocar de cena, uma tela cinematográfica em tela cheia exibe a ilustração com efeito Ken Burns, raios de luz suaves e partículas douradas flutuantes (*Golden Motes*).
- **Revelação 'Celestial Gate'**: Quando o canvas termina de carregar, uma revelação radial de luz dourada (*iris expand*) dissolve a tela de carregamento, revelando o novo mapa de forma suave e épica.
- **Duração Mínima e Clique para Avançar**: Por padrão, a tela permanece visível por no mínimo 3 segundos para permitir a leitura confortável da frase. Se o mapa já tiver carregado e o jogador/mestre quiser avançar imediatamente, basta **clicar na tela**.

### 3. Eliminação do Conflito de Mensagem Dupla
Quando o mestre troca de cena com o jogo já pausado, o sistema:
1. Oculta o banner de pausa durante o carregamento da cena.
2. Exibe a tela de transição com a arte e citação.
3. Ao término da revelação radial, o banner inferior de pausa surge suavemente no rodapé **com a mesma citação já lida**, sem duplicar texto ou sobrepor caixas.

### 4. Suporte a Imagem Personalizada por Cena
No menu de **Configuração da Cena** (`Scene Configuration`), o mestre tem um novo campo:
- **Endless Tower: Imagem de Transição (Splash Art)**: Permite selecionar uma imagem específica para aquela cena (ex: mapa de torneio, cripta, coliseu). Se deixado em branco, o sistema recorre à pasta de splash padrão da Torre.

---

## Configurações do Módulo

Acesse `Configurações do Jogo -> Configurações de Módulos -> Endless Tower`:

| Configuração | Escopo | Padrão | Descrição |
|---|---|---|---|
| **Ativar Transições de Cena Cinemáticas** | Cliente | `true` | Ativa a tela com arte e partículas ao trocar de cena. |
| **Ativar Modo de Pausa Celestial** | Cliente | `true` | Substitui a pausa nativa do Foundry pelo banner inferior com runas. |
| **Duração Mínima da Transição** | Cliente | `3s` | Tempo mínimo para leitura da citação (1 a 8s). |
| **Intervalo de Rotação de Citações** | Cliente | `45s` | Tempo entre trocas de citações durante pausas longas (15 a 180s). |
| **RollTable Personalizada de Citações** | Mundo | `none` | Seleciona uma tabela rolável do Foundry para usar como frases da mesa. |
| **Pasta de Imagens de Splash** | Mundo | `modules/endless-tower/assets/screen-transition` | Pasta com artes de transição sorteadas aleatoriamente (.webp/.png). |
| **Presente do Mestre: Ativar Mensagem Secreta** | Mundo | `true` | Ativa a chance de exibir uma frase secreta com recompensa. |
| **Presente do Mestre: Probabilidade (%)** | Mundo | `0.5%` | Chance matemática de sorteio da mensagem secreta (ex: 0.5% = 1 em 200). |
| **Presente do Mestre: Texto da Mensagem** | Mundo | Frase padrão | Texto da recompensa e código secreto resgatável. |
| **Presente do Mestre: Assinatura** | Mundo | `Presente do Mestre` | Nome exibido na autoria da mensagem secreta. |

---

## Mensagem Secreta & Presente do Mestre (Easter Egg)

O sistema inclui um mecanismo dedicado de recompensa rara por probabilidade independente:
- **Separação matemática**: A mensagem secreta **não** fica misturada com as frases comuns do baralho. Isso garante que você não precise diluir o baralho com linhas vazias para deixá-la rara. Todas as frases comuns possuem chances idênticas (100% igualitárias via Fisher-Yates), enquanto a mensagem secreta é testada a cada sorteio com a probabilidade exata definida nas configurações (ex: `0.5%`).
- **Resgate e Ciclo**: Quando um jogador tem a sorte de ver a mensagem secreta e enviar a resposta no privado do Mestre, o Mestre entrega o presente misterioso e simplesmente edita o campo **Presente do Mestre: Texto da Mensagem** nas configurações para definir um novo código ou enigma para a próxima vez.

---

## Formato das Citações e Tipografia

As frases padrão do baralho (~120 citações, migradas e categorizadas a partir do Tidbits e do folclore de Endless Tower) estão em `modules/endless-tower/data/quotes.json`.

### Aspas Tipográficas Balanceadas
Diferente da renderização padrão de fontes sem serifa em *faux-italic* (onde o fechamento `”` colapsa e parece uma aspa simples `'`), o Celestial Chronicle utiliza glifos serifados dedicados (`“` e `”` em `Georgia`) com estilo normal e realce dourado suave (`--et-gold`), garantindo que tanto a abertura quanto o fechamento sejam perfeitamente visíveis, simétricos e duplos.

```json
[
  {
    "text": "Desconfio que o lago é o anjo.",
    "author": "Jogadores do Lago / 4 Asas"
  }
]
```

### Usando uma RollTable no Foundry
Se preferir criar ou gerenciar as frases diretamente dentro do Foundry:
1. Crie uma nova RollTable (ex: `Citações da Mesa`).
2. Adicione resultados no formato:
   `"O lago é o anjo." — Jogadores do Lago` ou simplesmente `Texto da frase - Autor`.
3. Nas configurações do módulo, selecione a RollTable criada no campo **RollTable Personalizada de Citações**.

---

## Migração e Limpeza

> [!IMPORTANT]
> Para evitar conflitos visuais no DOM do Foundry, **desative** os módulos antigos no seu mundo:
> - `Alternative Pause Icon` (`pause-icon`)
> - `Tidbits` (`tidbits`)
>
> O **Celestial Chronicle** já incorpora todas as funções de ambos com muito mais performance, elegância e integração ao mundo de Endless Tower.
