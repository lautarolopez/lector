// Browsers inline the theme's text color into edited/copied markup; it isn't user formatting
const THEME_TEXT_COLORS = new Set(['rgb(42, 42, 53)', 'rgb(226, 226, 218)'])

function stripBackgrounds(root: HTMLElement) {
  for (const el of root.querySelectorAll<HTMLElement>('[style], [bgcolor]')) {
    el.removeAttribute('bgcolor')
    el.style.removeProperty('background')
    el.style.removeProperty('background-color')
    el.style.removeProperty('background-image')
    if (THEME_TEXT_COLORS.has(el.style.color)) el.style.removeProperty('color')
    if (!el.getAttribute('style')?.trim()) el.removeAttribute('style')
  }
}

function wrapWithEditorFont(container: HTMLElement, editor: HTMLElement) {
  const { fontFamily, fontSize } = getComputedStyle(editor)
  const wrapper = document.createElement('div')
  wrapper.style.fontFamily = fontFamily
  wrapper.style.fontSize = fontSize
  wrapper.append(...container.childNodes)
  return wrapper.outerHTML
}

export function getEditorHtml(editor: HTMLElement): string {
  const clone = editor.cloneNode(true) as HTMLElement
  stripBackgrounds(clone)
  return wrapWithEditorFont(clone, editor)
}

/** Selected markup, re-wrapped in its ancestors inside `boundary` so bold/alignment survive. */
export function getSelectionHtml(range: Range, boundary: HTMLElement): string {
  let content: Node = range.cloneContents()
  let node: Node | null = range.commonAncestorContainer
  if (node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode

  while (node && node !== boundary && boundary.contains(node)) {
    const wrapper = node.cloneNode(false)
    wrapper.appendChild(content)
    content = wrapper
    node = node.parentNode
  }

  const container = document.createElement('div')
  container.appendChild(content)
  stripBackgrounds(container)
  return wrapWithEditorFont(container, boundary)
}
