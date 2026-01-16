// ABOUTME: Repository interface for ContactMessage persistence
// ABOUTME: Defines methods for storing and retrieving contact form submissions

import { ContactMessage } from '../entities/ContactMessage';

export interface ContactMessageRepository {
  /**
   * Save a new contact message.
   */
  save(message: ContactMessage): Promise<void>;

  /**
   * Find a contact message by ID.
   */
  findById(id: string): Promise<ContactMessage | null>;

  /**
   * List all contact messages, ordered by createdAt DESC.
   */
  listAll(): Promise<ContactMessage[]>;

  /**
   * List unread contact messages.
   */
  listUnread(): Promise<ContactMessage[]>;

  /**
   * Mark a message as read.
   */
  markAsRead(id: string): Promise<void>;

  /**
   * Delete a contact message.
   */
  delete(id: string): Promise<void>;
}
