// ABOUTME: Value object representing a single message in a character conversation.
// ABOUTME: Role 'author' is the user; role 'character' is the AI persona.

export interface ChatMessageProperties {
  role: 'author' | 'character';
  content: string;
  createdAt: Date;
}

export class ChatMessage {
  private constructor(private readonly props: ChatMessageProperties) {}

  static create(role: 'author' | 'character', content: string): ChatMessage {
    if (!content.trim()) throw new Error('ChatMessage content cannot be empty');
    return new ChatMessage({ role, content: content.trim(), createdAt: new Date() });
  }

  static reconstruct(props: ChatMessageProperties): ChatMessage {
    return new ChatMessage(props);
  }

  getRole(): 'author' | 'character' { return this.props.role; }
  getContent(): string { return this.props.content; }
  getCreatedAt(): Date { return this.props.createdAt; }

  toProperties(): ChatMessageProperties {
    return { ...this.props };
  }
}
