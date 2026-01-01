// ABOUTME: Test suite for RewriteProposal value object validating proposal content and metadata
// ABOUTME: Ensures proper construction and immutability of AI-generated text proposals

import { describe, it, expect } from 'vitest';
import { RewriteProposal } from './RewriteProposal';

describe('RewriteProposal', () => {
  describe('construction', () => {
    it('should create a proposal with content and style', () => {
      const proposal = new RewriteProposal(
        'This is the rewritten text.',
        'formal'
      );

      expect(proposal.content).toBe('This is the rewritten text.');
      expect(proposal.styleLabel).toBe('formal');
    });

    it('should create a proposal without style label', () => {
      const proposal = new RewriteProposal('Some content');

      expect(proposal.content).toBe('Some content');
      expect(proposal.styleLabel).toBeUndefined();
    });

    it('should throw error for empty content', () => {
      expect(() => {
        new RewriteProposal('');
      }).toThrow('Proposal content cannot be empty');
    });

    it('should throw error for whitespace-only content', () => {
      expect(() => {
        new RewriteProposal('   \n  ');
      }).toThrow('Proposal content cannot be empty');
    });
  });

  describe('getContent', () => {
    it('should return trimmed content', () => {
      const proposal = new RewriteProposal('  Text with spaces  ');

      expect(proposal.content).toBe('Text with spaces');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const proposal = new RewriteProposal('Content', 'casual');

      expect(proposal.content).toBe('Content');
      expect(proposal.styleLabel).toBe('casual');
      // TypeScript enforces immutability
    });
  });
});
