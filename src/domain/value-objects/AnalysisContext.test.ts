// ABOUTME: Tests for AnalysisContext value object
// ABOUTME: Verifies structure, color codes, and labels for analysis context entries

import { describe, it, expect } from 'vitest';
import {
  AnalysisContext,
  AnalysisContextEntry,
  ANALYSIS_COLORS,
  ANALYSIS_LABELS,
} from './AnalysisContext';

describe('AnalysisContext', () => {
  describe('AnalysisContextEntry structure', () => {
    it('should represent a present analysis entry', () => {
      const entry: AnalysisContextEntry = {
        typeKey: 'narrative-analysis',
        label: 'Analyse Narrative',
        present: true,
        summary: 'Narrateur omniscient, focalisation interne...',
        colorCode: '#8b5cf6',
      };

      expect(entry.typeKey).toBe('narrative-analysis');
      expect(entry.label).toBe('Analyse Narrative');
      expect(entry.present).toBe(true);
      expect(entry.summary).toBe('Narrateur omniscient, focalisation interne...');
      expect(entry.colorCode).toBe('#8b5cf6');
    });

    it('should represent an absent analysis entry without summary', () => {
      const entry: AnalysisContextEntry = {
        typeKey: 'plot',
        label: 'Intrigue',
        present: false,
        colorCode: '#f97316',
      };

      expect(entry.present).toBe(false);
      expect(entry.summary).toBeUndefined();
    });
  });

  describe('AnalysisContext structure', () => {
    it('should track total available vs total possible', () => {
      const context: AnalysisContext = {
        entries: [
          { typeKey: 'narrative-analysis', label: 'Analyse Narrative', present: true, colorCode: '#8b5cf6' },
          { typeKey: 'stylistic-dna', label: 'ADN Stylistique', present: true, colorCode: '#3b82f6' },
          { typeKey: 'plot', label: 'Intrigue', present: false, colorCode: '#f97316' },
        ],
        totalAvailable: 2,
        totalPossible: 3,
      };

      expect(context.totalAvailable).toBe(2);
      expect(context.totalPossible).toBe(3);
      expect(context.entries).toHaveLength(3);
    });
  });

  describe('ANALYSIS_COLORS', () => {
    it('should define colors for all analysis types', () => {
      const expectedTypes = [
        'narrative-analysis',
        'stylistic-dna',
        'characters',
        'plot',
        'worldbuilding',
        'chapter-summaries',
      ];

      for (const type of expectedTypes) {
        expect(ANALYSIS_COLORS[type]).toBeDefined();
        expect(ANALYSIS_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('should have distinct colors for each type', () => {
      const colors = Object.values(ANALYSIS_COLORS);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  describe('ANALYSIS_LABELS', () => {
    it('should define French labels for all analysis types', () => {
      expect(ANALYSIS_LABELS['narrative-analysis']).toBe('Analyse Narrative');
      expect(ANALYSIS_LABELS['stylistic-dna']).toBe('ADN Stylistique');
      expect(ANALYSIS_LABELS['characters']).toBe('Personnages');
      expect(ANALYSIS_LABELS['plot']).toBe('Intrigue');
      expect(ANALYSIS_LABELS['worldbuilding']).toBe('Univers');
      expect(ANALYSIS_LABELS['chapter-summaries']).toBe('Résumés chapitres');
    });
  });
});
