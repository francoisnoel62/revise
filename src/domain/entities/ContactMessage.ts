// ABOUTME: Entity representing a contact form submission
// ABOUTME: Stores visitor messages from the landing page contact form

export interface ContactMessageProps {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

export class ContactMessage {
  private readonly id: string;
  private readonly name: string;
  private readonly email: string;
  private readonly message: string;
  private readonly createdAt: Date;
  private isRead: boolean;

  constructor(
    id: string,
    name: string,
    email: string,
    message: string,
    createdAt: Date = new Date(),
    isRead: boolean = false
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.message = message;
    this.createdAt = createdAt;
    this.isRead = isRead;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email;
  }

  getMessage(): string {
    return this.message;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getIsRead(): boolean {
    return this.isRead;
  }

  markAsRead(): void {
    this.isRead = true;
  }

  toProps(): ContactMessageProps {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      message: this.message,
      createdAt: this.createdAt,
      isRead: this.isRead,
    };
  }

  static fromProps(props: ContactMessageProps): ContactMessage {
    return new ContactMessage(
      props.id,
      props.name,
      props.email,
      props.message,
      props.createdAt,
      props.isRead
    );
  }
}
