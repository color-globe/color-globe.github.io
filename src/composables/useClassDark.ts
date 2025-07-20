// composables/useClassDark.ts
import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useClassDark(selector = 'html', darkClass = 'dark') {
  const isDark = ref(false)
  let observer: MutationObserver | null = null

  onMounted(() => {
    const el = document.querySelector(selector)
    if (!el) return

    const update = () => {
      isDark.value = el.classList.contains(darkClass)
    }

    observer = new MutationObserver(update)
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })

    update() // initial check
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  return isDark
}
