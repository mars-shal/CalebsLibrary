// Shared citation templates — framework-free.
// Ported from src/views/PaperView.vue (citations computed). URL canonical:
// calebslibrary.org/paper/<id>.

export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'BibTeX';

export function buildCitations(args: {
  contributorName: string;
  year: number;
  title: string;
  subtitle: string;
  paperId: string;
}): Record<CitationStyle, string> {
  const { contributorName, year, title, subtitle, paperId } = args;
  return {
    APA: `${contributorName}. (${year}). ${title}: ${subtitle}. Caleb's Library.`,
    MLA: `${contributorName}. "${title}." ${subtitle}, Caleb's Library, ${year}.`,
    Chicago: `${contributorName}. "${title}." ${subtitle}. Caleb's Library, ${year}.`,
    BibTeX: `@misc{${paperId},\n  author = {${contributorName}},\n  title  = {${title}},\n  year   = {${year}},\n  note   = {${subtitle}},\n  url    = {calebslibrary.org/paper/${paperId}}\n}`,
  };
}
