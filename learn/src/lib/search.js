// Search over the generated index. Diacritics are folded, so `cau truc` finds
// `cấu trúc`, and the title weighs more than a heading, which weighs more than
// the summary.

const fold = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

let prepared = null;

export const prepareIndex = (index, chaptersById, trackByChapter) => {
  prepared = index.map((entry) => ({
    ...entry,
    haystack: {
      title: fold(entry.t),
      summary: fold(entry.s),
      headings: (entry.h || []).map(fold),
    },
    chapterLabel: chaptersById[entry.c]?.label || entry.c,
    track: trackByChapter[entry.tr] || entry.tr,
  }));
  return prepared;
};

export const search = (entries, query, lang = "vi") => {
  const source = (entries || prepared || []).filter(Boolean);
  const needle = fold(query).trim();
  if (!needle) {
    return source.map((entry) => ({ ...entry, title: entry.t, score: 0 })).slice(0, 30);
  }
  const words = needle.split(/\s+/).filter(Boolean);
  const results = [];
  for (const entry of source) {
    const title = entry.haystack ? entry.haystack.title : fold(entry.t);
    const summary = entry.haystack ? entry.haystack.summary : fold(entry.s);
    const headings = entry.haystack ? entry.haystack.headings : (entry.h || []).map(fold);

    let score = 0;
    if (title === needle) score += 120;
    if (title.includes(needle)) score += 60;
    if (title.startsWith(needle)) score += 25;
    for (const word of words) {
      if (title.includes(word)) score += 18;
      if (headings.some((heading) => heading.includes(word))) score += 10;
      if (summary.includes(word)) score += 4;
    }
    if (score === 0) continue;

    // Report the heading that matched, so a result can point into the page.
    const headingIndex = headings.findIndex((heading) => heading.includes(needle) || words.some((word) => heading.includes(word)));
    results.push({
      ...entry,
      score,
      title: entry.t,
      heading: headingIndex >= 0 ? entry.h[headingIndex] : null,
      chapterLabel: entry.chapterLabel || entry.c,
      track: entry.track || entry.tr,
      lang,
    });
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
};
