import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'

type SuggestionType = 'paper' | 'subject' | 'course'

type SuggestionItem = {
  readonly text: string
  readonly type: SuggestionType
  readonly icon: string
}

const MIN_QUERY_LENGTH = 2
const MAX_SUGGESTIONS = 6
// Per-type cap, applied before the final slice. Papers outnumber subjects and
// courses by a wide margin, so slicing the concatenated list first left a
// subject or course unreachable for any query that filled the cap from papers.
const MAX_PER_TYPE = 3
// Focus leaves the input before a click on a suggestion resolves, so the
// dropdown closes on a short deferral rather than synchronously — otherwise
// the row unmounts before its click lands.
const BLUR_DEFER_MS = 120

// Module-scoped so the search box keeps its text when the home view
// remounts on navigation instead of resetting to a fresh "reloaded" state.
const query = ref('')

// TopStrip and SearchView each render a combobox, and both can be mounted at
// once (/search puts the strip above the big box). Ids must not collide, and
// keyboard focus movement fires no pointerdown for an outside-click close to
// catch, so "only one dropdown open" is tracked here rather than per instance.
let instanceCount = 0
let openDropdownOwner: { instanceId: number; close: () => void } | null = null

// Match quality, best first: exact, then prefix, then mid-string substring.
function matchRank(text: string, normalizedQuery: string): number {
  const normalized = text.toLowerCase()
  if (normalized === normalizedQuery) return 0
  if (normalized.startsWith(normalizedQuery)) return 1
  return 2
}

