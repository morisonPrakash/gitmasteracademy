import { fullIndex, search } from '@/features/search/searchIndex';

describe('search ranking', () => {
  it.each([['bisect', 'git bisect'], ['rebase', 'git rebase'], ['staging area', 'Working Directory and Staging Area'], ['pull request', 'm07/']])(
    '"%s" puts the lesson "%s" first',
    async (q, title) => {
      const hits = search(await fullIndex(), q);
      const top = hits[0].doc;
      expect(top.title === title || top.id.startsWith(title), `${top.id} ${top.title}`).toBe(true);
    },
  );
  it('finds glossary terms and cheat sheet commands too', async () => {
    const hits = search(await fullIndex(), 'force-with-lease', 30);
    expect(hits.some((h) => h.doc.context === 'Git Cheat Sheet')).toBe(true);
  });
});
