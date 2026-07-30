# AI Provider Management - User Guide

**Revise** supports multiple AI providers for text rewriting. This guide will help you configure and manage your AI providers.

## Overview

AI Provider Management allows you to:
- Use multiple AI providers (OpenAI, Anthropic, Google)
- Store API keys securely with AES-256-GCM encryption
- Test connections before saving
- Select different providers for different projects
- Switch providers without changing code or environment variables

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Your API Key](#getting-your-api-key)
3. [Adding Your First Provider](#adding-your-first-provider)
4. [Testing Connection](#testing-connection)
5. [Managing Providers](#managing-providers)
6. [Using Providers in Projects](#using-providers-in-projects)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

## Prerequisites

Before adding an AI provider, you need:
1. A Revise account (sign up at `/auth/signup`)
2. An API key from your chosen AI provider
3. The `ENCRYPTION_KEY` environment variable configured (see setup in README.md)

## Getting Your API Key

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Important**: Save it securely - you won't be able to see it again

### Anthropic
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)

### Google AI
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

## Adding Your First Provider

### Method 1: Via Dashboard Alert (Recommended for First-Time Users)

1. **Sign in** to your Revise account
2. **Navigate to Dashboard** - you'll see an alert: "Configure your AI Provider"
3. **Click "Add AI Provider"** button in the alert
4. The Providers Dialog will open

### Method 2: Via User Menu (Anytime)

1. **Sign in** to your Revise account
2. **Click your user menu** in the top-right corner
3. **Select "My Providers"**
4. **Click "Add Provider"** button

### Method 3: Via AI Menu in Editor

Once in the editor, you can also access provider management through the AI Menu:
1. **Open a project** in the editor
2. **Click the AI button** in the toolbar or use **Ctrl+Shift+I** (Cmd+Shift+I on Mac) to open the Command Palette
3. If no provider is configured, you'll see a prompt to configure one
4. Click the prompt to open the Providers Dialog

### Filling Out the Form

1. **Provider Name**: Enter a friendly name (e.g., "My OpenAI Account", "Production API")
   - This is just for your reference
   - You can have multiple providers of the same type with different names

2. **Provider Type**: Select from dropdown
   - OpenAI
   - Anthropic
   - Google

3. **Model**: Type the exact model name (free-text field, not a dropdown)
   - There is no predefined list — Revise sends whatever model name you type directly to the
     provider's API, so newly released models work immediately without waiting for an update
   - Examples: `gpt-5.2`, `claude-sonnet-4-5`, `claude-opus-4-6`, `gemini-3-flash-preview`
   - Check your provider's documentation for the exact current model identifier

4. **API Key**: Paste your API key
   - The key will be encrypted before storage
   - It's never sent to the client (only masked version shown)

5. **Test Connection** (Optional but Recommended)
   - Click "Test Connection" button
   - Rate limited: 1 test per 5 seconds per user
   - Success: ✅ Green checkmark with "Connection successful!"
   - Failure: ❌ Red X with error message
   - Note: Even if test fails, you can still save (useful if provider is temporarily down)

6. **Save**
   - Click "Save" button
   - Provider is encrypted and stored in MongoDB
   - You'll see it appear in your provider list

## Testing Connection

Connection testing verifies your API key is valid and the provider is reachable.

### How It Works

1. Makes a minimal API call to the provider
2. Verifies authentication
3. Returns success or error message

### Rate Limiting

- **Limit**: 1 test per 5 seconds per user
- **Why**: Prevents excessive API calls and abuse
- **If Blocked**: Wait 5 seconds and try again
- **Message**: "Please wait 5 seconds between tests"

### Common Test Results

**✅ Success Messages:**
- "Connection successful! Model is accessible"
- "API key is valid and model responds correctly"

**❌ Error Messages:**
- "Invalid API key" - Check your key is correct
- "Model not found" - Select a different model
- "Rate limit exceeded" - Wait and try again
- "Network error" - Check your internet connection

## Managing Providers

### Viewing Your Providers

1. Click **user menu** → **"My Providers"**
2. You'll see a list of all your configured providers with:
   - Provider name
   - Provider type (OpenAI, Anthropic, etc.)
   - Model name
   - Masked API key (e.g., "sk-...XXXX")
   - Status badge (if tested)

### Editing a Provider

1. Open **"My Providers"**
2. Find the provider you want to edit
3. Click the **edit icon** (pencil)
4. Update any field:
   - Change name
   - Switch model
   - Update API key
5. Optionally **test connection** again
6. Click **"Save"**

**Note**: Changing the API key requires re-encryption. The old key is securely overwritten.

### Deleting a Provider

1. Open **"My Providers"**
2. Find the provider you want to delete
3. Click the **delete icon** (trash)
4. **Confirmation dialog** appears
5. If provider is **in use by projects**:
   - ❌ Deletion blocked
   - Error message shows which projects use it
   - You must change those projects first
6. If provider is **not in use**:
   - ✅ Confirm deletion
   - Provider and encrypted key are permanently removed

### Provider Status Badges

Providers may show status badges:
- **Active** (Green): Recently tested and working
- **Untested** (Gray): Never tested or test was inconclusive
- **Error** (Red): Last test failed (but you can still use it)

## Using Providers in Projects

### Automatic Selection

When you create or edit a project:
1. **If you have providers**: Select one from the dropdown
2. **If you have no providers**: Falls back to `OPENAI_API_KEY` environment variable

### Per-Project Provider

Each project can use a different provider:
- Project A → OpenAI GPT-5-mini
- Project B → Anthropic Claude Opus 4.6
- Project C → Google Gemini 3 Flash

### Changing Project Provider

1. Open project in editor
2. Go to **project settings** (if available) or **edit project**
3. Select different provider from dropdown
4. Save changes
5. All future rewrites use the new provider

### Fallback Behavior

If your selected provider fails:
1. System tries environment variable `OPENAI_API_KEY`
2. If that fails, shows error message
3. You can then update your provider or API key

## Security Best Practices

### ✅ Do's

1. **Use UI for provider management** (not environment variables)
   - Keys are encrypted in database
   - Multi-tenant isolation protects your keys
   - Easy to rotate without redeploying

2. **Use different providers for different purposes**
   - Personal projects: Free tier API
   - Production work: Paid tier API with higher limits

3. **Test connection** before saving
   - Catches typos in API keys
   - Verifies provider is working

4. **Rotate API keys regularly**
   - Update keys every 90 days
   - Use provider management UI to update
   - Old key is securely overwritten

5. **Monitor your API usage** on provider dashboards
   - Track costs
   - Set spending limits
   - Watch for unusual activity

### ❌ Don'ts

1. **Never share your API keys**
   - Keys give full access to your account
   - Can incur costs on your billing

2. **Never commit keys to Git**
   - Revise handles encryption for you
   - No need to put keys in `.env.local` anymore

3. **Never use production keys for testing**
   - Use separate keys for development and production
   - Helps with cost tracking and security

4. **Don't ignore failed connection tests**
   - Failed tests often indicate billing or rate limit issues
   - Fix the root cause before using in production

## Troubleshooting

### "ENCRYPTION_KEY must be at least 32 characters"

**Problem**: The encryption key environment variable is missing or too short.

**Solution**:
1. Generate a secure key: `openssl rand -base64 32`
2. Add to `.env.local`: `ENCRYPTION_KEY=your-generated-key-here`
3. Restart your development server
4. **Critical**: Keep this key secure - losing it means losing access to encrypted API keys

### "Failed to decrypt API key"

**Problem**: The encryption key changed or the database entry is corrupted.

**Causes**:
- Changed `ENCRYPTION_KEY` after storing providers
- Database corruption
- Migration issues

**Solution**:
1. If you changed `ENCRYPTION_KEY`, restore the old key
2. If you lost the old key, delete affected providers and re-add them
3. If database is corrupted, contact support or delete and recreate providers

### "Please wait 5 seconds between tests"

**Problem**: You're testing connections too frequently.

**Solution**:
- Wait 5 seconds between connection tests
- Rate limiting prevents excessive API calls
- This is per-user, not per-provider

### "Invalid API key"

**Problem**: The API key is incorrect or expired.

**Solutions**:
1. **Check for typos**: Copy-paste the key again
2. **Verify key format**:
   - OpenAI: starts with `sk-proj-` or `sk-`
   - Anthropic: starts with `sk-ant-`
   - Google: custom format
3. **Check key is active**: Visit provider dashboard to confirm
4. **Generate new key**: If key is revoked, create a new one

### "Model not found"

**Problem**: The selected model doesn't exist or isn't accessible with your API key.

**Solutions**:
1. **Select a different model** from the dropdown
2. **Check your account tier**: Some models require paid accounts
3. **Verify model name**: Models are retired/renamed over time
4. **Contact provider**: Confirm model availability

### "Cannot delete provider - in use by projects"

**Problem**: You're trying to delete a provider that projects depend on.

**Solution**:
1. Note which projects use this provider (shown in error)
2. Edit each project to use a different provider
3. Once no projects use it, deletion will succeed

### "Connection successful but rewrite fails"

**Problem**: Connection test passed but actual rewriting fails.

**Possible Causes**:
1. **Model is overloaded**: Try again in a few minutes
2. **Rate limit reached**: Check your provider dashboard for limits
3. **Billing issue**: Verify your payment method is valid
4. **Content policy**: Some text may violate provider policies

**Solutions**:
1. Wait and retry
2. Check provider dashboard for issues
3. Update billing information
4. Try different text or provider

### Provider Dashboard Shows High Usage

**Problem**: Seeing more API calls than expected.

**Investigation**:
1. Each rewrite generates 3 proposals (1 API call)
2. Connection tests also count as API calls
3. Check if team members have access
4. Review auto-save frequency (may trigger rewrites)

**Solutions**:
1. Use lower-tier models for drafts
2. Reduce connection testing frequency
3. Monitor usage patterns
4. Set spending alerts on provider dashboards

## FAQ

### Can I use multiple providers simultaneously?

**Yes!** Each project can use a different provider. For example:
- Project 1 → OpenAI
- Project 2 → Anthropic
- Project 3 → Google

### Are my API keys secure?

**Yes.** API keys are encrypted with AES-256-GCM before storage. Only you (with the correct `ENCRYPTION_KEY`) can decrypt them. Keys are never sent to the client - you only see masked versions.

### What happens if I lose my ENCRYPTION_KEY?

**You lose access to all encrypted API keys.** You'll need to delete all providers and re-add them with your new encryption key. This is why it's critical to backup your `ENCRYPTION_KEY` securely.

### Can I share providers with team members?

**No.** Providers are user-specific. Each user manages their own providers and API keys. This ensures proper cost tracking and security isolation.

### Which provider should I choose?

**It depends on your needs:**

- **OpenAI GPT-5.2**: Best balance of speed, quality, and cost (recommended)
- **Anthropic Claude Sonnet 4.5**: Excellent for long-form content, strong instruction following
- **Anthropic Claude Opus 4.6**: Flagship model with adaptive thinking and 128K output
- **Google Gemini 3 Flash**: Fast and cost-effective with 1M context

**Recommendation**: Start with OpenAI GPT-5.2 or Anthropic Claude Sonnet 4.5 for the best experience.

### How much does it cost?

**Costs vary by provider and model.** Revise shows the euro cost of every AI call directly in the
app (cockpit "Utilisation IA" page), computed from a pricing table synced automatically from
OpenRouter and kept up to date — no need to track prices manually. Check provider pricing pages
for the underlying rates if you want the full detail:
- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Google AI Pricing](https://ai.google.dev/pricing)

**Illustrative costs** for 100 rewrites (500 proposals) — check the in-app cost tracking for
current, model-specific figures:
- GPT-5-mini: ~$0.05-0.10
- Claude Sonnet 4.5: ~$0.30-0.50
- Claude Opus 4.6: ~$0.50-1.00

### Can I use the free environment variable method instead?

**Yes**, but it's not recommended. You can still set `OPENAI_API_KEY` in `.env.local` as a fallback. However, the UI method is:
- More secure (encrypted storage)
- More flexible (multiple providers)
- Easier to rotate keys
- Better for team environments

### What if my provider is temporarily down?

**Revise will show an error message.** You can:
1. Wait and retry
2. Switch to a different provider temporarily
3. Check provider status pages for outages

### Do I need to configure providers to use Revise?

**No.** You can create and edit projects without any AI provider configured. The AI features (rewrite, autocompletion, metadata analysis) will simply be hidden until you add a provider. This allows you to start writing immediately and add AI capabilities later.

For development, you can still use the `OPENAI_API_KEY` environment variable as a fallback.

### Can I export/import provider configurations?

**Not currently.** Providers are tied to your user account and encryption key. This is intentional for security reasons.

### What happens if I delete my account?

**All your data is permanently deleted**, including:
- All providers and encrypted API keys
- All projects and chapters
- All metadata analyses
- All correction history
- All blog articles (if admin)

This follows RGPD requirements for data deletion. Export your data before deleting your account if you need a backup.

---

**Need Help?**
- Check [Troubleshooting](#troubleshooting)
- Visit [GitHub Issues](https://github.com/francoisnoel62/revise/issues)
- Contact support (if available)

**Security Concern?**
- Report security issues privately
- Don't share API keys publicly
- Keep `ENCRYPTION_KEY` secure
