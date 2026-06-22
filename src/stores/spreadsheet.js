import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { LocaleType } from '@univerjs/core'

// Map vue-i18n locale key → Univer LocaleType
export const LOCALE_MAP = {
  en:   LocaleType.EN_US,
  zhTW: LocaleType.ZH_TW,
  zhCN: LocaleType.ZH_CN,
}

export const useSpreadsheetStore = defineStore('spreadsheet', () => {
  const funiverRef         = ref(null)
  const univerRaw          = ref(null)
  const univerInstanceType = ref(null)

  const fileName = ref('untitled.xlsx')
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

  /** Called when user switches app language to keep Univer in sync */
  function syncUniverLocale(appLocaleKey) {
    const fWorkbook = funiverRef.value?.getActiveWorkbook()
    if (!fWorkbook) return
    const univerLocale = LOCALE_MAP[appLocaleKey]
    if (univerLocale) fWorkbook.setLocale(univerLocale)
  }

  function setFileName(name) {
    fileName.value = name
  }

  function markDirty() {
    isDirty.value = true
  }

  function markClean() {
    isDirty.value = false
  }

  function reset() {
    fileName.value = 'untitled.xlsx'
    isDirty.value  = false
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
  }
})
