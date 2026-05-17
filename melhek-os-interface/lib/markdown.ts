'use client'

// ─── Lightweight Markdown Renderer ──────────────────────────
// No external deps — pure regex transforms
export function renderMarkdown(md: string): string {
  return md
    // Code blocks (must be before inline code)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="md-pre"><code class="md-code">${escHtml(code.trim())}</code></pre>`)
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    // Bold + italic combined
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="md-bold">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em class="md-em">$1</em>')
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<del class="md-del">$1</del>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener">$1</a>')
    // Images
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="md-img" />')
    // HR
    .replace(/^---$/gm, '<hr class="md-hr" />')
    // Unordered lists
    .replace(/^\s*[-*+] (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/(<li class="md-li">[\s\S]+?<\/li>)/g, '<ul class="md-ul">$1</ul>')
    // Ordered lists
    .replace(/^\s*\d+\. (.+)$/gm, '<li class="md-oli">$1</li>')
    .replace(/(<li class="md-oli">[\s\S]+?<\/li>)/g, '<ol class="md-ol">$1</ol>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
    // Paragraphs (double newline)
    .replace(/\n\n(?!<)/g, '</p><p class="md-p">')
    // Wrap in paragraph
    .replace(/^(?!<)(.+)$/gm, (line) =>
      line.startsWith('<') ? line : `<span>${line}</span>`)
    // Single line breaks
    .replace(/\n/g, '<br />')
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