export function useSearchAutocomplete() {
  const router = useRouter()
  const drive = useDriveStore()

  instanceCount += 1
  const instanceId = instanceCount
  const listboxId = `search-listbox-${instanceId}`

  const showDropdown = ref(false)
  const highlightedIndex = ref(-1)
  // Whether the current highlight came from an arrow key. Enter accepts a
  // suggestion only when this is true, so typing a query and pressing Enter
  // searches the query rather than whichever row happens to be pointed at.
  const highlightedByKeyboard = ref(false)
  const containerRef = ref<HTMLElement | null>(null)

  // The deferred blur close, held so a re-open cancels it: without this, tabbing
  // away and back inside BLUR_DEFER_MS reopened the dropdown at focus and then
  // closed it again when the stale timer fired.
  let blurTimer: ReturnType<typeof setTimeout> | null = null

  function cancelPendingBlurClose(): void {
    if (blurTimer === null) return
    clearTimeout(blurTimer)
    blurTimer = null
  }

  const allSuggestions = computed<readonly SuggestionItem[]>(() => [
    ...drive.papers.map((paper) => ({
      text: paper.title,
      type: 'paper',
      icon: 'book',
    }) satisfies SuggestionItem),
    ...drive.subjects.map((subject) => ({
      text: subject.name,
      type: 'subject',
      icon: 'grid',
    }) satisfies SuggestionItem),
    ...drive.courses.map((course) => ({
      text: course.displayName || course.name,
      type: 'course',
      icon: 'list',
    }) satisfies SuggestionItem),
  ])

  const suggestions = computed<readonly SuggestionItem[]>(() => {
    const normalizedQuery = query.value.trim().toLowerCase()
    if (normalizedQuery.length < MIN_QUERY_LENGTH) return []

    const matches = allSuggestions.value.filter((suggestion) =>
      suggestion.text.toLowerCase().includes(normalizedQuery),
    )

    const TYPES: readonly SuggestionType[] = ['paper', 'subject', 'course']

    // Cap each type before the final slice so a subject or course is never
    // squeezed out by the (far more numerous) papers, then order tier-major:
    // every exact match, then every prefix match, then mid-string hits. Papers
    // before subjects before courses within a tier keeps the badges reading in
    // a consistent order.
    const capped = new Map<SuggestionType, SuggestionItem[]>()
    for (const type of TYPES) {
      capped.set(
        type,
        matches.filter((suggestion) => suggestion.type === type).slice(0, MAX_PER_TYPE),
      )
    }

    const ordered: SuggestionItem[] = []
    for (let rank = 0; rank <= 2; rank++) {
      for (const type of TYPES) {
        for (const suggestion of capped.get(type) ?? []) {
          if (matchRank(suggestion.text, normalizedQuery) === rank) ordered.push(suggestion)
        }
      }
    }
    return ordered.slice(0, MAX_SUGGESTIONS)
  })

  const activeOptionId = computed<string | undefined>(() =>
    highlightedIndex.value === -1 ? undefined : optionId(highlightedIndex.value),
  )

  function optionId(index: number): string {
    return `${listboxId}-option-${index}`
  }

  // Registers this instance as the one holding an open dropdown, closing any
  // other instance's first. Keyboard focus movement fires no pointerdown, so
  // the outside-click close cannot catch the strip and the big box trading focus.
  function claimDropdown(): void {
    if (openDropdownOwner && openDropdownOwner.instanceId !== instanceId) openDropdownOwner.close()
    openDropdownOwner = { instanceId, close: closeDropdown }
    cancelPendingBlurClose()
  }

  function closeDropdown(): void {
    cancelPendingBlurClose()
    if (openDropdownOwner && openDropdownOwner.instanceId === instanceId) openDropdownOwner = null
    showDropdown.value = false
    highlightedIndex.value = -1
    highlightedByKeyboard.value = false
  }

  function refreshDropdown(): void {
    showDropdown.value = query.value.trim().length >= MIN_QUERY_LENGTH && suggestions.value.length > 0
    if (showDropdown.value) claimDropdown()
    // Opening the list must never leave a row looking pre-selected: typing
    // used to pin index 0, so Enter silently searched suggestion #1 instead of
    // the typed query.
    highlightedIndex.value = -1
    highlightedByKeyboard.value = false
  }

  /**
   * Focus closes any other instance's dropdown, since tabbing between the two
   * boxes fires no pointerdown for the outside-click close to catch, then
   * re-shows this instance's own open dropdown and nothing more. `query` is
   * module-scoped, so evaluating it unconditionally popped a dropdown on a bare
   * click into a box the user never typed into.
   */
  function handleFocus(): void {
    if (openDropdownOwner && openDropdownOwner.instanceId !== instanceId) openDropdownOwner.close()
    if (showDropdown.value) refreshDropdown()
  }

  function onInput(event?: Event): void {
    if (event?.target instanceof HTMLInputElement) {
      query.value = event.target.value
    }
    refreshDropdown()
  }

  function navigateToSearch(text: string): void {
    const trimmed = text.trim()
    if (!trimmed) return
    drive.recordSearch(trimmed)
    closeDropdown()
    router.push({ name: 'search', query: { q: trimmed } })
  }

  function selectSuggestion(text: string): void {
    query.value = text
    navigateToSearch(text)
  }

  // Whichever mechanism moved the highlight last decides whether Enter accepts a
  // row, so hover moves it for the eye without arming the keyboard path: after
  // hovering, Enter still searches the typed query.
  function hoverSuggestion(index: number): void {
    highlightedIndex.value = index
    highlightedByKeyboard.value = false
  }

  function handleKeydown(event: KeyboardEvent): void {
    const suggestionCount = suggestions.value.length

    if (event.key === 'ArrowDown') {
      if (!suggestionCount) return
      event.preventDefault()
      showDropdown.value = true
      claimDropdown()
      highlightedIndex.value = (highlightedIndex.value + 1) % suggestionCount
      highlightedByKeyboard.value = true
      return
    }

    if (event.key === 'ArrowUp') {
      if (!suggestionCount) return
      event.preventDefault()
      showDropdown.value = true
      claimDropdown()
      highlightedIndex.value = highlightedIndex.value <= 0 ? suggestionCount - 1 : highlightedIndex.value - 1
      highlightedByKeyboard.value = true
      return
    }

    if (event.key === 'Enter') {
      const selected = suggestions.value[highlightedIndex.value]
      if (showDropdown.value && highlightedByKeyboard.value && selected) {
        event.preventDefault()
        selectSuggestion(selected.text)
        return
      }
      navigateToSearch(query.value)
      return
    }

    if (event.key === 'Escape') {
      closeDropdown()
    }
  }

  function handleBlur(): void {
    cancelPendingBlurClose()
    blurTimer = setTimeout(() => {
      blurTimer = null
      closeDropdown()
    }, BLUR_DEFER_MS)
  }

  function handleDocumentPointerDown(event: PointerEvent): void {
    const target = event.target
    if (target instanceof Node && containerRef.value && !containerRef.value.contains(target)) {
      closeDropdown()
    }
  }

  onMounted(() => {
    document.addEventListener('pointerdown', handleDocumentPointerDown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', handleDocumentPointerDown)
    cancelPendingBlurClose()
    // The router keys SearchView on route.fullPath, so every navigation mounts a
    // new instance and leaves the previous id behind. A stale registration would
    // keep a dead instance's dropdown alive forever and block the next one.
    if (openDropdownOwner && openDropdownOwner.instanceId === instanceId) openDropdownOwner = null
  })

  return {
    query,
    suggestions,
    showDropdown,
    highlightedIndex,
    listboxId,
    optionId,
    activeOptionId,
    selectSuggestion,
    hoverSuggestion,
    handleKeydown,
    handleFocus,
    handleBlur,
    containerRef,
    onInput,
  }
}
