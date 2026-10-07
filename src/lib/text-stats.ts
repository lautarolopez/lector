export type TextStats = {
  words: number
  characters: number
}

export function countText(text: string): TextStats {
  const words = text
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length
  const characters = [...text.replace(/\n/g, '')].length
  return { words, characters }
}
