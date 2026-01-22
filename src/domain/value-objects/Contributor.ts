// ABOUTME: Value object representing a project contributor
// ABOUTME: Provides structure for contributors with name and role

export const CONTRIBUTOR_ROLES = [
  'author',
  'editor',
  'illustrator',
  'translator',
  'proofreader',
  'beta_reader',
  'other',
] as const;

export type ContributorRole = (typeof CONTRIBUTOR_ROLES)[number];

export function isValidContributorRole(value: string): value is ContributorRole {
  return CONTRIBUTOR_ROLES.includes(value as ContributorRole);
}

export const CONTRIBUTOR_ROLE_LABELS: Record<ContributorRole, string> = {
  author: 'Auteur',
  editor: 'Éditeur',
  illustrator: 'Illustrateur',
  translator: 'Traducteur',
  proofreader: 'Correcteur',
  beta_reader: 'Bêta-lecteur',
  other: 'Autre',
};

export interface Contributor {
  name: string;
  role: ContributorRole;
}

export function createContributor(name: string, role: ContributorRole): Contributor {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error('Contributor name cannot be empty');
  }
  if (!isValidContributorRole(role)) {
    throw new Error('Invalid contributor role');
  }
  return {
    name: trimmedName,
    role,
  };
}

export function isValidContributor(contributor: Contributor): boolean {
  if (!contributor) return false;
  if (!contributor.name || contributor.name.trim().length === 0) return false;
  if (!contributor.role || !isValidContributorRole(contributor.role)) return false;
  return true;
}
