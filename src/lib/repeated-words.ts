const EXCLUDED_ES = {
  prepositions:
    'a al ante bajo cabe con contra de del desde durante en entre excepto hacia hasta mediante para por salvo segun según sin so sobre tras versus via vía',
  articles: 'el la los las lo un una unos unas',
  conjunctions:
    'y e ni o u pero sino mas aunque porque pues que si como cuando donde mientras entonces luego',
  pronouns:
    'yo tú tu vos él ella ello nosotros nosotras vosotros vosotras ellos ellas usted ustedes me te se nos os le les conmigo contigo consigo',
  possessives:
    'mi mis tus su sus nuestro nuestra nuestros nuestras vuestro vuestra vuestros vuestras mío mía míos mías tuyo tuya tuyos tuyas suyo suya suyos suyas',
  demonstratives:
    'este esta estos estas ese esa esos esas aquel aquella aquellos aquellas esto eso aquello',
  interrogatives:
    'qué quién quien quienes quiénes cuál cual cuales cuáles cuyo cuya cuyos cuyas cómo dónde cuándo cuánto cuánta cuántos cuántas',
  verbs:
    'es son era eran fue fueron ser sea sean soy eres somos sido está están estar estoy estás estamos estaba estaban estado ha han he has hemos había habían haber hay',
  adverbs:
    'no sí ya muy más menos también tampoco tan tanto así aquí allí ahí acá allá bien solo sólo',
  quantifiers:
    'todo toda todos todas otro otra otros otras cada algo nada alguien nadie algún alguno alguna algunos algunas ningún ninguno ninguna mismo misma mismos mismas',
}

const EXCLUDED_EN = {
  prepositions:
    'aboard about above across after against along amid among around as at before behind below beneath beside besides between beyond by concerning despite down during except for from in inside into like near of off on onto opposite out outside over past per regarding round since than through throughout till to toward towards under underneath unlike until up upon with within without',
  articles: 'a an the',
  conjunctions:
    'and or but nor so yet if because although though while whether that then',
  pronouns:
    'i you he she it we they me him her us them myself yourself himself herself itself ourselves yourselves themselves',
  possessives: 'my your his its our their mine yours hers ours theirs',
  demonstratives: 'this these those there here',
  interrogatives: 'what which who whom whose when where why how',
  verbs:
    'is are was were be been being am do does did have has had will would can could shall should may might must',
  contractions:
    "i'm you're he's she's it's we're they're i've you've we've they've i'll you'll he'll she'll we'll they'll i'd you'd he'd she'd we'd they'd isn't aren't wasn't weren't don't doesn't didn't haven't hasn't hadn't won't wouldn't can't couldn't shouldn't that's there's what's let's",
  adverbs: 'not no yes very just also too only',
  quantifiers: 'all any some each every more most other such',
}

// Acute, grave and diaeresis only: the tilde stays so "año" and "ano" differ
const ACCENT_MARKS = /[\u0300\u0301\u0308]/g

function normalize(word: string) {
  return word
    .toLocaleLowerCase()
    .replaceAll('’', "'")
    .normalize('NFD')
    .replace(ACCENT_MARKS, '')
    .normalize('NFC')
}

const EXCLUDED_WORDS = new Set(
  [...Object.values(EXCLUDED_ES), ...Object.values(EXCLUDED_EN)].flatMap(
    (words) => words.split(' ').map(normalize),
  ),
)

const WORD_PATTERN = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu

const BLOCK_TAGS = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'DIV',
  'DL',
  'DT',
  'DD',
  'FIGURE',
  'FOOTER',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HR',
  'LI',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'TD',
  'TH',
  'TR',
  'UL',
])

export type RepeatedWord = {
  key: string
  word: string
  variants: string[]
  count: number
}

type Segment = {
  node: Text
  start: number
}

export type IndexedText = {
  text: string
  segments: Segment[]
}

function closestBlock(node: Node, root: HTMLElement): Node {
  let current = node.parentNode
  while (current && current !== root) {
    if (current instanceof HTMLElement && BLOCK_TAGS.has(current.tagName)) {
      return current
    }
    current = current.parentNode
  }
  return root
}

// Flattens the editor's text nodes into one string, inserting line breaks
// between blocks so words on different lines never merge.
export function indexText(root: HTMLElement): IndexedText {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  )
  const segments: Segment[] = []
  let text = ''
  let previousBlock: Node | null = null

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof HTMLBRElement) {
      text += '\n'
      continue
    }
    if (!(node instanceof Text) || node.data.length === 0) continue

    const block = closestBlock(node, root)
    if (previousBlock && block !== previousBlock) text += '\n'
    previousBlock = block

    segments.push({ node, start: text.length })
    text += node.data
  }

  return { text, segments }
}

export function findRepeatedWords(text: string): RepeatedWord[] {
  const spellingsByKey = new Map<string, Map<string, number>>()
  for (const match of text.matchAll(WORD_PATTERN)) {
    const key = normalize(match[0])
    if (EXCLUDED_WORDS.has(key)) continue
    const spelling = match[0].toLocaleLowerCase().replaceAll('’', "'")
    const spellings = spellingsByKey.get(key) ?? new Map<string, number>()
    spellings.set(spelling, (spellings.get(spelling) ?? 0) + 1)
    spellingsByKey.set(key, spellings)
  }

  const repeated: RepeatedWord[] = []
  for (const [key, spellings] of spellingsByKey) {
    // Most frequent spelling first; ties keep the first one seen
    const [word, ...variants] = [...spellings]
      .sort(([, a], [, b]) => b - a)
      .map(([spelling]) => spelling)
    const count = [...spellings.values()].reduce((sum, n) => sum + n, 0)
    if (count > 1) repeated.push({ key, word, variants, count })
  }

  return repeated.sort(
    (a, b) =>
      [...b.key].length - [...a.key].length ||
      b.count - a.count ||
      a.key.localeCompare(b.key, 'es'),
  )
}

function locate(
  segments: Segment[],
  index: number,
  isEnd: boolean,
): [Text, number] | null {
  let low = 0
  let high = segments.length - 1
  while (low <= high) {
    const mid = (low + high) >> 1
    const { node, start } = segments[mid]
    const end = start + node.data.length
    if (index < start || (isEnd && index === start)) {
      high = mid - 1
    } else if (index > end || (!isEnd && index === end)) {
      low = mid + 1
    } else {
      return [node, index - start]
    }
  }
  return null
}

const HIGHLIGHT_NAME = 'repeated-word'

export function highlightWord(indexed: IndexedText | null, key: string | null) {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) return
  if (!indexed || !key) {
    CSS.highlights.delete(HIGHLIGHT_NAME)
    return
  }
  CSS.highlights.set(
    HIGHLIGHT_NAME,
    new Highlight(...findWordRanges(indexed, key)),
  )
}

function findWordRanges(indexed: IndexedText, key: string): Range[] {
  const ranges: Range[] = []
  for (const match of indexed.text.matchAll(WORD_PATTERN)) {
    if (normalize(match[0]) !== key) continue
    const start = locate(indexed.segments, match.index, false)
    const end = locate(indexed.segments, match.index + match[0].length, true)
    if (!start || !end) continue

    const range = document.createRange()
    range.setStart(...start)
    range.setEnd(...end)
    ranges.push(range)
  }
  return ranges
}
