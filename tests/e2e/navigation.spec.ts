import { expect, test } from '@playwright/test';
import { MODULES } from '../../src/content/catalog';
import { watchConsole } from './helpers';

const PAGES: [string, RegExp][] = [
  ['./', /From Git beginner to professional developer|Welcome back/],
  ['roadmap', /Your path from first commit/],
  ['terminal', /Interactive Git Terminal/],
  ['visualizer', /Git Visualizer/],
  ['projects', /Practical Projects/],
  ['quizzes', /Quizzes and Final Assessment/],
  ['cheatsheet', /Git Cheat Sheet/],
  ['glossary', /Glossary/],
  ['resources', /Resources/],
  ['bookmarks', /Bookmarks/],
];

test('every top-level page loads without console errors', async ({ page }) => {
  const c = watchConsole(page);
  for (const [path, heading] of PAGES) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first(), path).toHaveText(heading);
  }
  c.expectClean();
});

test('every sidebar link navigates to a working page', async ({ page }) => {
  const c = watchConsole(page);
  await page.goto('./');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  const links = await nav.getByRole('link').all();
  const hrefs = [...new Set(await Promise.all(links.map((l) => l.getAttribute('href'))))];
  expect(hrefs.length).toBeGreaterThanOrEqual(22);
  for (const href of hrefs) {
    await page.goto(href!.replace(/^\/gitmasteracademy\/?/, './'));
    await expect(page.getByRole('heading', { level: 1 }).first(), href!).toBeVisible();
    await expect(page.getByText('Page not found')).toHaveCount(0);
  }
  c.expectClean();
});

for (const m of MODULES) {
  test(`all lessons of module ${m.number} render`, async ({ page }) => {
    const c = watchConsole(page);
    await page.goto(`learn/${m.id}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(m.title);
    for (const l of m.lessons) {
      await page.goto(`learn/${m.id}/${l.slug}`);
      await expect(page.getByRole('heading', { level: 1 }), l.slug).toHaveText(l.title);
      await expect(page.locator('#practice')).toBeVisible();
      await expect(page.locator('#sources')).toBeVisible();
    }
    c.expectClean();
  });
}

test('deep links survive a full reload and unknown routes show 404', async ({ page }) => {
  await page.goto('learn/m05/pushing');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pushing Changes');
  await page.goto('this/does/not/exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('previous / next lesson navigation', async ({ page }) => {
  await page.goto('learn/m01/git-and-github');
  await page.getByRole('navigation', { name: 'Lesson navigation' }).getByRole('link', { name: /Next/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('GitHub vs GitLab vs Bitbucket');
  await page.getByRole('navigation', { name: 'Lesson navigation' }).getByRole('link', { name: /Previous/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Git and GitHub: What They Are');
});
