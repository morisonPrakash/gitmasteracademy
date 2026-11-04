import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import m01 from '../../src/content/modules/m01/index';
import { clearStorage, watchConsole } from './helpers';

test.beforeEach(async ({ page }) => clearStorage(page));

test('mark complete and bookmark persist after reload and show on the dashboard', async ({ page }) => {
  await page.goto('learn/m01/what-is-head');
  await page.getByRole('button', { name: 'Mark as complete' }).click();
  await page.getByRole('button', { name: 'Bookmark' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Completed (undo)' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bookmarked' })).toBeVisible();
  await page.goto('./');
  await expect(page.getByText('1/140')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Resume learning' })).toBeVisible();
  await page.goto('bookmarks');
  await expect(page.getByRole('link', { name: /What Is HEAD\?/ })).toBeVisible();
});

test('exercise: hints, wrong answer, then correct answer marks it solved', async ({ page }) => {
  await page.goto('learn/m01/what-is-head');
  const ex = page.locator('section[aria-labelledby^="ex-"]', { has: page.getByRole('heading', { name: 'Name the commit' }) });
  await ex.getByRole('button', { name: 'Show a hint' }).click();
  await expect(ex.getByText('Hint 1:')).toBeVisible();
  await ex.getByLabel('Your command').fill('HEAD~3');
  await ex.getByRole('button', { name: 'Check my answer' }).click();
  await expect(ex.getByText('Not quite.')).toBeVisible();
  await ex.getByLabel('Your command').fill('HEAD~2');
  await ex.getByRole('button', { name: 'Check my answer' }).click();
  await expect(ex.getByText('Correct!')).toBeVisible();
  await expect(ex.getByText('Solved')).toBeVisible();
});

test('module quiz: answering everything correctly passes and is saved', async ({ page }) => {
  await page.goto('quizzes/m01');
  for (let i = 0; i < m01.quiz.length; i++) {
    const prompt = (await page.locator('#question').innerText()).trim();
    const q = m01.quiz.find((x) => prompt.startsWith(x.prompt.replace(/`/g, '').slice(0, 30)))!;
    expect(q, prompt).toBeDefined();
    if (q.kind === 'command') await page.locator('#quiz-cmd').fill(q.answers![0]);
    else await page.getByRole('radio', { name: q.options![q.correct!].replace(/`/g, '') }).check();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.getByText('Correct!')).toBeVisible();
    await page.getByRole('button', { name: /Next question|See results/ }).click();
  }
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await expect(page.getByText('Passed! Well done.')).toBeVisible();
  await page.getByRole('button', { name: 'Retake quiz' }).click();
  await expect(page.getByText('1 / 12')).toBeVisible();
  await page.goto('quizzes');
  await expect(page.getByLabel('Passed')).toHaveCount(1);
});

test('terminal: init, commit, branch and merge produce the expected graph', async ({ page }) => {
  const c = watchConsole(page);
  await page.goto('terminal');
  const input = page.getByLabel('Command input');
  for (const cmd of [
    'git init', 'echo "# Shop" > README.md', 'git add README.md', 'git commit -m "Initial commit"',
    'git switch -c feature/cart', 'echo "cart" > cart.txt', 'git add cart.txt', 'git commit -m "Add cart"',
    'git switch main', 'echo "v2" >> README.md', 'git commit -am "Update README"', 'git merge feature/cart',
  ]) {
    await input.fill(cmd);
    await input.press('Enter');
  }
  const log = page.getByRole('log', { name: 'Terminal output' });
  await expect(log).toContainText("Merge made by the 'ort' strategy.");
  await expect(page.getByText('Three-way merge')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Live commit graph' }).locator('circle')).toHaveCount(4);
  await input.fill('sudo shutdown now');
  await input.press('Enter');
  await expect(log).toContainText('safe Git simulation');
  c.expectClean();
});

test('simulator exercise is verified from the lesson page', async ({ page }) => {
  await page.goto('terminal?scenario=feature-ahead');
  const input = page.getByLabel('Command input');
  await expect(page.locator('p', { hasText: 'Feature branch ahead of main' })).toBeVisible();
  await input.fill('git switch main && git merge feature/login');
  await input.press('Enter');
  await page.goto('learn/m04/merging-basics');
  const ex = page.locator('section[aria-labelledby^="ex-"]', { has: page.getByRole('heading', { name: 'Merge a feature (simulator)' }) });
  await ex.getByRole('button', { name: 'Check my answer' }).click();
  await expect(ex.getByText('Correct!')).toBeVisible();
});

test('search finds lessons by content with the keyboard', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('Control+k');
  await page.getByLabel('Search query').fill('bisect');
  await expect(page.getByRole('option', { name: /git bisect/ }).first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/learn\//);
});

test('theme toggle persists across reloads', async ({ page }) => {
  await page.goto('./');
  const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  await page.getByRole('button', { name: dark ? 'Switch to light theme' : 'Switch to dark theme' }).click();
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(!dark);
});

for (const [name, path] of [['dashboard', './'], ['lesson', 'learn/m03/git-add'], ['terminal', 'terminal'], ['quiz', 'quizzes/m02'], ['cheat sheet', 'cheatsheet'], ['visualizer', 'visualizer']] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`accessibility: ${name} (${theme}) has no serious axe violations`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(path);
      await page.evaluate((t) => localStorage.setItem('gma:theme', t), theme);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
}
