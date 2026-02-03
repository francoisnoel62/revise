// ABOUTME: Use case for exporting analysis results as a report
// ABOUTME: Generates markdown report with all issues and corrections

import { AnalysisRepository } from '../../domain/interfaces/AnalysisRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { ANALYSIS_CATEGORY_LABELS } from '../../domain/value-objects/AnalysisCategory';
import { ANALYSIS_SEVERITY_LABELS } from '../../domain/value-objects/AnalysisSeverity';

export interface ExportAnalysisReportInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  analysisId: string;
  format: 'markdown' | 'text';
}

export interface ExportAnalysisReportResult {
  content: string;
  filename: string;
}

/**
 * Use case for exporting analysis results as a downloadable report.
 */
export class ExportAnalysisReportUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly analysisRepository: AnalysisRepository
  ) {}

  async execute(input: ExportAnalysisReportInput): Promise<ExportAnalysisReportResult> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Load project and verify ownership
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Find chapter
    const chapter = project.getChapters().find((c) => c.getId() === input.chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    // 4. Find analysis
    const analysis = await this.analysisRepository.findAnalysisByChapterId(
      input.ownerId,
      input.chapterId
    );

    if (!analysis || analysis.getId() !== input.analysisId) {
      throw new Error('Analysis not found');
    }

    // 5. Generate report
    const chapterTitle = chapter.getTitle() || 'Sans titre';
    const projectTitle = project.getTitle() || 'Projet';

    let content: string;

    if (input.format === 'markdown') {
      content = this.generateMarkdownReport(
        projectTitle,
        chapterTitle,
        analysis
      );
    } else {
      content = this.generateTextReport(projectTitle, chapterTitle, analysis);
    }

    const filename = `rapport-verification-${chapterTitle
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')}.${input.format === 'markdown' ? 'md' : 'txt'}`;

    return { content, filename };
  }

  private generateMarkdownReport(
    projectTitle: string,
    chapterTitle: string,
    analysis: { getIssues: () => Array<{
      category: string;
      severity: string;
      originalText: string;
      suggestion: string;
      explanation: string;
      status: string;
    }>; getStatsByCategory: () => Record<string, number>; getAnalyzedAt: () => Date }
  ): string {
    const issues = analysis.getIssues();
    const stats = analysis.getStatsByCategory();
    const date = analysis.getAnalyzedAt().toLocaleDateString('fr-FR');

    let report = `# Rapport de vérification\n\n`;
    report += `**Projet :** ${projectTitle}\n`;
    report += `**Chapitre :** ${chapterTitle}\n`;
    report += `**Date :** ${date}\n\n`;

    report += `## Résumé\n\n`;
    report += `| Catégorie | Nombre |\n`;
    report += `|-----------|--------|\n`;

    for (const [category, count] of Object.entries(stats)) {
      const label = ANALYSIS_CATEGORY_LABELS[category as keyof typeof ANALYSIS_CATEGORY_LABELS];
      report += `| ${label} | ${count} |\n`;
    }

    report += `\n**Total : ${issues.length} problèmes détectés**\n\n`;

    // Group issues by category
    const issuesByCategory = new Map<string, typeof issues>();
    for (const issue of issues) {
      const existing = issuesByCategory.get(issue.category) || [];
      existing.push(issue);
      issuesByCategory.set(issue.category, existing);
    }

    for (const [category, categoryIssues] of issuesByCategory) {
      const label = ANALYSIS_CATEGORY_LABELS[category as keyof typeof ANALYSIS_CATEGORY_LABELS];
      report += `## ${label}\n\n`;

      for (const issue of categoryIssues) {
        const severityLabel = ANALYSIS_SEVERITY_LABELS[issue.severity as keyof typeof ANALYSIS_SEVERITY_LABELS];
        const statusIcon = issue.status === 'applied' ? '✅' : issue.status === 'ignored' ? '⏭️' : '⏳';

        report += `### ${statusIcon} ${issue.originalText}\n\n`;
        report += `- **Sévérité :** ${severityLabel}\n`;
        report += `- **Suggestion :** ${issue.suggestion || '_Aucune_'}\n`;
        report += `- **Explication :** ${issue.explanation}\n`;
        report += `- **Statut :** ${issue.status}\n\n`;
      }
    }

    report += `---\n\n`;
    report += `_Généré par Revise_\n`;

    return report;
  }

  private generateTextReport(
    projectTitle: string,
    chapterTitle: string,
    analysis: { getIssues: () => Array<{
      category: string;
      severity: string;
      originalText: string;
      suggestion: string;
      explanation: string;
      status: string;
    }>; getAnalyzedAt: () => Date }
  ): string {
    const issues = analysis.getIssues();
    const date = analysis.getAnalyzedAt().toLocaleDateString('fr-FR');

    let report = `RAPPORT DE VÉRIFICATION\n`;
    report += `========================\n\n`;
    report += `Projet : ${projectTitle}\n`;
    report += `Chapitre : ${chapterTitle}\n`;
    report += `Date : ${date}\n\n`;
    report += `Total : ${issues.length} problèmes détectés\n\n`;
    report += `------------------------\n\n`;

    for (const issue of issues) {
      const label = ANALYSIS_CATEGORY_LABELS[issue.category as keyof typeof ANALYSIS_CATEGORY_LABELS];
      report += `[${label}] ${issue.originalText}\n`;
      report += `  Suggestion : ${issue.suggestion || 'Aucune'}\n`;
      report += `  Explication : ${issue.explanation}\n`;
      report += `  Statut : ${issue.status}\n\n`;
    }

    return report;
  }

  private validateInput(input: ExportAnalysisReportInput): void {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new Error('Chapter ID is required');
    }

    if (!input.analysisId || input.analysisId.trim().length === 0) {
      throw new Error('Analysis ID is required');
    }

    if (!['markdown', 'text'].includes(input.format)) {
      throw new Error('Invalid format');
    }
  }
}
