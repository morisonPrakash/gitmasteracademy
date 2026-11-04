import { expect, test } from '@playwright/test';
import { watchConsole } from './helpers';

const PATHS = ['./', 'roadmap', 'learn/m03/git-diff', 'learn/m11/workflow-deploy-pages', 'terminal', 'visualizer', 'quizzes/m01', 'cheatsheet', 'glossary', 'projects/ecommerce-application'];

test('no horizontal page scroll on phone-sized screens', async ({ page }) => {
  const c = watchConsole(page);
  for (const p of PATHS) {
    await page.goto(p);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, p).toBeLessThanOrEqual(0);
  }
  c.expectClean();
});

test('mobile navigation drawer opens, navigates and closes', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  const drawer = page.getByRole('dialog', { name: 'Navigation menu' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('link', { name: 'Git Cheat Sheet' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Git Cheat Sheet');
  await expect(drawer).toHaveCount(0);
});
