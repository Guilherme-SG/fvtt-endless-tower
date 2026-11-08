import { MODULE_ID, MODULE_TITLE } from "../constants";
import { Quote } from "../types/chronicle";
import defaultQuotesJson from "../../data/quotes.json";

export class QuoteManager {
  private static instance: QuoteManager | null = null;
  private defaultQuotes: Quote[] = defaultQuotesJson as Quote[];
  private activeDeck: Quote[] = [];
  private currentQuote: Quote | null = null;

  private constructor() {
    this.refreshDeck();
  }

  public static getInstance(): QuoteManager {
    if (!QuoteManager.instance) {
      QuoteManager.instance = new QuoteManager();
    }
    return QuoteManager.instance;
  }

  /**
   * Inicializa o carregamento de citações do JSON empacotado e de RollTables personalizadas.
   */
  public init(): void {
    this.refreshDeck();
  }

  /**
   * Recarrega e embaralha o baralho ativo de citações (JSON + RollTable opcional).
   */
  public refreshDeck(): void {
    let combinedQuotes: Quote[] = [...this.defaultQuotes];

    try {
      const customTableId = (game as any).settings?.get(MODULE_ID, "chronicleRollTableId");
      if (customTableId && customTableId !== "none") {
        const table = (game as any).tables?.get(customTableId);
        if (table && table.results) {
          const tableQuotes: Quote[] = [];
          for (const result of table.results) {
            const rawText = result.name || result.description || "";
            if (!rawText.trim()) continue;
            tableQuotes.push(this.parseQuoteText(rawText));
          }
          if (tableQuotes.length > 0) {
            combinedQuotes = tableQuotes;
          }
        }
      }
    } catch {
      // Ignora erro se settings ainda não estiverem prontas
    }

    this.activeDeck = this.shuffle([...combinedQuotes]);
    if (!this.currentQuote && this.activeDeck.length > 0) {
      this.currentQuote = this.activeDeck[0];
    }
  }

  /**
   * Analisa uma linha de texto no formato 'Texto da citação — Autor' ou 'Texto da citação - Autor'.
   */
  private parseQuoteText(raw: string): Quote {
    // Remove tags HTML se houver
    const clean = raw.replace(/<[^>]*>/g, "").trim();
    const dashMatch = clean.match(/^(.*?)\s+[—–-]\s+(.*?)$/);
    if (dashMatch) {
      return {
        text: dashMatch[1].replace(/^["'“”«»]|["'“”«»]$/g, "").trim(),
        author: dashMatch[2].trim(),
      };
    }
    return {
      text: clean.replace(/^["'“”«»]|["'“”«»]$/g, "").trim(),
      author: "Desconhecido",
    };
  }

  /**
   * Embaralha um array via Fisher-Yates.
   */
  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Sorteia a mensagem secreta rara do Mestre baseando-se na probabilidade configurada.
   */
  private checkSecretGift(): Quote | null {
    try {
      const giftEnabled = (game as any).settings?.get(MODULE_ID, "chronicleGiftEnabled");
      if (!giftEnabled) return null;

      const giftChance = Number((game as any).settings?.get(MODULE_ID, "chronicleGiftChance") ?? 0.5);
      const roll = Math.random() * 100;

      if (roll < giftChance) {
        const giftMessage = (game as any).settings?.get(MODULE_ID, "chronicleGiftMessage") || "";
        const giftAuthor = (game as any).settings?.get(MODULE_ID, "chronicleGiftAuthor") || "Presente do Mestre";
        if (giftMessage && typeof giftMessage === "string" && giftMessage.trim()) {
          console.log(
            `${MODULE_TITLE} | *** EASTER EGG ATIVADO: Mensagem secreta sorteada! (Roll: ${roll.toFixed(2)} < Chance: ${giftChance}%) ***`
          );
          return {
            text: giftMessage.trim(),
            author: giftAuthor.trim() || "Presente do Mestre",
          };
        }
      }
    } catch {
      // Ignora se configurações ainda não foram registradas
    }
    return null;
  }

  /**
   * Obtém a próxima citação do baralho sem repetições até esgotar.
   */
  public getNextQuote(): Quote {
    // 1. Mensagem Secreta Rara do Mestre (probabilidade configurável separada)
    const secretGift = this.checkSecretGift();
    if (secretGift) {
      this.currentQuote = secretGift;
      return secretGift;
    }

    // 2. Baralho comum (Fisher-Yates sem repetição)
    if (this.activeDeck.length === 0) {
      this.refreshDeck();
    }
    if (this.activeDeck.length === 0) {
      return {
        text: "Desconfio que o lago é o anjo.",
        author: "Jogadores do Lago / 4 Asas",
      };
    }

    const next = this.activeDeck.pop()!;
    this.currentQuote = next;
    return next;
  }

  /**
   * Retorna a citação atual sem avançar o baralho.
   */
  public getCurrentQuote(): Quote {
    if (!this.currentQuote) {
      return this.getNextQuote();
    }
    return this.currentQuote;
  }
}
