// ABOUTME: Domain interface for exporting text content to document formats
// ABOUTME: Abstracts document generation (docx, pdf, txt) from business logic

export interface DocumentExporter {
  /**
   * Exports plain text to document format
   * @param content The text content to export
   * @param filename Desired output filename
   * @returns Promise resolving to document buffer
   * @throws Error if export fails
   */
  export(content: string, filename: string): Promise<Buffer>;

  /**
   * Checks if this exporter supports the given file format
   * @param filename File name to check
   * @returns true if exporter can handle this format
   */
  supports(filename: string): boolean;
}
