// ABOUTME: Tests for MongoDBUserRepository.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn(),
  },
}));

// Mock MongoDB
const mockCollection = {
  findOne: vi.fn(),
  insertOne: vi.fn(),
  countDocuments: vi.fn(),
};

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollection),
};

import { MongoDBUserRepository } from './MongoDBUserRepository';

describe('MongoDBUserRepository', () => {
  let repository: MongoDBUserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MongoDBUserRepository(mockDb as any);
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      const mockDoc = {
        _id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCollection.findOne.mockResolvedValue(mockDoc);

      const user = await repository.findByEmail('test@example.com');

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-123');
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('returns null when not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const user = await repository.findByEmail('unknown@example.com');

      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    it('creates user with hashed password', async () => {
      mockCollection.findOne.mockResolvedValue(null); // Email doesn't exist
      mockCollection.insertOne.mockResolvedValue({ insertedId: 'new-id' });

      const result = await repository.create({
        email: 'new@example.com',
        password: 'plaintext',
        name: 'New User',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 12);
      expect(result.email).toBe('new@example.com');
      expect(result.name).toBe('New User');
    });

    it('throws on duplicate email', async () => {
      mockCollection.findOne.mockResolvedValue({ _id: 'existing' });

      await expect(
        repository.create({ email: 'existing@example.com', password: 'password' })
      ).rejects.toThrow('already registered');
    });
  });

  describe('verifyPassword', () => {
    it('returns true for valid password', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await MongoDBUserRepository.verifyPassword('password', 'hash');

      expect(result).toBe(true);
    });

    it('returns false for invalid password', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await MongoDBUserRepository.verifyPassword('wrong', 'hash');

      expect(result).toBe(false);
    });
  });
});
