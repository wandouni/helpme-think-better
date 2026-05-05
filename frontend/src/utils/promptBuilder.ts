const COMPLEX_PATTERN = /[\d%＄￥,，;；、]/

export function buildPrompt(content: string): string {
  const trimmed = content.trim()
  const isSimple = trimmed.length <= 30 && !COMPLEX_PATTERN.test(trimmed)
  return isSimple
    ? `${trimmed}\n解释一下`
    : `${trimmed}\n结合数据或者例子解释，方便记忆和理解`
}
