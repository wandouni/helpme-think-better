/** Approximate total node count from mindmap markdown */
export function countNodes(md: string): number {
  return (md.match(/^(#{1,6} |- |\* )/gm) ?? []).length
}
