import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { LocaleType } from '@univerjs/core'

export const LOCALE_MAP = {
  en:   LocaleType.EN_US,
  zhTW: LocaleType.ZH_TW,
  zhCN: LocaleType.ZH_CN,
}

// ── localStorage keys ─────────────────────────────────────────────────────────
const KEY_SNAPSHOT = 'tableau:snapshot'
const KEY_FILENAME = 'tableau:filename'

function readLocalSnapshot() {
  try {
    const raw = localStorage.getItem(KEY_SNAPSHOT)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLocalSnapshot(snapshot) {
  try {
    localStorage.setItem(KEY_SNAPSHOT, JSON.stringify(snapshot))
  } catch (e) {
    // Silently ignore QuotaExceededError — snapshot just won't persist this round
    if (e?.name !== 'QuotaExceededError') console.warn('[tableau] localStorage write failed', e)
  }
}

function clearLocal() {
  localStorage.removeItem(KEY_SNAPSHOT)
  localStorage.removeItem(KEY_FILENAME)
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useSpreadsheetStore = defineStore('spreadsheet', () => {
  const funiverRef         = ref(null)
  const univerRaw          = ref(null)
  const univerInstanceType = ref(null)

  // Initialise fileName from localStorage so it survives refresh
  const fileName = ref(localStorage.getItem(KEY_FILENAME) || 'untitled.xlsx')
  const isDirty  = ref(false)

  const title = computed(() =>
    isDirty.value ? `${fileName.value} •` : fileName.value
  )

  function setFUniver(instance) {
    funiverRef.value = instance
  }

  function setUniverRaw(instance, instanceType) {
    univerRaw.value          = instance
    univerInstanceType.value = instanceType
  }

  function syncUniverLocale(appLocaleKey) {
    const fWorkbook = funiverRef.value?.getActiveWorkbook()
    if (!fWorkbook) return
    const univerLocale = LOCALE_MAP[appLocaleKey]
    if (univerLocale) fWorkbook.setLocale(univerLocale)
  }

  function setFileName(name) {
    fileName.value = name
    localStorage.setItem(KEY_FILENAME, name)
  }

  function markDirty() {
    isDirty.value = true
  }

  function markClean() {
    isDirty.value = false
  }

  /** Clear in-memory state + localStorage (used by New File) */
  function reset() {
    fileName.value = 'untitled.xlsx'
    isDirty.value  = false
    clearLocal()
  }

  /** Load persisted snapshot from localStorage (called by SpreadsheetEditor on mount) */
  function loadSnapshot() {
    return readLocalSnapshot()
  }

  /** Persist the current workbook snapshot (called after every debounced edit & import) */
  function persistSnapshot(snapshot) {
    writeLocalSnapshot(snapshot)
  }

  return {
    funiverRef,
    univerRaw,
    univerInstanceType,
    fileName,
    isDirty,
    title,
    setFUniver,
    setUniverRaw,
    syncUniverLocale,
    setFileName,
    markDirty,
    markClean,
    reset,
    loadSnapshot,
    persistSnapshot,
  }
})
