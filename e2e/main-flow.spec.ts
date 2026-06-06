// ABOUTME: End-to-end test for the public landing page and navigation flow
// ABOUTME: Tests what unauthenticated users see and can do on the public routes

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the landing page with hero section', async ({ page }) => {
    await page.goto('/');

    // Check page loaded with the app name in nav
    await expect(page.getByText('Revise Studio').first()).toBeVisible();

    // Check hero heading
    await expect(page.getByText('De l\'idée au livre publié.')).toBeVisible();

    // Check CTA buttons (use first() to handle duplicate elements)
    await expect(page.getByRole('link', { name: /commencer à écrire/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /découvrir le studio/i }).first()).toBeVisible();
  });

  test('should show navigation with login and signup buttons', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: /connexion/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /demander un accès/i })).toBeVisible();
  });

  test('should navigate to sign-in when clicking Connexion', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('navigation');
    await nav.getByRole('link', { name: /connexion/i }).click();

    await page.waitForURL('/auth/signin');
    await expect(page).toHaveURL('/auth/signin');
  });
});
