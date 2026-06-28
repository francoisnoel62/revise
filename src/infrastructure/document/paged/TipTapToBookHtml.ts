// ABOUTME: Converts TipTap JSON into the semantic HTML consumed by the book renderer.
// ABOUTME: Preserves author content while leaving all presentation to publication profiles.

import type { JSONContent } from '@tiptap/core';

export class TipTapToBookHtml {
  convert(content: JSONContent): string {
    if (content.type !== 'doc') {
      throw new Error('Paged rendering requires a TipTap document root');
    }

    return this.renderChildren(content);
  }

  convertChapter(content: JSONContent, chapterTitle: string): string {
    if (content.type !== 'doc') {
      throw new Error('Paged rendering requires a TipTap document root');
    }

    const children = content.content ?? [];
    const stripped = this.startsWithTitleHeading(children, chapterTitle)
      ? { ...content, content: children.slice(1) }
      : content;

    return this.renderChildren(stripped);
  }

  private renderChildren(node: JSONContent): string {
    return (node.content ?? []).map((child) => this.renderNode(child)).join('');
  }

  private renderNode(node: JSONContent): string {
    const children = this.renderChildren(node);

    switch (node.type) {
      case 'text':
        return this.renderText(node);
      case 'paragraph':
        return `<p${this.renderBlockAttributes(node)}>${children}</p>`;
      case 'heading': {
        const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 1));
        return `<h${level}${this.renderBlockAttributes(node)}>${children}</h${level}>`;
      }
      case 'blockquote':
        return `<blockquote>${children}</blockquote>`;
      case 'bulletList':
        return `<ul>${children}</ul>`;
      case 'orderedList':
        return `<ol${
          typeof node.attrs?.start === 'number' && node.attrs.start !== 1
            ? ` start="${node.attrs.start}"`
            : ''
        }>${children}</ol>`;
      case 'listItem':
        return `<li>${children}</li>`;
      case 'codeBlock':
        return `<pre><code>${children}</code></pre>`;
      case 'horizontalRule':
        return '<hr>';
      case 'hardBreak':
        return '<br>';
      default:
        return children;
    }
  }

  private renderText(node: JSONContent): string {
    let html = this.escapeHtml(node.text ?? '');

    for (const mark of node.marks ?? []) {
      switch (mark.type) {
        case 'bold':
          html = `<strong>${html}</strong>`;
          break;
        case 'italic':
          html = `<em>${html}</em>`;
          break;
        case 'underline':
          html = `<u>${html}</u>`;
          break;
        case 'strike':
          html = `<s>${html}</s>`;
          break;
        case 'code':
          html = `<code>${html}</code>`;
          break;
        case 'highlight':
          html = `<mark>${html}</mark>`;
          break;
        case 'textStyle': {
          const style = this.renderStyle(mark.attrs);
          html = style ? `<span style="${style}">${html}</span>` : html;
          break;
        }
        case 'link': {
          const href =
            typeof mark.attrs?.href === 'string' ? this.escapeHtml(mark.attrs.href) : '';
          const target =
            typeof mark.attrs?.target === 'string'
              ? ` target="${this.escapeHtml(mark.attrs.target)}"`
              : '';
          const rel =
            typeof mark.attrs?.rel === 'string'
              ? ` rel="${this.escapeHtml(mark.attrs.rel)}"`
              : '';
          html = `<a href="${href}"${target}${rel}>${html}</a>`;
          break;
        }
      }
    }

    return html;
  }

  private renderBlockAttributes(node: JSONContent): string {
    const attributes: string[] = [];
    const semanticRole = node.attrs?.semanticRole;
    if (typeof semanticRole === 'string') {
      attributes.push(`data-semantic-role="${this.escapeHtml(semanticRole)}"`);
    }
    if (node.attrs?.indent === true) {
      attributes.push('data-indent="true"');
    }
    const style = this.renderStyle(node.attrs);
    if (style) attributes.push(`style="${style}"`);
    return attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
  }

  private renderStyle(attributes: Record<string, unknown> | undefined): string {
    if (!attributes) return '';
    const declarations: string[] = [];
    if (typeof attributes.fontFamily === 'string') {
      declarations.push(`font-family:${this.escapeHtml(attributes.fontFamily)}`);
    }
    if (typeof attributes.fontSize === 'string') {
      declarations.push(`font-size:${this.escapeHtml(attributes.fontSize)}`);
    }
    if (typeof attributes.textAlign === 'string') {
      declarations.push(`text-align:${this.escapeHtml(attributes.textAlign)}`);
    }
    return declarations.join(';');
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private startsWithTitleHeading(nodes: JSONContent[], title: string): boolean {
    const first = nodes[0];
    if (!first || first.type !== 'heading') return false;
    const text = (first.content ?? [])
      .filter((n) => n.type === 'text')
      .map((n) => n.text ?? '')
      .join('');
    return text.trim().toLowerCase() === title.trim().toLowerCase();
  }
}
