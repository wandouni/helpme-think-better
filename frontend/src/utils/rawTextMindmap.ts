/**
 * Turn extracted text into a lightweight Markmap outline without changing the
 * original text.  This keeps the "原文提取" mode completely local (no AI call)
 * while still giving it a navigable map.
 */
const MAX_NODES = 180
const MAX_LABEL_LENGTH = 96

const isHeading = (line: string) =>
  /^(#{1,6}\s+|第[一二三四五六七八九十百千万0-9]+[章节篇部分]|[一二三四五六七八九十]+、|\d+(?:\.\d+){0,4}[、.．)）\s]|\(?[一二三四五六七八九十]+\)|[（(]\d+[)）])/.test(line)

const headingLevel = (line: string) => {
  const markdown = line.match(/^(#{1,6})\s+/)
  if (markdown) return markdown[1].length
  if (/^第[一二三四五六七八九十百千万0-9]+[章节篇部分]/.test(line)) return 2
  if (/^[一二三四五六七八九十]+、/.test(line)) return 3
  const numbered = line.match(/^(\d+(?:\.\d+)*)[、.．)）\s]/)
  if (numbered) return Math.min(numbered[1].split('.').length + 1, 6)
  return 3
}

const cleanLabel = (line: string) =>
  line
    .replace(/^#{1,6}\s+/, '')
    .replace(/^[-*+•]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_LABEL_LENGTH)

/** Returns Markmap-compatible Markdown while leaving `text` untouched. */
export function rawTextToMindmap(text: string, filename: string): string {
  const title = filename.replace(/\.[^.]+$/, '') || '原文'
  const lines = text
    .split(/\r?\n/)
    .map(cleanLabel)
    .filter(Boolean)

  if (!lines.length) return `# ${title}`

  const output = [`# ${title}`]
  let currentLevel = 1
  let nodeCount = 0
  let section = 1

  for (const line of lines) {
    if (nodeCount >= MAX_NODES) break

    if (isHeading(line)) {
      const level = headingLevel(line)
      output.push(`${'#'.repeat(level)} ${line}`)
      currentLevel = level
      nodeCount += 1
      continue
    }

    // Plain-text extraction often has no headings. Group it into readable
    // sections so a long document does not become one flat, unusable map.
    if (nodeCount > 0 && nodeCount % 18 === 0) {
      output.push(`## 内容片段 ${section++}`)
      currentLevel = 2
    }
    output.push(`${'#'.repeat(Math.min(currentLevel + 1, 6))} ${line}`)
    nodeCount += 1
  }

  if (lines.length > MAX_NODES) {
    output.push(`## 其余内容\n### 为保证导图可读性，已展示前 ${MAX_NODES} 个文本节点`)
  }

  return output.join('\n')
}
