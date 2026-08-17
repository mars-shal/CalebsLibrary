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

export function useSearchAutocomplete() {
  const router = useRouter()
  const drive = useDriveStore()

  const query = ref('')
  const showDropdown = ref(false)
  const highlightedIndex = ref(-1)
  const containerRef = ref<HTMLElement | null>(null)

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

    return allSuggestions.value
      .filter((suggestion) => suggestion.text.toLowerCase().includes(normalizedQuery))
      .slice(0, MAX_SUGGESTIONS)
  })

  function closeDropdown(): void {
    showDropdown.value = false
    highlightedIndex.value = -1
  }

  function refreshDropdown(): void {
    showDropdown.value = query.value.trim().length >= MIN_QUERY_LENGTH && suggestions.value.length > 0
    highlightedIndex.value = showDropdown.value ? 0 : -1
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
    closeDropdown()
    router.push({ name: 'search', query: { q: trimmed } })
  }

  function selectSuggestion(text: string): void {
    query.value = text
    navigateToSearch(text)
  }

  function handleKeydown(event: KeyboardEvent): void {
    const suggestionCount = suggestions.value.length

    if (event.key === 'ArrowDown') {
      if (!suggestionCount) return
      event.preventDefault()
      showDropdown.value = true
      highlightedIndex.value = (highlightedIndex.value + 1) % suggestionCount
      return
    }

    if (event.key === 'ArrowUp') {
      if (!suggestionCount) return
      event.preventDefault()
      showDropdown.value = true
      highlightedIndex.value = highlightedIndex.value <= 0 ? suggestionCount - 1 : highlightedIndex.value - 1
      return
    }

    if (event.key === 'Enter') {
      const selected = suggestions.value[highlightedIndex.value]
      if (showDropdown.value && selected) {
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
  })

  return {
    query,
    suggestions,
    showDropdown,
    highlightedIndex,
    selectSuggestion,
    handleKeydown,
    containerRef,
    onInput,
  }
}
