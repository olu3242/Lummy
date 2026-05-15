export type SemanticDocument = { id: string; content: string; tags: string[] }

export const semanticSearch = (query: string, docs: SemanticDocument[]): SemanticDocument[] => {
  const lowered = query.toLowerCase()
  return docs.filter((doc) => doc.content.toLowerCase().includes(lowered) || doc.tags.some((tag) => tag.toLowerCase().includes(lowered)))
}
