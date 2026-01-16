// ABOUTME: One-time migration script to seed existing blog articles to MongoDB
// ABOUTME: Run with: npm run seed:blog

// Load environment variables FIRST before any other imports
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });

import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { blogArticles } from '../src/app/blog/articles';
import { BlogArticle } from '../src/domain/entities/BlogArticle';
import {
  serializeBlogArticle,
  BlogArticleDocument,
} from '../src/infrastructure/persistence/serialization/blog-article-serializer';

const SYSTEM_AUTHOR_ID = 'system';

async function seedBlogArticles(): Promise<void> {
  console.log('Starting blog article migration...\n');

  // Read config directly from process.env (after dotenv has loaded)
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'revise';

  // Validate configuration
  if (!mongoUri) {
    console.error('ERROR: MONGODB_URI environment variable is not set');
    console.error('Make sure .env.local contains MONGODB_URI');
    process.exit(1);
  }

  // Connect to MongoDB
  console.log('Connecting to MongoDB...');
  console.log(`Database: ${dbName}`);
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection<BlogArticleDocument>('blog_articles');

    // Ensure indexes
    console.log('Ensuring indexes...');
    await collection.createIndex({ slug: 1 }, { unique: true });
    await collection.createIndex({ isPublished: 1, publishedAt: -1 });
    await collection.createIndex({ updatedAt: -1 });

    console.log(`\nFound ${blogArticles.length} articles to migrate.\n`);

    let seeded = 0;
    let skipped = 0;

    for (const staticArticle of blogArticles) {
      // Check if article already exists
      const existing = await collection.findOne({ slug: staticArticle.slug });

      if (existing) {
        console.log(`  SKIP: "${staticArticle.slug}" (already exists)`);
        skipped++;
        continue;
      }

      // Create BlogArticle entity from static data
      const article = BlogArticle.createFromSeed({
        id: randomUUID(),
        slug: staticArticle.slug,
        title: staticArticle.title,
        excerpt: staticArticle.excerpt,
        content: staticArticle.content.trim(),
        readingTime: staticArticle.readingTime,
        publishedAt: new Date(staticArticle.date),
        authorId: SYSTEM_AUTHOR_ID,
      });

      // Serialize and insert
      const doc = serializeBlogArticle(article);
      await collection.insertOne(doc);

      console.log(`  SEED: "${staticArticle.slug}"`);
      seeded++;
    }

    console.log('\n--- Migration Summary ---');
    console.log(`  Seeded: ${seeded}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Total: ${blogArticles.length}`);
    console.log('\nMigration complete!');
  } catch (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the script
seedBlogArticles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
