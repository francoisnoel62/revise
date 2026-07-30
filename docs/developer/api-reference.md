# AI Provider Management - Developer API Reference

This document provides technical documentation for the AI Provider Management and Publishing
server actions in Revise. **Scope note**: despite the generic filename, this document only covers
these two feature areas — it does not document the app's other ~30 server-action files or its 9
API routes (`/api/character-chat/stream`, `/api/completion/stream`, `/api/completion/telemetry`,
`/api/book-preview/pdf`, `/api/cron/sync-pricing`, `/api/paged-spike/export`, `/api/approve`,
`/api/auth/[...nextauth]`, etc.). For those, see [src/app/README.md](../../src/app/README.md),
which is kept current with the full Interface layer.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Server Actions API](#server-actions-api)
3. [Domain Entities](#domain-entities)
4. [Data Types](#data-types)
5. [Security](#security)
6. [Error Handling](#error-handling)
7. [Testing](#testing)
8. [Performance Considerations](#performance-considerations)

## Architecture Overview

Provider Management follows Clean Architecture principles with clear layer separation:

```
┌─────────────────────────────────────────────────────┐
│ Interface Layer (Client Components)                 │
│ - ProvidersDialog, ProviderForm, ProviderCard      │
│ - NoProvidersAlert                                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Server Actions (app/actions/provider-actions.ts)   │
│ - createProviderAction                              │
│ - listProvidersAction                               │
│ - updateProviderAction                              │
│ - deleteProviderAction                              │
│ - testProviderConnectionAction                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Domain Layer (domain/entities/Provider.ts)          │
│ - Provider entity with business logic               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Infrastructure Layer                                │
│ - MongoDBProviderRepository (persistence)           │
│ - Encryption utilities (AES-256-GCM)               │
│ - Rate limiter (connection testing)                │
└─────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Encryption at Rest**: API keys encrypted with AES-256-GCM before MongoDB storage
2. **Multi-tenant Isolation**: All queries filtered by `ownerId` (user ID)
3. **Rate Limiting**: Connection tests limited to 1 per 5 seconds per user
4. **Masked Display**: API keys never sent to client (only masked versions)
5. **Clean Architecture**: Business logic in domain layer, infrastructure swappable

## Server Actions API

All provider operations are exposed as Next.js Server Actions with type-safe interfaces.

### createProviderAction

Creates a new AI provider with encrypted credentials.

```typescript
createProviderAction(data: CreateProviderInput): Promise<ActionResult<SafeProvider>>
```

**Input:**
```typescript
interface CreateProviderInput {
  name: string;          // Display name (e.g., "My OpenAI Account")
  type: ProviderType;    // 'openai' | 'anthropic' | 'google'
  apiKey: string;        // Plain text API key (will be encrypted)
  model: string;         // Model identifier (e.g., "gpt-4o-mini")
}
```

**Output:**
```typescript
interface SafeProvider {
  id: string;
  name: string;
  type: ProviderType;
  model: string;
  maskedApiKey: string;  // e.g., "sk-...XXXX" (never full key)
  createdAt: Date;
  updatedAt: Date;
}
```

**Example:**
```typescript
import { createProviderAction } from '@/app/actions/provider-actions';

async function addProvider() {
  const result = await createProviderAction({
    name: "Production OpenAI",
    type: "openai",
    apiKey: "sk-proj-...", // Full key, will be encrypted
    model: "gpt-4o-mini"
  });

  if (result.success) {
    console.log("Provider created:", result.data);
    // result.data.maskedApiKey = "sk-...XXXX"
  } else {
    console.error("Error:", result.error);
  }
}
```

**Validation:**
- Name: Required, min 1 char, max 100 chars
- Type: Must be valid ProviderType
- API Key: Required, min 10 chars
- Model: Required, min 1 char

**Security:**
- API key encrypted with AES-256-GCM before storage
- Provider associated with current user (multi-tenant)
- Only masked key returned to client

**Errors:**
- "Name is required"
- "API key is required"
- "Invalid provider type"
- "Failed to create provider"

---

### listProvidersAction

Lists all providers for the current user.

```typescript
listProvidersAction(): Promise<ActionResult<SafeProvider[]>>
```

**Output:**
```typescript
SafeProvider[] // Array of providers, sorted by createdAt desc
```

**Example:**
```typescript
import { listProvidersAction } from '@/app/actions/provider-actions';

async function loadProviders() {
  const result = await listProvidersAction();

  if (result.success) {
    console.log(`Found ${result.data.length} providers`);
    result.data.forEach(p => {
      console.log(`${p.name} (${p.type}): ${p.maskedApiKey}`);
    });
  }
}
```

**Security:**
- Only returns providers owned by current user
- API keys always masked
- Multi-tenant isolation enforced

**Performance:**
- Indexed on `ownerId` for fast queries
- Typical response time: < 50ms

---

### updateProviderAction

Updates an existing provider's configuration.

```typescript
updateProviderAction(
  providerId: string,
  updates: UpdateProviderInput
): Promise<ActionResult<SafeProvider>>
```

**Input:**
```typescript
interface UpdateProviderInput {
  name?: string;
  model?: string;
  apiKey?: string;  // If provided, will re-encrypt
}
```

**Example:**
```typescript
import { updateProviderAction } from '@/app/actions/provider-actions';

async function changeModel(providerId: string) {
  const result = await updateProviderAction(providerId, {
    model: "gpt-4o" // Upgrade to GPT-4o
  });

  if (result.success) {
    console.log("Model updated:", result.data.model);
  }
}

async function rotateKey(providerId: string, newKey: string) {
  const result = await updateProviderAction(providerId, {
    apiKey: newKey // Old key securely overwritten
  });

  if (result.success) {
    console.log("API key rotated successfully");
  }
}
```

**Security:**
- Verifies provider ownership before update
- If `apiKey` provided, old key securely overwritten with new encrypted key
- Multi-tenant isolation enforced

**Errors:**
- "Provider not found"
- "Unauthorized: provider belongs to another user"
- "Failed to update provider"

---

### deleteProviderAction

Deletes a provider if not in use by any projects.

```typescript
deleteProviderAction(providerId: string): Promise<ActionResult<void>>
```

**Example:**
```typescript
import { deleteProviderAction } from '@/app/actions/provider-actions';

async function removeProvider(providerId: string) {
  const result = await deleteProviderAction(providerId);

  if (result.success) {
    console.log("Provider deleted successfully");
  } else {
    // Likely: "Cannot delete provider - it is used by 2 project(s)"
    console.error("Error:", result.error);
  }
}
```

**Security:**
- Verifies provider ownership
- Checks if provider is used by projects
- Encrypted API key permanently deleted

**Errors:**
- "Provider not found"
- "Cannot delete provider - it is used by X project(s)"
- "Failed to delete provider"

**Note:** To delete a provider in use, first update all projects to use different providers.

---

### testProviderConnectionAction

Tests provider connection with rate limiting.

```typescript
testProviderConnectionAction(data: TestProviderInput): Promise<ActionResult<TestResult>>
```

**Input:**
```typescript
interface TestProviderInput {
  type: ProviderType;
  apiKey: string;  // Plain text (not stored, just tested)
  model: string;
}
```

**Output:**
```typescript
interface TestResult {
  valid: boolean;
  message: string;
}
```

**Example:**
```typescript
import { testProviderConnectionAction } from '@/app/actions/provider-actions';

async function testConnection() {
  const result = await testProviderConnectionAction({
    type: "openai",
    apiKey: "sk-proj-...",
    model: "gpt-4o-mini"
  });

  if (result.success) {
    if (result.data.valid) {
      console.log("✅", result.data.message);
      // "Connection successful! Model is accessible."
    } else {
      console.log("❌", result.data.message);
      // "Invalid API key" or "Model not found"
    }
  }
}
```

**Rate Limiting:**
- **Limit**: 1 test per 5 seconds per user
- **Implementation**: In-memory rate limiter with user ID key
- **Error**: "Please wait 5 seconds between tests"

**Security:**
- API key not stored, only tested
- Rate limiting prevents abuse
- Connection details not exposed

**Common Messages:**
- Success: "Connection successful! Model is accessible."
- Invalid key: "Invalid API key"
- Model not found: "Model not found or not accessible"
- Network error: "Failed to connect to provider"

---

## Publishing Actions API (Phase 5.0)

Server Actions for public project sharing.

### publishProjectAction

Publishes a project with a unique share token.

```typescript
publishProjectAction(projectId: string): Promise<ActionResult<PublishResult>>
```

**Output:**
```typescript
interface PublishResult {
  shareToken: string;  // Unique token for public access
  shareUrl: string;    // Full URL: /read/[projectId]/[token]
}
```

**Example:**
```typescript
import { publishProjectAction } from '@/app/actions/publish-actions';

async function publishProject(projectId: string) {
  const result = await publishProjectAction(projectId);

  if (result.success) {
    console.log("Share URL:", result.data.shareUrl);
    // Copy to clipboard or display to user
  }
}
```

---

### unpublishProjectAction

Removes a project from public access.

```typescript
unpublishProjectAction(projectId: string): Promise<ActionResult<void>>
```

---

### loadPublishedProjectAction

Loads a published project by share token (no authentication required).

```typescript
loadPublishedProjectAction(
  projectId: string,
  token: string
): Promise<ActionResult<PublicProject>>
```

**Output:**
```typescript
interface PublicProject {
  id: string;
  title: string;
  chapters: PublicChapter[];
  readingTime: string;  // e.g., "15 min"
}

interface PublicChapter {
  id: string;
  title: string;
  content: string;  // TipTap JSON
  readingTime: string;
}
```

---

### getPublishStatusAction

Returns current publish status for a project.

```typescript
getPublishStatusAction(projectId: string): Promise<ActionResult<PublishStatus>>
```

**Output:**
```typescript
interface PublishStatus {
  isPublished: boolean;
  shareToken: string | null;
  shareUrl: string | null;
  publishedAt: Date | null;
}
```

---

## Data Types

### PaginatedResult (Phase 4.1+)

Generic pagination result for blog articles.

```typescript
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

**Usage with blog:**
```typescript
const result: PaginatedResult<BlogArticle> = await loadPaginatedArticles(page);
// result.items = articles for current page
// result.totalPages = number of pages
```

---

## Domain Entities

### Provider

The core domain entity representing an AI provider configuration.

```typescript
// domain/entities/Provider.ts
export class Provider {
  constructor(
    public readonly id: string,
    public readonly ownerId: string,      // User ID (multi-tenant)
    public name: string,
    public readonly type: ProviderType,
    public model: string,
    private apiKey: string,               // Plain text in memory
    public readonly encryptedApiKey: string, // Encrypted in DB
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  // Get masked version for client display
  getMaskedApiKey(): string {
    return maskApiKey(this.apiKey);
  }

  // Check if provider is ready to use
  isValid(): boolean {
    return !!(this.name && this.type && this.model && this.apiKey);
  }

  // Update mutable fields
  update(updates: { name?: string; model?: string }): void {
    if (updates.name !== undefined) this.name = updates.name;
    if (updates.model !== undefined) this.model = updates.model;
    this.updatedAt = new Date();
  }

  // Create instance from decrypted data
  static fromDecrypted(data: ProviderData): Provider {
    return new Provider(/* ... */);
  }
}
```

**Validation Rules:**
- `id`: Non-empty string
- `ownerId`: Non-empty string (user ID)
- `name`: 1-100 characters
- `type`: Valid ProviderType enum value
- `model`: Non-empty string
- `apiKey`: Minimum 10 characters
- `encryptedApiKey`: Non-empty string (base64)

---

## Data Types

### ProviderType

Enum of supported AI providers.

```typescript
export type ProviderType = 'openai' | 'anthropic' | 'google';

export const PROVIDER_TYPES: ProviderType[] = [
  'openai',
  'anthropic',
  'google'
];
```

> Corrected 2026-07-29: this document previously listed `mistral`/`cohere` as supported provider
> types. They never had a working implementation (`LLMProviderFactoryImpl` throws
> `Unsupported provider type` for both) — only OpenAI, Anthropic, and Google are real.

### SafeProvider

Client-safe provider representation (no plain API key).

```typescript
export interface SafeProvider {
  id: string;
  name: string;
  type: ProviderType;
  model: string;
  maskedApiKey: string;  // e.g., "sk-...XXXX"
  createdAt: Date;
  updatedAt: Date;
}
```

### ActionResult

Generic result type for server actions.

```typescript
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**Usage:**
```typescript
if (result.success) {
  // TypeScript knows result.data exists
  console.log(result.data);
} else {
  // TypeScript knows result.error exists
  console.error(result.error);
}
```

---

## Security

### Encryption

**Algorithm**: AES-256-GCM (Galois/Counter Mode)

**Process:**
1. Generate random 16-byte IV (initialization vector)
2. Derive 32-byte key from `ENCRYPTION_KEY` using PBKDF2
3. Encrypt API key using AES-256-GCM
4. Concatenate: `IV + encrypted data + auth tag`
5. Encode as base64
6. Store in MongoDB

**Implementation:**
```typescript
// infrastructure/encryption/crypto.ts
export function encryptApiKey(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format: iv + encrypted + authTag (all base64)
  return Buffer.concat([iv, Buffer.from(encrypted, 'base64'), authTag])
    .toString('base64');
}

export function decryptApiKey(encrypted: string): string {
  const buffer = Buffer.from(encrypted, 'base64');
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(-TAG_LENGTH);
  const data = buffer.subarray(IV_LENGTH, -TAG_LENGTH);

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Masking

API keys are masked for client display:

```typescript
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '****';

  const prefix = apiKey.substring(0, 4);
  const suffix = apiKey.substring(apiKey.length - 4);

  return `${prefix}...${suffix}`;
}

// Examples:
// "sk-proj-abc123def456" → "sk-p...6456"
// "sk-ant-xyz789" → "sk-a...x789"
```

### Multi-tenant Isolation

All queries filter by `ownerId`:

```typescript
// MongoDBProviderRepository
async findByOwnerId(ownerId: string): Promise<Provider[]> {
  const docs = await this.collection
    .find({ ownerId })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map(doc => this.deserialize(doc));
}
```

**MongoDB Index:**
```javascript
db.providers.createIndex({ ownerId: 1 })
```

### Rate Limiting

Connection tests are rate limited per user:

```typescript
// app/actions/rate-limiter.ts
const testLimiter = new Map<string, number>();

export async function checkTestRateLimit(userId: string): Promise<boolean> {
  const now = Date.now();
  const lastTest = testLimiter.get(userId) || 0;

  if (now - lastTest < 5000) { // 5 seconds
    return false; // Rate limited
  }

  testLimiter.set(userId, now);
  return true; // Allowed
}
```

---

## Error Handling

### Error Categories

**1. Validation Errors** (400-level)
- Missing required fields
- Invalid field values
- Format errors

**2. Authentication Errors** (401-level)
- User not authenticated
- Session expired

**3. Authorization Errors** (403-level)
- Provider belongs to different user
- Insufficient permissions

**4. Not Found Errors** (404-level)
- Provider doesn't exist
- User doesn't exist

**5. Business Logic Errors** (409-level)
- Cannot delete provider in use
- Rate limit exceeded

**6. Server Errors** (500-level)
- Database connection failed
- Encryption/decryption failed
- External API errors

### Error Response Format

All Server Actions return consistent error format:

```typescript
{
  success: false,
  error: string  // User-friendly message
}
```

### Best Practices

**1. Client-Side Error Handling:**
```typescript
async function handleProviderAction() {
  try {
    const result = await createProviderAction(data);

    if (result.success) {
      // Success path
      showSuccess("Provider created!");
      return result.data;
    } else {
      // Known error
      showError(result.error);
      return null;
    }
  } catch (error) {
    // Unexpected error (network, etc.)
    console.error("Unexpected error:", error);
    showError("Something went wrong. Please try again.");
    return null;
  }
}
```

**2. Server-Side Error Handling:**
```typescript
export async function createProviderAction(
  data: CreateProviderInput
): Promise<ActionResult<SafeProvider>> {
  try {
    // Validate input
    if (!data.name) {
      return { success: false, error: "Name is required" };
    }

    // Business logic
    const provider = await repository.create(data);

    return { success: true, data: toSafeProvider(provider) };
  } catch (error) {
    console.error("[createProviderAction]", error);
    return { success: false, error: "Failed to create provider" };
  }
}
```

---

## Testing

### Unit Tests

**Domain Layer:**
```typescript
// domain/entities/Provider.test.ts
describe('Provider', () => {
  it('should mask API key correctly', () => {
    const provider = new Provider(/*...*/);
    expect(provider.getMaskedApiKey()).toBe('sk-p...XXXX');
  });

  it('should validate required fields', () => {
    expect(() => new Provider('', '', '', /*...*/)).toThrow();
  });
});
```

**Infrastructure Layer:**
```typescript
// infrastructure/encryption/crypto.test.ts
describe('Encryption', () => {
  it('should encrypt and decrypt correctly', () => {
    const original = 'sk-test-key-123';
    const encrypted = encryptApiKey(original);
    const decrypted = decryptApiKey(encrypted);

    expect(decrypted).toBe(original);
    expect(encrypted).not.toBe(original);
  });

  it('should fail with wrong encryption key', () => {
    const encrypted = encryptApiKey('test');
    process.env.ENCRYPTION_KEY = 'different-key';

    expect(() => decryptApiKey(encrypted)).toThrow();
  });
});
```

### Integration Tests

**Server Actions:**
```typescript
// app/actions/provider-actions.test.ts
describe('Provider Actions', () => {
  it('should create and retrieve provider', async () => {
    const created = await createProviderAction({
      name: 'Test',
      type: 'openai',
      apiKey: 'sk-test',
      model: 'gpt-4o-mini'
    });

    expect(created.success).toBe(true);

    const list = await listProvidersAction();
    expect(list.data).toHaveLength(1);
    expect(list.data[0].name).toBe('Test');
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/provider-management.spec.ts
test('user can create provider', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=My Providers');
  await page.click('text=Add Provider');

  await page.fill('[name="name"]', 'Test Provider');
  await page.selectOption('[name="type"]', 'openai');
  await page.fill('[name="apiKey"]', 'sk-test-key');
  await page.selectOption('[name="model"]', 'gpt-4o-mini');

  await page.click('text=Save');

  await expect(page.locator('text=Test Provider')).toBeVisible();
});
```

---

## Performance Considerations

### Database Indexes

**Providers Collection:**
```javascript
// Critical indexes
db.providers.createIndex({ ownerId: 1 });
db.providers.createIndex({ ownerId: 1, createdAt: -1 });

// For deletion checks (optional)
db.projects.createIndex({ providerId: 1 });
```

### Query Optimization

**Efficient listing:**
```typescript
// Good: Single query with index
const providers = await collection
  .find({ ownerId })
  .sort({ createdAt: -1 })
  .toArray();

// Bad: Multiple queries
for (const id of providerIds) {
  await collection.findOne({ _id: id });
}
```

### Caching Considerations

**Rate Limiter:**
- In-memory cache (Map)
- Auto-cleanup after 1 hour
- Survives server restart? No (intentional)

**Encryption Key:**
- Derived once and cached
- Cleared on process restart
- Never cached in client

### Performance Targets

| Operation | Target | Typical |
|-----------|--------|---------|
| Create Provider | < 100ms | ~50ms |
| List Providers (50 items) | < 200ms | ~100ms |
| Update Provider | < 50ms | ~30ms |
| Delete Provider | < 50ms | ~30ms |
| Test Connection | < 3s | ~1-2s |
| Encrypt/Decrypt | < 1ms | ~0.5ms |

### Bottlenecks

1. **Connection Testing**: Limited by external API latency (1-3s)
2. **Encryption**: CPU-bound but fast (< 1ms)
3. **Database Queries**: I/O-bound, optimized with indexes

### Scaling Considerations

**For 1,000+ users:**
- Connection pool size: Increase to 50-100
- Rate limiter: Move to Redis for distributed systems
- Encryption: Consider key rotation strategy
- Database: Shard by `ownerId` if needed

---

## Example Workflows

### Complete Provider Creation Flow

```typescript
// 1. User fills out form
const formData = {
  name: "Production OpenAI",
  type: "openai" as ProviderType,
  apiKey: "sk-proj-...",
  model: "gpt-4o-mini"
};

// 2. Optional: Test connection
const testResult = await testProviderConnectionAction({
  type: formData.type,
  apiKey: formData.apiKey,
  model: formData.model
});

if (!testResult.success || !testResult.data.valid) {
  console.error("Connection failed:", testResult.data.message);
  // User can still save if they want
}

// 3. Create provider
const createResult = await createProviderAction(formData);

if (createResult.success) {
  console.log("Provider created:", createResult.data.id);

  // 4. Load updated list
  const listResult = await listProvidersAction();
  console.log(`Total providers: ${listResult.data.length}`);
}
```

### Provider Rotation Flow

```typescript
async function rotateProviderKey(providerId: string, newKey: string) {
  // 1. Test new key first
  const provider = await getProviderById(providerId);
  const testResult = await testProviderConnectionAction({
    type: provider.type,
    apiKey: newKey,
    model: provider.model
  });

  if (!testResult.success || !testResult.data.valid) {
    throw new Error("New key is invalid");
  }

  // 2. Update provider with new key
  const updateResult = await updateProviderAction(providerId, {
    apiKey: newKey
  });

  if (!updateResult.success) {
    throw new Error("Failed to update provider");
  }

  console.log("Key rotated successfully");
  // Old key is securely overwritten in database
}
```

---

## Additional Resources

- **Code Examples**: See `/src/components/providers/` for real implementations
- **Test Examples**: See `/src/app/actions/provider-actions.test.ts`
- **Architecture Docs**: See `docs/architecture.md` for the full layer-by-layer inventory
- **User Guide**: See `/docs/user/provider-management.md`
- **Full Interface layer reference**: See `/src/app/README.md`

---

**Questions or Issues?**
- Open GitHub issue
- Check test files for examples
- Review source code comments
