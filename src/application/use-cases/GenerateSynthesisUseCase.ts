// ABOUTME: Use case for generating synthesis analysis using AI
// ABOUTME: Aggregates all previous metadata analyses and provides editorial feedback
// ABOUTME: Implements intelligent caching based on content hash

import {
  ProjectMetadata,
  MetadataRepository,
  ProjectRepository,
  LLMProvider,
  IdGenerator,
  Synthesis,
  NarrativeAnalysis,
  StylisticDNA,
  Characters,
  Plot,
  Worldbuilding,
} from '../../domain';
import { hashText } from '../utils/text-hash';
import { extractProjectFullText } from '../services/project-text';

export interface GenerateSynthesisInput {
  ownerId: string;
  projectId: string;
  forceRegenerate?: boolean;
}

export interface GenerateSynthesisResult {
  metadata: ProjectMetadata;
  analysis: Synthesis | null;
  wasUpdated: boolean;
  wasCached: boolean;
}

export class GenerateSynthesisUseCase {
  private static readonly TYPE_KEY = 'synthesis';
  private static readonly TITLE = 'Synthèse';

  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly llmProvider: LLMProvider,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: GenerateSynthesisInput): Promise<GenerateSynthesisResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    // 2. Load project with all chapters
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Extract text from all chapters
    const chapters = project.getChapters();
    if (chapters.length === 0) {
      throw new Error('Project has no chapters to analyze');
    }

    const fullText = extractProjectFullText(chapters);

    if (fullText.trim().length === 0) {
      throw new Error('Project chapters have no content to analyze');
    }

    // 4. Hash the full text for caching
    const contentHash = hashText(fullText);

    // 5. Check if synthesis metadata already exists
    let metadata = await this.metadataRepository.findByProjectAndType(
      input.ownerId,
      input.projectId,
      GenerateSynthesisUseCase.TYPE_KEY
    );

    // 6. Check if we can use cached metadata
    if (metadata && !input.forceRegenerate && !metadata.needsRegeneration(contentHash)) {
      return {
        metadata,
        analysis: null,
        wasUpdated: false,
        wasCached: true,
      };
    }

    // 7. Load existing metadata analyses
    const existingMetadata = await this.metadataRepository.findByProjectId(
      input.ownerId,
      input.projectId
    );

    // 8. Parse existing analyses into value objects
    const previousAnalyses = this.parsePreviousAnalyses(existingMetadata);

    // 9. Generate synthesis using LLM
    const analysis = await this.llmProvider.generateSynthesis(fullText, previousAnalyses);

    // 10. Format analysis as TipTap JSON
    const contentJson = this.formatAnalysisAsTipTapJSON(analysis);

    const wasUpdated = metadata !== null;

    if (metadata) {
      metadata.updateContent(contentJson, contentHash);
      metadata.markAsGenerated();
      metadata.updateStructuredData(JSON.stringify(analysis));
      await this.metadataRepository.update(input.ownerId, metadata);
    } else {
      metadata = ProjectMetadata.createGenerated(
        this.idGenerator.generate(),
        input.projectId,
        GenerateSynthesisUseCase.TYPE_KEY,
        GenerateSynthesisUseCase.TITLE,
        contentJson,
        contentHash,
        JSON.stringify(analysis)
      );
      await this.metadataRepository.create(input.ownerId, metadata);
    }

    return { metadata, analysis, wasUpdated, wasCached: false };
  }

  private parsePreviousAnalyses(metadata: ProjectMetadata[]): {
    narrative?: NarrativeAnalysis;
    stylisticDNA?: StylisticDNA;
    characters?: Characters;
    plot?: Plot;
    worldbuilding?: Worldbuilding;
  } {
    const result: {
      narrative?: NarrativeAnalysis;
      stylisticDNA?: StylisticDNA;
      characters?: Characters;
      plot?: Plot;
      worldbuilding?: Worldbuilding;
    } = {};

    for (const meta of metadata) {
      if (meta.wasEditedSinceGeneration()) continue;
      const raw = meta.getStructuredData();
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        switch (meta.getTypeKey()) {
          case 'narrative-analysis': result.narrative = parsed; break;
          case 'stylistic-dna': result.stylisticDNA = parsed; break;
          case 'characters': result.characters = parsed; break;
          case 'plot': result.plot = parsed; break;
          case 'worldbuilding': result.worldbuilding = parsed; break;
        }
      } catch {
        // Skip metadata with invalid structuredData
      }
    }

    return result;
  }

  private formatAnalysisAsTipTapJSON(analysis: Synthesis): string {
    const doc = {
      type: 'doc',
      content: [
        this.createHeading('Identité du Texte'),
        this.createParagraph(analysis.textIdentity),

        this.createHeading('Points Forts'),
        ...analysis.strengths.map((s) => this.createParagraph(`• ${s}`)),

        this.createHeading('Axes d\'Amélioration'),
        ...analysis.improvements.map((i) => this.createParagraph(`• ${i}`)),

        this.createHeading('Cohérence Interne'),
        this.createParagraph(analysis.internalCoherence),

        this.createHeading('Charte Stylistique'),
        ...analysis.stylisticCharter.map((rule) => this.createParagraph(`• ${rule}`)),

        this.createHeading('Résumé de l\'Intrigue'),
        this.createParagraph(analysis.plotSummary),

        this.createHeading('Questions Ouvertes'),
        ...analysis.openQuestions.map((q) => this.createParagraph(`• ${q}`)),

        this.createHeading('Personnages - Aide-Mémoire'),
        ...analysis.characterSummaries.map((char) =>
          this.createParagraph(
            `**${char.name}**: ${char.role} | ${char.motivation} | ${char.flaw} | ${char.lastSituation}`
          )
        ),

        this.createHeading('Promesses au Lecteur'),
        ...analysis.readerPromises.map((p) => this.createParagraph(`• ${p}`)),

        this.createHeading('Directions Narratives'),
        ...analysis.narrativeDirections.map((dir) =>
          this.createParagraph(
            `**${dir.direction}**\nAvantages: ${dir.advantages}\nRisques: ${dir.risks}`
          )
        ),

        this.createHeading('Scènes à Envisager'),
        ...analysis.suggestedScenes.map((scene) => this.createParagraph(`• ${scene}`)),

        this.createHeading('Personnages à Développer'),
        this.createParagraph(analysis.charactersToDevelop),

        this.createHeading('Alertes'),
        ...analysis.alerts.map((alert) => this.createParagraph(`⚠️ ${alert}`)),
      ],
    };

    return JSON.stringify(doc);
  }

  private createHeading(text: string): object {
    return {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text }],
    };
  }

  private createParagraph(text: string): object {
    return {
      type: 'paragraph',
      content: text ? [{ type: 'text', text }] : [],
    };
  }
}
