// ABOUTME: Decides whether a project's blank lines occupy a line in the published book.
// ABOUTME: Protects manuscripts written before the feature from an unasked-for reflow.

/**
 * The instant the feature reaches production. Projects created from here on honor blank lines;
 * older ones keep the layout their author has always seen, unless that author opts in.
 *
 * The creation date is the discriminator because it is the only one every project carries.
 * Tagging existing projects would not work: a project's settings document is created lazily,
 * the first time its author opens the settings page, so a manuscript that predates the feature
 * may have no settings row to tag — and would be stamped as new the day its author opens
 * that page.
 *
 * Keep this at or after the production deploy date. Moved earlier, it reflows books that
 * shipped before the feature existed.
 */
export const BLANK_LINES_HONORED_FROM = new Date('2026-08-13T00:00:00.000Z');

/**
 * @param explicitChoice the author's setting for this project, absent when never set
 * @param projectCreatedAt when the project was created
 */
export function honorsBlankLines(
  explicitChoice: boolean | undefined,
  projectCreatedAt: Date | undefined,
): boolean {
  if (explicitChoice !== undefined) return explicitChoice;
  // No date, or a date lost in transit: never reflow a book on a value we cannot trust.
  if (!projectCreatedAt || Number.isNaN(projectCreatedAt.getTime())) return false;
  return projectCreatedAt.getTime() >= BLANK_LINES_HONORED_FROM.getTime();
}
