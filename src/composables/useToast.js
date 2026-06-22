import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

export function useToast() {
  function show(message, type = 'info', duration = 3000) {
    const id = ++nextId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  const success = (msg) => show(msg, 'success')
  const error   = (msg) => show(msg, 'error', 4500)
  const info    = (msg) => show(msg, 'info')

  return { toasts, success, error, info }
}
