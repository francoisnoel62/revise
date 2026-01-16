// ABOUTME: Server actions for contact form handling
// ABOUTME: Stores contact messages in MongoDB

'use server';

import { getContactMessageRepository } from '@/infrastructure/config/providers';
import { ContactMessage } from '@/domain/entities/ContactMessage';
import { uuidGenerator } from '@/infrastructure/utils/UUIDGenerator';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface ContactActionResult {
  success: boolean;
  error?: string;
}

/**
 * Submit a contact form message.
 * Validates input and stores in database.
 */
export async function submitContactFormAction(
  data: ContactFormData
): Promise<ContactActionResult> {
  try {
    // Validate input
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Le nom est requis' };
    }

    if (!data.email || data.email.trim().length === 0) {
      return { success: false, error: 'L\'email est requis' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: 'L\'adresse email n\'est pas valide' };
    }

    if (!data.message || data.message.trim().length === 0) {
      return { success: false, error: 'Le message est requis' };
    }

    if (data.message.length > 5000) {
      return { success: false, error: 'Le message est trop long (max 5000 caractères)' };
    }

    // Create contact message entity
    const contactMessage = new ContactMessage(
      uuidGenerator.generate(),
      data.name.trim(),
      data.email.trim().toLowerCase(),
      data.message.trim(),
      new Date(),
      false
    );

    // Save to database
    const repo = await getContactMessageRepository();
    await repo.save(contactMessage);

    return { success: true };
  } catch (error) {
    console.error('Contact form submission error:', error);
    return {
      success: false,
      error: 'Une erreur est survenue. Veuillez réessayer.',
    };
  }
}
