// ABOUTME: Concrete implementation of LLMProvider using Anthropic Claude API for text rewriting
// ABOUTME: Generates 5 stylistically distinct proposals using carefully crafted prompt

import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, ConnectionTestResult } from '@/domain/interfaces/LLMProvider';
import { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';
import { NarrativeAnalysis } from '@/domain/value-objects/NarrativeAnalysis';

interface ProposalResponse {
  proposals: Array<{
    content: string;
    styleLabel?: string;
  }>;
}

interface NarrativeAnalysisResponse {
  narratorType: string;
  focalization: string;
  temporality: string;
  chapterStructure: string;
  narrativeVoice: string[];
  summary: string;
}

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;
  private promptRepository: PromptRepository;

  constructor(
    apiKey: string,
    promptRepository: PromptRepository,
    model: string = 'claude-sonnet-4-5-20250929'
  ) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.promptRepository = promptRepository;
  }

  async generateRewrites(
    text: string,
    context?: string
  ): Promise<RewriteProposal[]> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(text, context);

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.85, // Balanced creativity with coherence
        // Note: Anthropic does not support top_p parameter with Claude 4.5 models
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extract text content from response
      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      return this.parseResponse(content.text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during text generation');
    }
  }

  private buildSystemPrompt(): string {
    return `Tu es un assistant d'écriture littéraire expert. Ton rôle est de proposer des reformulations qui ÉLÈVENT la qualité littéraire du texte tout en préservant absolument le sens et la voix de l'auteur.

MÉTHODE D'ANALYSE PRÉLIMINAIRE:
Avant de générer les propositions, analyse silencieusement:
1. Le rythme des phrases (staccato/coulé, longueur moyenne)
2. Le registre sensoriel dominant (visuel, auditif, tactile)
3. Les habitudes de ponctuation (tirets, points-virgules, parenthèses)
4. La perspective narrative (je/il, présent/passé)
5. La densité figurative (métaphores, comparaisons, personnifications)
6. La "température" émotionnelle du passage

PRÉSERVATION DE LA LANGUE (CRITIQUE):
- DÉTECTE la langue du texte source
- Génère TOUTES les propositions dans la MÊME LANGUE que l'entrée
- Si l'entrée est en français, TOUTES les propositions DOIVENT être en français
- Si l'entrée est en anglais, TOUTES les propositions DOIVENT être en anglais
- Ne JAMAIS traduire ou changer de langue
- Ceci est une EXIGENCE ABSOLUE

GÉNÈRE EXACTEMENT 5 PROPOSITIONS DISTINCTES:

1. PROSE ÉPURÉE (styleLabel: "épuré")
   - Chaque mot doit justifier sa présence
   - Supprimer tout ce qui n'ajoute pas de sens
   - Verbes d'action précis, adjectifs rares et frappants
   - Inspiration: Hemingway, Camus, Carver

2. PROSE LYRIQUE (styleLabel: "lyrique")
   - Travail sur la musicalité et le rythme
   - Images sensorielles riches et originales
   - Variations de longueur de phrases pour créer une respiration
   - Inspiration: Woolf, Proust, Duras

3. PROSE NERVEUSE (styleLabel: "nerveux")
   - Phrases courtes et percutantes
   - Tension narrative, énergie cinétique
   - Coupes franches, sans gras
   - Inspiration: Ellroy, Manchette, Simenon

4. PROSE BAROQUE (styleLabel: "baroque")
   - Périodes amples et architecturées
   - Complexité syntaxique maîtrisée
   - Subordonnées enchâssées avec élégance
   - Inspiration: Faulkner, Claude Simon, Proust

5. VOIX AMPLIFIÉE (styleLabel: "amplifié")
   - Intensifier la voix propre détectée dans le contexte
   - Pousser les caractéristiques stylistiques déjà présentes
   - Rester fidèle mais magnifier
   - Le texte que l'auteur aurait écrit avec plus de temps

QUALITÉS D'EXCELLENCE À RECHERCHER:
- Spécificité concrète: "la Renault 4 rouillée" plutôt que "la vieille voiture"
- Images fraîches: éviter les métaphores mortes ("blanc comme neige")
- Verbes incarnés: "il traversa" plutôt que "il alla de l'autre côté"
- Subtext par l'action: montrer les états intérieurs par le corps
- Rythme varié: alterner court/long pour créer une musique

INTERDITS ABSOLUS:
- Ne JAMAIS changer le sens
- Ne JAMAIS ajouter d'information absente de l'original
- Ne JAMAIS remplacer un style authentique par des clichés
- Ne JAMAIS "corriger" un choix stylistique intentionnel de l'auteur

FORMAT DE SORTIE (JSON):
Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.
{
  "proposals": [
    { "content": "...", "styleLabel": "épuré" },
    { "content": "...", "styleLabel": "lyrique" },
    { "content": "...", "styleLabel": "nerveux" },
    { "content": "...", "styleLabel": "baroque" },
    { "content": "...", "styleLabel": "amplifié" }
  ]
}`;
  }

  private buildUserPrompt(text: string, context?: string): string {
    let prompt = `TEXTE À RÉÉCRIRE:\n\n«${text}»`;

    if (context && context !== text) {
      prompt += `\n\n---\n\nCONTEXTE ÉLARGI (analyse ce passage pour comprendre la voix et le style de l'auteur):\n\n«${context}»`;
    }

    prompt += `\n\n---\n\nGénère maintenant 5 propositions littérairement distinctes dans la MÊME LANGUE que le texte source. Retourne uniquement le JSON, sans aucun texte explicatif avant ou après.`;

    return prompt;
  }

  /**
   * Test connection to Anthropic API.
   * Makes a simple minimal API call to validate the API key.
   */
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      // Simple minimal API call to validate key
      await this.client.messages.create({
        model: this.model,
        max_tokens: 1,
        messages: [
          {
            role: 'user',
            content: 'Test',
          },
        ],
      });
      return { valid: true };
    } catch (error) {
      // Parse Anthropic error
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // Anthropic returns specific error messages
        if (errorMessage.includes('invalid api key') || errorMessage.includes('authentication')) {
          return { valid: false, error: 'Invalid API key' };
        }
        if (errorMessage.includes('rate limit')) {
          return { valid: false, error: 'Rate limit exceeded, try again later' };
        }
        if (errorMessage.includes('quota') || errorMessage.includes('insufficient')) {
          return { valid: false, error: 'API quota exceeded' };
        }
        if (errorMessage.includes('model') && errorMessage.includes('not found')) {
          return { valid: false, error: 'Model not available for your account' };
        }
        return { valid: false, error: error.message };
      }
      return { valid: false, error: 'Connection test failed' };
    }
  }

  /**
   * Get provider name.
   */
  getProviderName(): string {
    return 'Anthropic';
  }

  /**
   * Get active model.
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Generate narrative analysis for the given text.
   * Analyzes narrator type, focalization, temporality, chapter structure,
   * and distinctive narrative voice using Claude.
   */
  async generateNarrativeAnalysis(fullText: string): Promise<NarrativeAnalysis> {
    // Load base prompt from repository
    const basePrompt = await this.promptRepository.getNarrativeAnalysisPrompt();

    // Enhance with JSON output instructions for Anthropic
    const systemPrompt = this.enhancePromptForAnthropic(basePrompt);

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.3, // Lower for more consistent analysis
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: fullText,
          },
        ],
      });

      // Extract text content from response
      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      return this.parseNarrativeAnalysisResponse(content.text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during narrative analysis');
    }
  }

  /**
   * Enhance the base narrative analysis prompt with JSON output instructions.
   * The base prompt provides the analysis guidelines, this adds the JSON structure.
   */
  private enhancePromptForAnthropic(basePrompt: string): string {
    return `${basePrompt}

---

IMPORTANT - FORMAT DE SORTIE JSON:

Produis une analyse structurée en JSON avec les clés suivantes:

{
  "narratorType": "Description du type de narrateur et de sa fiabilité (2-3 phrases)",
  "focalization": "Description de la focalisation et de l'accès aux pensées (2-3 phrases)",
  "temporality": "Description de la gestion du temps, analepses, prolepses (2-3 phrases)",
  "chapterStructure": "Description de la structure des chapitres, patterns d'ouverture/clôture (2-3 phrases)",
  "narrativeVoice": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "summary": "Synthèse de l'analyse en 2-3 phrases"
}

INSTRUCTIONS FINALES:
- Détecte la langue du texte et réponds dans la MÊME LANGUE
- Sois précis et concis
- Base ton analyse uniquement sur ce qui est présent dans le texte
- narrativeVoice doit contenir EXACTEMENT 5 points distincts
- Retourne UNIQUEMENT le JSON, sans commentaires ni code blocks markdown`;
  }

  /**
   * Parse Anthropic's narrative analysis response.
   */
  private parseNarrativeAnalysisResponse(content: string): NarrativeAnalysis {
    let parsed: NarrativeAnalysisResponse;

    try {
      // Claude sometimes wraps JSON in markdown code blocks
      let jsonContent = content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse narrative analysis response from Anthropic');
    }

    // Validate required fields
    if (!parsed.narratorType || typeof parsed.narratorType !== 'string') {
      throw new Error('Invalid response: missing narratorType');
    }
    if (!parsed.focalization || typeof parsed.focalization !== 'string') {
      throw new Error('Invalid response: missing focalization');
    }
    if (!parsed.temporality || typeof parsed.temporality !== 'string') {
      throw new Error('Invalid response: missing temporality');
    }
    if (!parsed.chapterStructure || typeof parsed.chapterStructure !== 'string') {
      throw new Error('Invalid response: missing chapterStructure');
    }
    if (!Array.isArray(parsed.narrativeVoice) || parsed.narrativeVoice.length === 0) {
      throw new Error('Invalid response: narrativeVoice must be a non-empty array');
    }
    if (!parsed.summary || typeof parsed.summary !== 'string') {
      throw new Error('Invalid response: missing summary');
    }

    return {
      narratorType: parsed.narratorType,
      focalization: parsed.focalization,
      temporality: parsed.temporality,
      chapterStructure: parsed.chapterStructure,
      narrativeVoice: parsed.narrativeVoice,
      summary: parsed.summary,
    };
  }

  private parseResponse(content: string): RewriteProposal[] {
    let parsed: ProposalResponse;

    try {
      // Claude sometimes wraps JSON in markdown code blocks, so we need to handle that
      let jsonContent = content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse Anthropic response');
    }

    if (!parsed.proposals || !Array.isArray(parsed.proposals)) {
      throw new Error('Invalid response structure from Anthropic');
    }

    if (parsed.proposals.length !== 5) {
      throw new Error(
        `Expected exactly 5 proposals, got ${parsed.proposals.length}`
      );
    }

    return parsed.proposals.map(
      (p) => new RewriteProposal(p.content, p.styleLabel)
    );
  }
}
