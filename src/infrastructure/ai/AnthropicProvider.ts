// ABOUTME: Concrete implementation of LLMProvider using Anthropic Claude API for text rewriting
// ABOUTME: Generates 3 stylistically distinct proposals using carefully crafted prompt

import Anthropic from '@anthropic-ai/sdk';
import { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages/messages';
import { LLMProvider, ConnectionTestResult, TokenUsage, ExchangeContent } from '@/domain/interfaces/LLMProvider';
import { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { AUTOCOMPLETE_POLICY } from '@/domain/value-objects/AIOperationPolicy';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';
import { NarrativeAnalysis } from '@/domain/value-objects/NarrativeAnalysis';
import { StylisticDNA } from '@/domain/value-objects/StylisticDNA';
import { Characters, CharacterProfile } from '@/domain/value-objects/Characters';
import { Plot } from '@/domain/value-objects/Plot';
import { Worldbuilding } from '@/domain/value-objects/Worldbuilding';
import { Synthesis } from '@/domain/value-objects/Synthesis';
import { ChapterSummaries } from '@/domain/value-objects/ChapterSummaries';
import { CanonFacts } from '@/domain/value-objects/CanonFacts';
import {
  buildCanonFactsUserMessage,
  parseCanonFactsJson,
} from './canon-facts-parsing';
import { ChapterGeneration } from '@/domain/value-objects/ChapterGeneration';
import { ChapterGenerationTypeKey } from '@/domain/value-objects/ChapterGenerationType';
import { ChatMessage } from '@/domain/value-objects/ChatMessage';
import { WordAlternative, createWordAlternative } from '@/domain/value-objects/WordAlternative';

interface ProposalResponse {
  proposals: Array<{
    content: string;
    styleLabel?: string;
  }>;
}

interface ThinkingApiParams {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  thinking?: { type: 'enabled'; budget_tokens: number };
}

interface BuildApiParamsInput {
  system: string;
  messages: Array<{ role: string; content: string }>;
  baseMaxTokens: number;
  temperature?: number;
  thinkingBudget: number;
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
  private lastTokenUsage: TokenUsage | null = null;
  private lastExchange: ExchangeContent | null = null;

  constructor(
    apiKey: string,
    promptRepository: PromptRepository,
    model: string = 'claude-sonnet-4-5-20250929'
  ) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.promptRepository = promptRepository;
  }

  getLastTokenUsage(): TokenUsage | null {
    return this.lastTokenUsage;
  }

  getLastExchange(): ExchangeContent | null {
    return this.lastExchange;
  }

  /**
   * Send a non-streaming message and capture the reported token usage and the
   * exchange content (system prompt, input, raw output) so they can be
   * retrieved by usage-tracking and transparency decorators. Every operation
   * routed through this method is captured uniformly.
   */
  private async createMessage(params: MessageCreateParamsNonStreaming) {
    const message = await this.client.messages.create(params);
    this.lastTokenUsage = {
      inputTokens: message.usage?.input_tokens ?? null,
      outputTokens: message.usage?.output_tokens ?? null,
      cachedInputTokens: message.usage?.cache_read_input_tokens ?? null,
    };
    this.lastExchange = {
      systemPrompt: typeof params.system === 'string' ? params.system : '',
      input: this.stringifyRequestMessages(params.messages),
      output: this.collectTextContent(message.content),
    };
    return message;
  }

  /**
   * Flatten request messages into the human-readable text actually sent
   * (selected text + transmitted context), for the transparency ledger.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stringifyRequestMessages(messages: any[]): string {
    if (!Array.isArray(messages)) {
      return '';
    }
    return messages
      .map((m) => (typeof m.content === 'string' ? m.content : ''))
      .filter((content) => content.length > 0)
      .join('\n\n');
  }

  /**
   * Concatenate all text blocks of a response, skipping thinking blocks.
   * Unlike extractTextContent it never throws, so capture stays best-effort.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private collectTextContent(content: any[]): string {
    if (!Array.isArray(content)) {
      return '';
    }
    return content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
  }

  /**
   * Extract JSON from Claude's response, handling markdown code blocks and extra text.
   * Claude often wraps JSON in ```json...``` blocks or adds explanatory text.
   */
  private extractJson(content: string): string {
    let text = content.trim();

    // Try to extract from markdown code block (handles multiline with 's' flag equivalent)
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      text = codeBlockMatch[1].trim();
    }

    // If no code block, try to find JSON object directly
    if (!text.startsWith('{')) {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        text = text.slice(jsonStart, jsonEnd + 1);
      }
    }

    return text;
  }

  async generateRewrites(
    text: string,
    context?: string,
    authorProfile?: string
  ): Promise<RewriteProposal[]> {
    const systemPrompt = this.buildSystemPrompt(authorProfile);
    const userPrompt = this.buildUserPrompt(text, context);

    try {
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        baseMaxTokens: 4096,
        temperature: 0.85,
        thinkingBudget: 4096,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return this.parseResponse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during text generation', { cause: error });
    }
  }

  private buildSystemPrompt(authorProfile?: string): string {
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

GÉNÈRE EXACTEMENT 3 PROPOSITIONS DISTINCTES ET ORTHOGONALES:

1. PROSE ÉPURÉE (styleLabel: "épuré")
   - Compression maximale, chaque mot justifie sa présence
   - Supprimer tout ce qui n'ajoute pas de sens
   - Verbes d'action précis, sobriété
   - Inspiration: Hemingway, Camus, Carver

2. PROSE LYRIQUE (styleLabel: "lyrique")
   - Musicalité et images sensorielles
   - Rythme varié, respiration du texte
   - Métaphores originales, densité poétique
   - Inspiration: Woolf, Duras, García Márquez

3. VOIX AMPLIFIÉE (styleLabel: "amplifié")
   - Intensifier la voix propre de l'auteur détectée dans le contexte
   - Pousser les caractéristiques stylistiques déjà présentes
   - Le texte que l'auteur aurait écrit avec plus de temps
   - Transformation structurelle si pertinent

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
- Ne JAMAIS "corriger" un choix stylistique intentionnel de l'auteur${authorProfile ? '\n\n' + authorProfile : ''}

FORMAT DE SORTIE (JSON):
Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.
{
  "proposals": [
    { "content": "...", "styleLabel": "épuré" },
    { "content": "...", "styleLabel": "lyrique" },
    { "content": "...", "styleLabel": "amplifié" }
  ]
}`;
  }

  private buildUserPrompt(text: string, context?: string): string {
    let prompt = `TEXTE À RÉÉCRIRE:\n\n«${text}»`;

    if (context && context !== text) {
      prompt += `\n\n---\n\nCONTEXTE ÉLARGI (analyse ce passage pour comprendre la voix et le style de l'auteur):\n\n«${context}»`;
    }

    prompt += `\n\n---\n\nGénère maintenant 3 propositions littérairement distinctes dans la MÊME LANGUE que le texte source. Retourne uniquement le JSON, sans aucun texte explicatif avant ou après.`;

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
   * Detect whether the current model supports extended thinking.
   * Claude 4.5+ and 4.6 models support the thinking parameter.
   */
  private supportsThinking(): boolean {
    const thinkingModels = [
      'claude-opus-4-6',
      'claude-opus-4-5',
      'claude-sonnet-4-5',
      'claude-haiku-4-5',
    ];
    return thinkingModels.some((prefix) => this.model.startsWith(prefix));
  }

  /**
   * Extract the first text block from a response content array,
   * skipping thinking and redacted_thinking blocks.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractTextContent(content: any[]): string {
    const textBlock = content.find(
      (block) => block.type === 'text'
    );
    if (!textBlock) {
      throw new Error('No text content in Anthropic response');
    }
    return textBlock.text;
  }

  /**
   * Build API call parameters, conditionally adding thinking configuration.
   * When thinking is enabled, temperature must not be set (defaults to 1.0).
   */
  private buildApiParams(input: BuildApiParamsInput): ThinkingApiParams {
    const { system, messages, baseMaxTokens, temperature, thinkingBudget } = input;
    const useThinking = this.supportsThinking() && thinkingBudget > 0;

    if (useThinking) {
      return {
        model: this.model,
        max_tokens: baseMaxTokens + thinkingBudget,
        system,
        messages,
        thinking: { type: 'enabled', budget_tokens: thinkingBudget },
      };
    }

    const params: ThinkingApiParams = {
      model: this.model,
      max_tokens: baseMaxTokens,
      system,
      messages,
    };
    if (temperature !== undefined) {
      params.temperature = temperature;
    }
    return params;
  }

  /**
   * Check if the response indicates a refusal and throw a descriptive error.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkRefusal(message: any): void {
    if (message.stop_reason === 'refusal') {
      throw new Error(
        'Claude refused to process this content. Please check the submitted text.'
      );
    }
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
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: fullText }],
        baseMaxTokens: 4096,
        temperature: 0.3,
        thinkingBudget: 8192,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return this.parseNarrativeAnalysisResponse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during narrative analysis', { cause: error });
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
      const jsonContent = this.extractJson(content);
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
      const jsonContent = this.extractJson(content);
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse Anthropic response');
    }

    if (!parsed.proposals || !Array.isArray(parsed.proposals)) {
      throw new Error('Invalid response structure from Anthropic');
    }

    if (parsed.proposals.length !== 3) {
      throw new Error(
        `Expected exactly 3 proposals, got ${parsed.proposals.length}`
      );
    }

    return parsed.proposals.map(
      (p) => new RewriteProposal(p.content, p.styleLabel)
    );
  }

  // ===========================
  // STYLISTIC DNA ANALYSIS
  // ===========================

  async generateStylisticDNA(fullText: string): Promise<StylisticDNA> {
    const basePrompt = await this.promptRepository.getStylisticDNAPrompt();
    const systemPrompt = this.enhanceStylisticDNAPromptForAnthropic(basePrompt);

    try {
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: fullText }],
        baseMaxTokens: 4096,
        temperature: 0.3,
        thinkingBudget: 8192,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return this.parseStylisticDNAResponse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during stylistic DNA analysis', { cause: error });
    }
  }

  private enhanceStylisticDNAPromptForAnthropic(basePrompt: string): string {
    return `${basePrompt}

---

FORMAT DE SORTIE JSON:

Retourne UNIQUEMENT un JSON structuré avec les clés suivantes:

{
  "registerAndLexicon": "Analyse du registre et lexique (2-4 phrases)",
  "syntax": "Analyse de la syntaxe (2-4 phrases)",
  "figuresOfStyle": "Analyse des figures de style (2-4 phrases)",
  "ticsAndSignatures": "Tics et signatures stylistiques (2-4 phrases)",
  "rhythmAndBreathing": "Rythme et respiration du texte (2-4 phrases)",
  "writingRules": ["FAIRE: règle 1", "ÉVITER: anti-règle 1", "FAIRE: règle 2", ...],
  "summary": "Synthèse de l'ADN stylistique (2-3 phrases)"
}

INSTRUCTIONS:
- Détecte la langue du texte et réponds dans la MÊME LANGUE
- writingRules: tableau de règles DO/DON'T (10 maximum)
- Retourne UNIQUEMENT le JSON, sans markdown code blocks`;
  }

  private parseStylisticDNAResponse(content: string): StylisticDNA {
    const jsonContent = this.extractJson(content);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse stylistic DNA response from Anthropic');
    }

    if (!parsed.registerAndLexicon || typeof parsed.registerAndLexicon !== 'string') {
      throw new Error('Invalid response: missing registerAndLexicon');
    }
    if (!parsed.syntax || typeof parsed.syntax !== 'string') {
      throw new Error('Invalid response: missing syntax');
    }
    if (!parsed.figuresOfStyle || typeof parsed.figuresOfStyle !== 'string') {
      throw new Error('Invalid response: missing figuresOfStyle');
    }
    if (!parsed.ticsAndSignatures || typeof parsed.ticsAndSignatures !== 'string') {
      throw new Error('Invalid response: missing ticsAndSignatures');
    }
    if (!parsed.rhythmAndBreathing || typeof parsed.rhythmAndBreathing !== 'string') {
      throw new Error('Invalid response: missing rhythmAndBreathing');
    }
    if (!Array.isArray(parsed.writingRules) || parsed.writingRules.length === 0) {
      throw new Error('Invalid response: writingRules must be a non-empty array');
    }
    if (!parsed.summary || typeof parsed.summary !== 'string') {
      throw new Error('Invalid response: missing summary');
    }

    return {
      registerAndLexicon: parsed.registerAndLexicon,
      syntax: parsed.syntax,
      figuresOfStyle: parsed.figuresOfStyle,
      ticsAndSignatures: parsed.ticsAndSignatures,
      rhythmAndBreathing: parsed.rhythmAndBreathing,
      writingRules: parsed.writingRules,
      summary: parsed.summary,
    };
  }

  // ===========================
  // CHARACTERS ANALYSIS
  // ===========================

  async generateCharacters(fullText: string): Promise<Characters> {
    const basePrompt = await this.promptRepository.getCharactersPrompt();
    const systemPrompt = this.enhanceCharactersPromptForAnthropic(basePrompt);

    try {
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: fullText }],
        baseMaxTokens: 8192,
        temperature: 0.3,
        thinkingBudget: 8192,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return this.parseCharactersResponse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during characters analysis', { cause: error });
    }
  }

  private enhanceCharactersPromptForAnthropic(basePrompt: string): string {
    return `${basePrompt}

---

FORMAT DE SORTIE JSON:

Retourne UNIQUEMENT un JSON structuré avec les clés suivantes:

{
  "characterProfiles": [
    {
      "name": "Nom du personnage",
      "identity": "Identité (âge, statut, rôle)",
      "appearance": "Description physique",
      "psychology": "Psychologie et traits",
      "voiceAndLanguage": "Voix et langage",
      "backstory": "Histoire personnelle",
      "relationships": "Relations avec autres personnages",
      "narrativeFunction": "Fonction narrative",
      "openQuestions": "Questions ouvertes"
    }
  ],
  "relationalMap": "Cartographie des relations (description textuelle)",
  "narrativeHierarchy": "Hiérarchie narrative (ordre d'importance)",
  "summary": "Synthèse de l'analyse des personnages (2-3 phrases)"
}

INSTRUCTIONS:
- Détecte la langue du texte et réponds dans la MÊME LANGUE
- characterProfiles: tableau avec tous les personnages identifiés
- Retourne UNIQUEMENT le JSON, sans markdown code blocks`;
  }

  private parseCharactersResponse(content: string): Characters {
    const jsonContent = this.extractJson(content);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse characters response from Anthropic');
    }

    if (!Array.isArray(parsed.characterProfiles) || parsed.characterProfiles.length === 0) {
      throw new Error('Invalid response: characterProfiles must be a non-empty array');
    }

    // Validate each character profile
    for (const profile of parsed.characterProfiles) {
      if (!profile.name || typeof profile.name !== 'string') {
        throw new Error('Invalid character profile: missing name');
      }
      if (!profile.identity || typeof profile.identity !== 'string') {
        throw new Error('Invalid character profile: missing identity');
      }
      if (!profile.appearance || typeof profile.appearance !== 'string') {
        throw new Error('Invalid character profile: missing appearance');
      }
      if (!profile.psychology || typeof profile.psychology !== 'string') {
        throw new Error('Invalid character profile: missing psychology');
      }
      if (!profile.voiceAndLanguage || typeof profile.voiceAndLanguage !== 'string') {
        throw new Error('Invalid character profile: missing voiceAndLanguage');
      }
      if (!profile.backstory || typeof profile.backstory !== 'string') {
        throw new Error('Invalid character profile: missing backstory');
      }
      if (!profile.relationships || typeof profile.relationships !== 'string') {
        throw new Error('Invalid character profile: missing relationships');
      }
      if (!profile.narrativeFunction || typeof profile.narrativeFunction !== 'string') {
        throw new Error('Invalid character profile: missing narrativeFunction');
      }
      if (!profile.openQuestions || typeof profile.openQuestions !== 'string') {
        throw new Error('Invalid character profile: missing openQuestions');
      }
    }

    if (!parsed.relationalMap || typeof parsed.relationalMap !== 'string') {
      throw new Error('Invalid response: missing relationalMap');
    }
    if (!parsed.narrativeHierarchy || typeof parsed.narrativeHierarchy !== 'string') {
      throw new Error('Invalid response: missing narrativeHierarchy');
    }
    if (!parsed.summary || typeof parsed.summary !== 'string') {
      throw new Error('Invalid response: missing summary');
    }

    return {
      characterProfiles: parsed.characterProfiles,
      relationalMap: parsed.relationalMap,
      narrativeHierarchy: parsed.narrativeHierarchy,
      summary: parsed.summary,
    };
  }

  // ===========================
  // PLOT ANALYSIS
  // ===========================

  async generatePlot(fullText: string): Promise<Plot> {
    const basePrompt = await this.promptRepository.getPlotPrompt();
    const systemPrompt = this.enhancePlotPromptForAnthropic(basePrompt);

    try {
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: fullText }],
        baseMaxTokens: 8192,
        temperature: 0.3,
        thinkingBudget: 8192,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return this.parsePlotResponse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during plot analysis', { cause: error });
    }
  }

  private enhancePlotPromptForAnthropic(basePrompt: string): string {
    return `${basePrompt}

---

FORMAT DE SORTIE JSON:

Retourne UNIQUEMENT un JSON structuré avec les clés suivantes:

{
  "initialSituation": "Situation initiale",
  "incitingIncident": "Élément déclencheur",
  "stakes": "Enjeux",
  "dramaticQuestions": "Questions dramatiques",
  "conflicts": "Conflits identifiés",
  "narrativeThreads": "Fils narratifs (intrigue A, B, C)",
  "detectedStructure": "Structure détectée",
  "sceneBreakdown": [
    {
      "chapter": "Chapitre X",
      "location": "Lieu",
      "characters": "Personnages présents",
      "objective": "Objectif de la scène",
      "conflict": "Conflit",
      "outcome": "Issue",
      "function": "Fonction narrative"
    }
  ],
  "plotState": "État actuel de l'intrigue",
  "possibleDirections": "Directions possibles pour la suite",
  "summary": "Synthèse de l'analyse de l'intrigue (2-3 phrases)"
}

INSTRUCTIONS:
- Détecte la langue du texte et réponds dans la MÊME LANGUE
- sceneBreakdown: tableau avec toutes les scènes identifiées
- Retourne UNIQUEMENT le JSON, sans markdown code blocks`;
  }

  private parsePlotResponse(content: string): Plot {
    const jsonContent = this.extractJson(content);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse plot response from Anthropic');
    }

    if (!parsed.initialSituation || typeof parsed.initialSituation !== 'string') {
      throw new Error('Invalid response: missing initialSituation');
    }
    if (!parsed.incitingIncident || typeof parsed.incitingIncident !== 'string') {
      throw new Error('Invalid response: missing incitingIncident');
    }
    if (!parsed.stakes || typeof parsed.stakes !== 'string') {
      throw new Error('Invalid response: missing stakes');
    }
    if (!parsed.dramaticQuestions || typeof parsed.dramaticQuestions !== 'string') {
      throw new Error('Invalid response: missing dramaticQuestions');
    }
    if (!parsed.conflicts || typeof parsed.conflicts !== 'string') {
      throw new Error('Invalid response: missing conflicts');
    }
    if (!parsed.narrativeThreads || typeof parsed.narrativeThreads !== 'string') {
      throw new Error('Invalid response: missing narrativeThreads');
    }
    if (!parsed.detectedStructure || typeof parsed.detectedStructure !== 'string') {
      throw new Error('Invalid response: missing detectedStructure');
    }
    if (!Array.isArray(parsed.sceneBreakdown)) {
      throw new Error('Invalid response: sceneBreakdown must be an array');
    }

    // Validate scene breakdown entries
    for (const scene of parsed.sceneBreakdown) {
      if (!scene.chapter || typeof scene.chapter !== 'string') {
        throw new Error('Invalid scene: missing chapter');
      }
      if (!scene.location || typeof scene.location !== 'string') {
        throw new Error('Invalid scene: missing location');
      }
      if (!scene.characters || typeof scene.characters !== 'string') {
        throw new Error('Invalid scene: missing characters');
      }
      if (!scene.objective || typeof scene.objective !== 'string') {
        throw new Error('Invalid scene: missing objective');
      }
      if (!scene.conflict || typeof scene.conflict !== 'string') {
        throw new Error('Invalid scene: missing conflict');
      }
      if (!scene.outcome || typeof scene.outcome !== 'string') {
        throw new Error('Invalid scene: missing outcome');
      }
      if (!scene.function || typeof scene.function !== 'string') {
        throw new Error('Invalid scene: missing function');
      }
    }

    if (!parsed.plotState || typeof parsed.plotState !== 'string') {
      throw new Error('Invalid response: missing plotState');
    }
    if (!parsed.possibleDirections || typeof parsed.possibleDirections !== 'string') {
      throw new Error('Invalid response: missing possibleDirections');
    }
    if (!parsed.summary || typeof parsed.summary !== 'string') {
      throw new Error('Invalid response: missing summary');
    }

    return {
      initialSituation: parsed.initialSituation,
      incitingIncident: parsed.incitingIncident,
      stakes: parsed.stakes,
      dramaticQuestions: parsed.dramaticQuestions,
      conflicts: parsed.conflicts,
      narrativeThreads: parsed.narrativeThreads,
      detectedStructure: parsed.detectedStructure,
      sceneBreakdown: parsed.sceneBreakdown,
      plotState: parsed.plotState,
      possibleDirections: parsed.possibleDirections,
      summary: parsed.summary,
    };
  }

  // ===========================
  // WORLDBUILDING ANALYSIS
  // ===========================

  async generateWorldbuilding(fullText: string): Promise<Worldbuilding> {
    const basePrompt = await this.promptRepository.getWorldbuildingPrompt();
    const systemPrompt = this.enhanceWorldbuildingPromptForAnthropic(basePrompt);

    try {
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: fullText }],
        baseMaxTokens: 6144,
        temperature: 0.3,
        thinkingBudget: 8192,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return this.parseWorldbuildingResponse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during worldbuilding analysis', { cause: error });
    }
  }

  private enhanceWorldbuildingPromptForAnthropic(basePrompt: string): string {
    return `${basePrompt}

---

FORMAT DE SORTIE JSON:

Retourne UNIQUEMENT un JSON structuré avec les clés suivantes:

{
  "explicitThemes": "Thèmes explicites",
  "implicitThemes": "Thèmes implicites",
  "symbolism": "Symbolique",
  "subtext": "Sous-texte",
  "worldview": "Vision du monde et valeurs",
  "intertextuality": "Intertextualité",
  "spatiotemporalSetting": "Cadre spatio-temporel",
  "atmosphere": "Atmosphère et palette sensorielle",
  "worldRules": "Règles du monde (fantastique/SF)",
  "socialContext": "Contexte social",
  "immersionDetails": "Détails d'immersion",
  "coherence": "Cohérence du worldbuilding",
  "summary": "Synthèse de l'analyse de l'univers (2-3 phrases)"
}

INSTRUCTIONS:
- Détecte la langue du texte et réponds dans la MÊME LANGUE
- Retourne UNIQUEMENT le JSON, sans markdown code blocks`;
  }

  private parseWorldbuildingResponse(content: string): Worldbuilding {
    const jsonContent = this.extractJson(content);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse worldbuilding response from Anthropic');
    }

    if (!parsed.explicitThemes || typeof parsed.explicitThemes !== 'string') {
      throw new Error('Invalid response: missing explicitThemes');
    }
    if (!parsed.implicitThemes || typeof parsed.implicitThemes !== 'string') {
      throw new Error('Invalid response: missing implicitThemes');
    }
    if (!parsed.symbolism || typeof parsed.symbolism !== 'string') {
      throw new Error('Invalid response: missing symbolism');
    }
    if (!parsed.subtext || typeof parsed.subtext !== 'string') {
      throw new Error('Invalid response: missing subtext');
    }
    if (!parsed.worldview || typeof parsed.worldview !== 'string') {
      throw new Error('Invalid response: missing worldview');
    }
    if (!parsed.intertextuality || typeof parsed.intertextuality !== 'string') {
      throw new Error('Invalid response: missing intertextuality');
    }
    if (!parsed.spatiotemporalSetting || typeof parsed.spatiotemporalSetting !== 'string') {
      throw new Error('Invalid response: missing spatiotemporalSetting');
    }
    if (!parsed.atmosphere || typeof parsed.atmosphere !== 'string') {
      throw new Error('Invalid response: missing atmosphere');
    }
    if (!parsed.worldRules || typeof parsed.worldRules !== 'string') {
      throw new Error('Invalid response: missing worldRules');
    }
    if (!parsed.socialContext || typeof parsed.socialContext !== 'string') {
      throw new Error('Invalid response: missing socialContext');
    }
    if (!parsed.immersionDetails || typeof parsed.immersionDetails !== 'string') {
      throw new Error('Invalid response: missing immersionDetails');
    }
    if (!parsed.coherence || typeof parsed.coherence !== 'string') {
      throw new Error('Invalid response: missing coherence');
    }
    if (!parsed.summary || typeof parsed.summary !== 'string') {
      throw new Error('Invalid response: missing summary');
    }

    return {
      explicitThemes: parsed.explicitThemes,
      implicitThemes: parsed.implicitThemes,
      symbolism: parsed.symbolism,
      subtext: parsed.subtext,
      worldview: parsed.worldview,
      intertextuality: parsed.intertextuality,
      spatiotemporalSetting: parsed.spatiotemporalSetting,
      atmosphere: parsed.atmosphere,
      worldRules: parsed.worldRules,
      socialContext: parsed.socialContext,
      immersionDetails: parsed.immersionDetails,
      coherence: parsed.coherence,
      summary: parsed.summary,
    };
  }

  // ===========================
  // SYNTHESIS ANALYSIS
  // ===========================

  async generateSynthesis(
    fullText: string,
    previousAnalyses: {
      narrative?: NarrativeAnalysis;
      stylisticDNA?: StylisticDNA;
      characters?: Characters;
      plot?: Plot;
      worldbuilding?: Worldbuilding;
    }
  ): Promise<Synthesis> {
    const basePrompt = await this.promptRepository.getSynthesisPrompt();
    const systemPrompt = this.enhanceSynthesisPromptForAnthropic(basePrompt);

    // Build context from previous analyses
    let contextInfo = '';
    if (previousAnalyses.narrative) {
      contextInfo += '\n\n--- ANALYSE NARRATIVE ---\n' + JSON.stringify(previousAnalyses.narrative, null, 2);
    }
    if (previousAnalyses.stylisticDNA) {
      contextInfo += '\n\n--- ADN STYLISTIQUE ---\n' + JSON.stringify(previousAnalyses.stylisticDNA, null, 2);
    }
    if (previousAnalyses.characters) {
      contextInfo += '\n\n--- PERSONNAGES ---\n' + JSON.stringify(previousAnalyses.characters, null, 2);
    }
    if (previousAnalyses.plot) {
      contextInfo += '\n\n--- INTRIGUE ---\n' + JSON.stringify(previousAnalyses.plot, null, 2);
    }
    if (previousAnalyses.worldbuilding) {
      contextInfo += '\n\n--- UNIVERS ---\n' + JSON.stringify(previousAnalyses.worldbuilding, null, 2);
    }

    const userPrompt = `TEXTE:\n\n${fullText}${contextInfo}`;

    try {
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        baseMaxTokens: 8192,
        temperature: 0.3,
        thinkingBudget: 10240,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return this.parseSynthesisResponse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during synthesis analysis', { cause: error });
    }
  }

  private enhanceSynthesisPromptForAnthropic(basePrompt: string): string {
    return `${basePrompt}

---

FORMAT DE SORTIE JSON:

Retourne UNIQUEMENT un JSON structuré avec les clés suivantes:

{
  "textIdentity": "Identité du texte (5 lignes max)",
  "strengths": ["Point fort 1", "Point fort 2", "Point fort 3", "Point fort 4", "Point fort 5"],
  "improvements": ["Axe 1", "Axe 2", "Axe 3", "Axe 4", "Axe 5"],
  "internalCoherence": "Analyse de la cohérence interne",
  "stylisticCharter": ["FAIRE: règle 1", "ÉVITER: anti-règle 1", ...],
  "plotSummary": "Résumé de l'intrigue",
  "openQuestions": ["Question 1", "Question 2", ...],
  "characterSummaries": [
    {
      "name": "Nom",
      "role": "Rôle",
      "motivation": "Motivation",
      "flaw": "Faille",
      "lastSituation": "Dernière situation"
    }
  ],
  "readerPromises": ["Promesse 1", "Promesse 2", ...],
  "narrativeDirections": [
    {
      "direction": "Direction narrative",
      "advantages": "Avantages",
      "risks": "Risques"
    }
  ],
  "suggestedScenes": ["Scène 1", "Scène 2", ...],
  "charactersToDevelop": "Personnages à développer",
  "alerts": ["Alerte 1", "Alerte 2", ...]
}

INSTRUCTIONS:
- Détecte la langue du texte et réponds dans la MÊME LANGUE
- Utilise les analyses précédentes fournies en contexte
- Retourne UNIQUEMENT le JSON, sans markdown code blocks`;
  }

  private parseSynthesisResponse(content: string): Synthesis {
    const jsonContent = this.extractJson(content);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse synthesis response from Anthropic');
    }

    if (!parsed.textIdentity || typeof parsed.textIdentity !== 'string') {
      throw new Error('Invalid response: missing textIdentity');
    }
    if (!Array.isArray(parsed.strengths) || parsed.strengths.length === 0) {
      throw new Error('Invalid response: strengths must be a non-empty array');
    }
    if (!Array.isArray(parsed.improvements) || parsed.improvements.length === 0) {
      throw new Error('Invalid response: improvements must be a non-empty array');
    }
    if (!parsed.internalCoherence || typeof parsed.internalCoherence !== 'string') {
      throw new Error('Invalid response: missing internalCoherence');
    }
    if (!Array.isArray(parsed.stylisticCharter) || parsed.stylisticCharter.length === 0) {
      throw new Error('Invalid response: stylisticCharter must be a non-empty array');
    }
    if (!parsed.plotSummary || typeof parsed.plotSummary !== 'string') {
      throw new Error('Invalid response: missing plotSummary');
    }
    if (!Array.isArray(parsed.openQuestions)) {
      throw new Error('Invalid response: openQuestions must be an array');
    }
    if (!Array.isArray(parsed.characterSummaries)) {
      throw new Error('Invalid response: characterSummaries must be an array');
    }

    // Validate character summaries
    for (const char of parsed.characterSummaries) {
      if (!char.name || typeof char.name !== 'string') {
        throw new Error('Invalid character summary: missing name');
      }
      if (!char.role || typeof char.role !== 'string') {
        throw new Error('Invalid character summary: missing role');
      }
      if (!char.motivation || typeof char.motivation !== 'string') {
        throw new Error('Invalid character summary: missing motivation');
      }
      if (!char.flaw || typeof char.flaw !== 'string') {
        throw new Error('Invalid character summary: missing flaw');
      }
      if (!char.lastSituation || typeof char.lastSituation !== 'string') {
        throw new Error('Invalid character summary: missing lastSituation');
      }
    }

    if (!Array.isArray(parsed.readerPromises)) {
      throw new Error('Invalid response: readerPromises must be an array');
    }
    if (!Array.isArray(parsed.narrativeDirections)) {
      throw new Error('Invalid response: narrativeDirections must be an array');
    }

    // Validate narrative directions
    for (const dir of parsed.narrativeDirections) {
      if (!dir.direction || typeof dir.direction !== 'string') {
        throw new Error('Invalid narrative direction: missing direction');
      }
      if (!dir.advantages || typeof dir.advantages !== 'string') {
        throw new Error('Invalid narrative direction: missing advantages');
      }
      if (!dir.risks || typeof dir.risks !== 'string') {
        throw new Error('Invalid narrative direction: missing risks');
      }
    }

    if (!Array.isArray(parsed.suggestedScenes)) {
      throw new Error('Invalid response: suggestedScenes must be an array');
    }
    if (!parsed.charactersToDevelop || typeof parsed.charactersToDevelop !== 'string') {
      throw new Error('Invalid response: missing charactersToDevelop');
    }
    if (!Array.isArray(parsed.alerts)) {
      throw new Error('Invalid response: alerts must be an array');
    }

    return {
      textIdentity: parsed.textIdentity,
      strengths: parsed.strengths,
      improvements: parsed.improvements,
      internalCoherence: parsed.internalCoherence,
      stylisticCharter: parsed.stylisticCharter,
      plotSummary: parsed.plotSummary,
      openQuestions: parsed.openQuestions,
      characterSummaries: parsed.characterSummaries,
      readerPromises: parsed.readerPromises,
      narrativeDirections: parsed.narrativeDirections,
      suggestedScenes: parsed.suggestedScenes,
      charactersToDevelop: parsed.charactersToDevelop,
      alerts: parsed.alerts,
    };
  }

  // ===========================
  // CHAPTER SUMMARIES
  // ===========================

  async generateChapterSummaries(fullText: string): Promise<ChapterSummaries> {
    const basePrompt = await this.promptRepository.getChapterSummariesPrompt();
    const systemPrompt = this.enhanceChapterSummariesPromptForAnthropic(basePrompt);

    try {
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: fullText }],
        baseMaxTokens: 4096,
        temperature: 0.3,
        thinkingBudget: 4096,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return this.parseChapterSummariesResponse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during chapter summaries generation', { cause: error });
    }
  }

  private enhanceChapterSummariesPromptForAnthropic(basePrompt: string): string {
    return `${basePrompt}

---

INSTRUCTIONS SUPPLÉMENTAIRES:
- Détecte la langue du texte et réponds dans la MÊME LANGUE
- Chaque résumé de chapitre doit faire MAXIMUM 6 phrases
- Retourne UNIQUEMENT le JSON valide, sans markdown code blocks`;
  }

  private parseChapterSummariesResponse(content: string): ChapterSummaries {
    const jsonContent = this.extractJson(content);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse chapter summaries response from Anthropic');
    }

    if (!Array.isArray(parsed.chapters) || parsed.chapters.length === 0) {
      throw new Error('Invalid response: chapters must be a non-empty array');
    }

    // Validate each chapter summary
    for (const chapter of parsed.chapters) {
      if (typeof chapter.chapterNumber !== 'number') {
        throw new Error('Invalid chapter: chapterNumber must be a number');
      }
      if (!chapter.chapterTitle || typeof chapter.chapterTitle !== 'string') {
        throw new Error('Invalid chapter: missing chapterTitle');
      }
      if (!chapter.summary || typeof chapter.summary !== 'string') {
        throw new Error('Invalid chapter: missing summary');
      }
    }

    if (!parsed.overallArc || typeof parsed.overallArc !== 'string') {
      throw new Error('Invalid response: missing overallArc');
    }

    return {
      chapters: parsed.chapters,
      overallArc: parsed.overallArc,
    };
  }

  async generateCanonFacts(
    fullText: string,
    characterNames: string[]
  ): Promise<CanonFacts> {
    const basePrompt = await this.promptRepository.getCanonFactsPrompt();

    try {
      const params = this.buildApiParams({
        system: basePrompt,
        messages: [
          { role: 'user', content: buildCanonFactsUserMessage(fullText, characterNames) },
        ],
        baseMaxTokens: 4096,
        temperature: 0.2,
        thinkingBudget: 2048,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return parseCanonFactsJson(this.extractJson(text));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during canon facts generation', { cause: error });
    }
  }

  // ===========================
  // CHAPTER GENERATION
  // ===========================

  async generateChapter(
    fullText: string,
    generationType: ChapterGenerationTypeKey,
    projectContext?: string
  ): Promise<ChapterGeneration> {
    // Load the appropriate prompt based on generation type
    const basePrompt = await this.loadChapterGenerationPrompt(generationType);
    const systemPrompt = this.enhanceChapterGenerationPromptForAnthropic(basePrompt, projectContext);

    // Determine token limit based on generation type
    const tokenLimit = generationType === 'chapter-full' ? 4096 : 2048;

    try {
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: fullText }],
        baseMaxTokens: tokenLimit,
        temperature: 0.75,
        thinkingBudget: 6144,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return this.parseChapterGenerationResponse(text, generationType);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during chapter generation', { cause: error });
    }
  }

  private async loadChapterGenerationPrompt(
    generationType: ChapterGenerationTypeKey
  ): Promise<string> {
    switch (generationType) {
      case 'chapter-beginning':
        return this.promptRepository.getChapterBeginningPrompt();
      case 'chapter-full':
        return this.promptRepository.getChapterFullPrompt();
      case 'chapter-outline':
        return this.promptRepository.getChapterOutlinePrompt();
      default:
        throw new Error(`Unknown generation type: ${generationType}`);
    }
  }

  private enhanceChapterGenerationPromptForAnthropic(
    basePrompt: string,
    projectContext?: string
  ): string {
    const contextInfo = projectContext ?? '';

    return `${basePrompt}${contextInfo ? '\n\n---\n\nCONTEXTE DU PROJET:' + contextInfo : ''}

---

INSTRUCTIONS FINALES:
- Détecte la langue du texte et réponds dans la MÊME LANGUE
- Retourne UNIQUEMENT le JSON valide, sans markdown code blocks
- Le contenu généré doit provoquer une réaction chez l'auteur: adhésion, rejet ou réécriture`;
  }

  private parseChapterGenerationResponse(
    content: string,
    generationType: ChapterGenerationTypeKey
  ): ChapterGeneration {
    const jsonContent = this.extractJson(content);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse chapter generation response from Anthropic');
    }

    if (!parsed.content || typeof parsed.content !== 'string') {
      throw new Error('Invalid response: missing content');
    }

    return {
      generationType,
      content: parsed.content,
      narrativeContext: parsed.narrativeContext,
      suggestions: parsed.suggestions,
    };
  }

  /**
   * Generate text completion for autocompletion feature.
   */
  async generateCompletion(
    textBeforeCursor: string,
    textAfterCursor?: string,
    projectContext?: string
  ): Promise<string> {
    const basePrompt = await this.promptRepository.getCompletionPrompt();
    const systemPrompt = projectContext ? `${basePrompt}${projectContext}` : basePrompt;

    // Build user prompt with context
    let userPrompt = `[AVANT]\n${textBeforeCursor}`;
    if (textAfterCursor && textAfterCursor.trim()) {
      userPrompt += `\n\n[APRÈS]\n${textAfterCursor}`;
    }

    try {
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        baseMaxTokens: AUTOCOMPLETE_POLICY.outputBudgetTokens,
        temperature: AUTOCOMPLETE_POLICY.temperature, // Low temperature for continuity
        thinkingBudget: 0, // No thinking for autocompletion (latency critical)
      });

      const response = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(response);

      const text = this.extractTextContent(response.content);
      return this.cleanCompletionResponse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during completion generation', { cause: error });
    }
  }

  private cleanCompletionResponse(content: string): string {
    let text = content.trim();

    // Remove surrounding quotes if present
    if (
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'"))
    ) {
      text = text.slice(1, -1);
    }

    // Remove markdown formatting
    text = text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');

    return text.trim();
  }

  /**
   * Generate text completion with streaming.
   */
  async *generateCompletionStream(
    textBeforeCursor: string,
    textAfterCursor?: string,
    projectContext?: string
  ): AsyncIterableIterator<string> {
    const basePrompt = await this.promptRepository.getCompletionPrompt();

    // The base contract prompt is identical across every completion, so cache it
    // as a stable prefix (ephemeral, ~5 min TTL). The volatile per-request context
    // (chapter tail, canon) rides in a separate, uncached block after it.
    const system: Anthropic.TextBlockParam[] = [
      { type: 'text', text: basePrompt, cache_control: { type: 'ephemeral' } },
    ];
    if (projectContext) {
      system.push({ type: 'text', text: projectContext });
    }

    // Build user prompt with context
    let userPrompt = `[AVANT]\n${textBeforeCursor}`;
    if (textAfterCursor && textAfterCursor.trim()) {
      userPrompt += `\n\n[APRÈS]\n${textAfterCursor}`;
    }

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: AUTOCOMPLETE_POLICY.outputBudgetTokens,
      temperature: AUTOCOMPLETE_POLICY.temperature,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    });

    let isFirstChunk = true;
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    let cachedInputTokens: number | null = null;

    for await (const event of stream) {
      if (event.type === 'message_start') {
        inputTokens = event.message.usage?.input_tokens ?? inputTokens;
        cachedInputTokens = event.message.usage?.cache_read_input_tokens ?? cachedInputTokens;
      } else if (event.type === 'message_delta') {
        outputTokens = event.usage.output_tokens ?? outputTokens;
      } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        // Only yield text deltas, skip thinking_delta blocks
        const content = event.delta.text;
        if (content) {
          // Clean up first chunk if it starts with quotes
          if (isFirstChunk) {
            isFirstChunk = false;
            if (content.startsWith('"') || content.startsWith("'")) {
              yield content.slice(1);
              continue;
            }
          }
          yield content;
        }
      }
    }

    this.lastTokenUsage = { inputTokens, outputTokens, cachedInputTokens };
  }

  // ===========================
  // CHARACTER SHEET GENERATION
  // ===========================

  async generateCharacterSheet(
    characterName: string,
    existingFields: Omit<CharacterProfile, 'name'>,
    projectContext: string
  ): Promise<Omit<CharacterProfile, 'name'>> {
    const basePrompt = await this.promptRepository.getCharacterSheetPrompt();
    const systemPrompt = this.buildCharacterSheetSystemPrompt(basePrompt, characterName, existingFields);

    try {
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: projectContext }],
        baseMaxTokens: 4096,
        temperature: 0.4,
        thinkingBudget: 4096,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return this.parseCharacterSheetResponse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during character sheet generation', { cause: error });
    }
  }

  private buildCharacterSheetSystemPrompt(
    basePrompt: string,
    characterName: string,
    existingFields: Omit<CharacterProfile, 'name'>
  ): string {
    const existing = Object.entries(existingFields)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    const existingSection = existing
      ? `\n\nFICHE EXISTANTE DU PERSONNAGE "${characterName}":\n${existing}\n\nComplète et enrichis les champs existants. Ne les efface pas — améliore-les.`
      : `\n\nPersonnage à documenter : "${characterName}". Aucun champ n'est encore rempli.`;

    return `${basePrompt}${existingSection}

---

FORMAT DE SORTIE JSON:

Retourne UNIQUEMENT un objet JSON avec exactement ces 8 clés :

{
  "identity": "Identité (âge, statut, rôle dans l'histoire)",
  "appearance": "Description physique",
  "psychology": "Psychologie, traits de caractère, motivations",
  "voiceAndLanguage": "Voix, registre de langage, tics de langage",
  "backstory": "Histoire personnelle et passé",
  "relationships": "Relations avec les autres personnages",
  "narrativeFunction": "Fonction narrative dans l'histoire",
  "openQuestions": "Questions ouvertes sur ce personnage"
}

INSTRUCTIONS:
- Détecte la langue du texte et réponds dans la MÊME LANGUE
- Ne fabrique pas de faits absents du texte
- Si une information est absente du texte, laisse le champ vide ("")
- Retourne UNIQUEMENT le JSON, sans markdown code blocks`;
  }

  private parseCharacterSheetResponse(content: string): Omit<CharacterProfile, 'name'> {
    const jsonContent = this.extractJson(content);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse character sheet response from Anthropic');
    }

    const fields = ['identity', 'appearance', 'psychology', 'voiceAndLanguage', 'backstory', 'relationships', 'narrativeFunction', 'openQuestions'];
    for (const field of fields) {
      if (typeof parsed[field] !== 'string') {
        throw new Error(`Invalid character sheet response: missing field "${field}"`);
      }
    }

    return {
      identity: parsed.identity,
      appearance: parsed.appearance,
      psychology: parsed.psychology,
      voiceAndLanguage: parsed.voiceAndLanguage,
      backstory: parsed.backstory,
      relationships: parsed.relationships,
      narrativeFunction: parsed.narrativeFunction,
      openQuestions: parsed.openQuestions,
    };
  }

  // =============================
  // THESAURUS — SUGGEST ALTERNATIVES
  // =============================

  async suggestAlternatives(
    word: string,
    sentence: string,
    authorProfile?: string
  ): Promise<WordAlternative[]> {
    const systemPrompt = this.buildThesaurusSystemPrompt(authorProfile);
    const userMessage = `Mot : ${word}\nPhrase de contexte : ${sentence}`;

    try {
      const params = this.buildApiParams({
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        baseMaxTokens: 1024,
        temperature: 0.7,
        thinkingBudget: 0,
      });

      const message = await this.createMessage(params as MessageCreateParamsNonStreaming);

      this.checkRefusal(message);

      const text = this.extractTextContent(message.content);
      return this.parseThesaurusResponse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during thesaurus suggestion', { cause: error });
    }
  }

  private buildThesaurusSystemPrompt(authorProfile?: string): string {
    const voiceSection = authorProfile
      ? `\nVOIX DU PROJET — ancre tes propositions sur cette voix :\n${authorProfile}\n`
      : '';

    return `Tu es un thésaurus littéraire expert. Pour le mot donné dans sa phrase de contexte, propose des alternatives qui nuancent l'intention de scène plutôt que de simples synonymes interchangeables.

RÈGLES:
- Propose entre 3 et 5 alternatives
- Pour chaque alternative : le mot exact + ce qu'il fait à la scène (l'effet dramatique, pas la définition du dictionnaire)
- Priorité aux synonymes mot-pour-mot ; n'inclus des tournures que si elles servent mieux l'intention
- Reste dans la langue du texte (FR→FR, EN→EN)
- Propose des nuances distinctes, pas des synonymes interchangeables
- Le champ "register" est optionnel : inclus-le uniquement si le registre est clairement distinct (ex: "littéraire", "argotique", "soutenu", "familier")
${voiceSection}
FORMAT DE SORTIE JSON (retourne UNIQUEMENT ce JSON, sans texte avant ni après) :
{
  "alternatives": [
    { "word": "...", "sceneEffect": "...", "register": "..." },
    { "word": "...", "sceneEffect": "..." }
  ]
}`;
  }

  private parseThesaurusResponse(content: string): WordAlternative[] {
    const jsonContent = this.extractJson(content);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse thesaurus response from Anthropic');
    }

    if (!Array.isArray(parsed.alternatives)) {
      throw new Error('Invalid thesaurus response format: missing alternatives array');
    }

    return parsed.alternatives
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (alt: any) =>
          typeof alt.word === 'string' &&
          alt.word.trim().length > 0 &&
          typeof alt.sceneEffect === 'string' &&
          alt.sceneEffect.trim().length > 0
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((alt: any) =>
        createWordAlternative({
          word: alt.word,
          sceneEffect: alt.sceneEffect,
          register: typeof alt.register === 'string' ? alt.register : undefined,
        })
      );
  }

  // ===========================
  // STREAMING CHAT
  // ===========================

  async *chatStream(
    messages: ChatMessage[],
    systemPrompt: string,
  ): AsyncIterableIterator<string> {
    const apiMessages = messages.map((m) => ({
      role: m.getRole() === 'author' ? ('user' as const) : ('assistant' as const),
      content: m.getContent(),
    }));

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    });

    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    let cachedInputTokens: number | null = null;

    for await (const event of stream) {
      if (event.type === 'message_start') {
        inputTokens = event.message.usage?.input_tokens ?? inputTokens;
        cachedInputTokens = event.message.usage?.cache_read_input_tokens ?? cachedInputTokens;
      } else if (event.type === 'message_delta') {
        outputTokens = event.usage.output_tokens ?? outputTokens;
      } else if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }

    this.lastTokenUsage = { inputTokens, outputTokens, cachedInputTokens };
  }
}
