import { expect, type Page } from '@playwright/test';

/** Collect console errors and page errors so every test can assert a clean console. */
export function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return {
    errors,
    expectClean: () => expect(errors, errors.join('\n')).toEqual([]),
  };
}

export async function clearStorage(page: Page) {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
}
