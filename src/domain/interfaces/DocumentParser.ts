// ABOUTME: Domain interface for parsing documents into plain text
// ABOUTME: Abstracts document format handling (docx, pdf, txt) from business logic

export interface DocumentParser {
  /**
   * Parses document buffer into plain text
   * @param buffer The raw document buffer
   * @param filename Original filename (for format detection)
   * @returns Promise resolving to extracted plain text
   * @throws Error if parsing fails or format is unsupported
   */
  parse(buffer: Buffer, filename: string): Promise<string>;

  /**
   * Checks if this parser supports the given file format
   * @param filename File name to check
   * @returns true if parser can handle this format
   */
  supports(filename: string): boolean;
}
