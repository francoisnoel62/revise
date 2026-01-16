// ABOUTME: MongoDB implementation of ContactMessageRepository
// ABOUTME: Stores contact form submissions from the landing page

import { Db, Collection } from 'mongodb';
import { ContactMessageRepository } from '@/domain/interfaces/ContactMessageRepository';
import { ContactMessage } from '@/domain/entities/ContactMessage';

interface ContactMessageDocument {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

function serialize(message: ContactMessage): ContactMessageDocument {
  return {
    _id: message.getId(),
    name: message.getName(),
    email: message.getEmail(),
    message: message.getMessage(),
    createdAt: message.getCreatedAt(),
    isRead: message.getIsRead(),
  };
}

function deserialize(doc: ContactMessageDocument): ContactMessage {
  return new ContactMessage(
    doc._id,
    doc.name,
    doc.email,
    doc.message,
    doc.createdAt,
    doc.isRead
  );
}

export class MongoDBContactMessageRepository implements ContactMessageRepository {
  private collection: Collection<ContactMessageDocument>;

  constructor(db: Db) {
    this.collection = db.collection<ContactMessageDocument>('contact_messages');
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { createdAt: -1 },
      { name: 'createdAt_desc' }
    );
    await this.collection.createIndex(
      { isRead: 1, createdAt: -1 },
      { name: 'isRead_createdAt' }
    );
  }

  async save(message: ContactMessage): Promise<void> {
    const doc = serialize(message);
    await this.collection.insertOne(doc);
  }

  async findById(id: string): Promise<ContactMessage | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? deserialize(doc) : null;
  }

  async listAll(): Promise<ContactMessage[]> {
    const docs = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(deserialize);
  }

  async listUnread(): Promise<ContactMessage[]> {
    const docs = await this.collection
      .find({ isRead: false })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(deserialize);
  }

  async markAsRead(id: string): Promise<void> {
    await this.collection.updateOne(
      { _id: id },
      { $set: { isRead: true } }
    );
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ _id: id });
  }
}
