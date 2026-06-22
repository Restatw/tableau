<template>
  <div class="app-layout">
    <!-- ── Toolbar ─────────────────────────────────────────────────────────── -->
    <header class="toolbar">
      <span class="toolbar-brand">{{ t('toolbar.brand') }}</span>

      <span
        class="toolbar-filename"
        :class="{ dirty: store.isDirty }"
        :title="store.fileName"
        @click="renameFile"
      >
        {{ store.fileName }}
      </span>

      <div class="toolbar-sep" />

      <!-- Undo / Redo -->
      <button class="btn btn-ghost btn-icon" :title="t('toolbar.undo')" :disabled="!store.funiverRef" @click="onUndo">
        <IconUndo />
      </button>
      <button class="btn btn-ghost btn-icon" :title="t('toolbar.redo')" :disabled="!store.funiverRef" @click="onRedo">
        <IconRedo />
      </button>

      <div class="toolbar-sep" />

      <button class="btn btn-ghost" @click="newFile">
        <IconNew />{{ t('toolbar.new') }}
      </button>

      <button class="btn btn-ghost" @click="onImport">
        <IconImport />{{ t('toolbar.import') }}
      </button>

      <button
        class="btn btn-primary"
        :disabled="!store.funiverRef"
        @click="onExport"
      >
        <IconExport />{{ t('toolbar.export') }}
      </button>

      <div class="toolbar-spacer" />

      <!-- Language selector -->
      <select class="lang-select" :value="locale" @change="onLocaleChange">
        <option value="en">{{ t('lang.en') }}</option>
        <option value="zhTW">{{ t('lang.zhTW') }}</option>
        <option value="zhCN">{{ t('lang.zhCN') }}</option>
      </select>

      <span class="toolbar-status">
        {{ store.isDirty ? t('toolbar.unsaved') : t('toolbar.saved') }}
      </span>
    </header>

    <!-- ── Editor ─────────────────────────────────────────────────────────── -->
    <main class="editor-wrap">
      <SpreadsheetEditor />
    </main>

    <!-- ── Toast ──────────────────────────────────────────────────────────── -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n }             from 'vue-i18n'
import { useSpreadsheetStore } from '@/stores/spreadsheet'
import { useFileIO }           from '@/composables/useFileIO'
import { useToast }            from '@/composables/useToast'
import SpreadsheetEditor       from '@/components/SpreadsheetEditor.vue'

// ── Inline SVG icons ─────────────────────────────────────────────────────────
const IconUndo = {
  template: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`,
}
const IconRedo = {
  template: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>`,
}
const IconNew = {
  template: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
}
const IconImport = {
  template: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
}
const IconExport = {
  template: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
}

// ─────────────────────────────────────────────────────────────────────────────

const { t, locale } = useI18n()
const store         = useSpreadsheetStore()
const { importFile, exportFile, blankSnapshot } = useFileIO()
const { toasts, success, error } = useToast()

// ── Undo / Redo ───────────────────────────────────────────────────────────────
function onUndo() { store.funiverRef?.undo() }
function onRedo() { store.funiverRef?.redo() }

// ── Language switch ───────────────────────────────────────────────────────────
function onLocaleChange(e) {
  locale.value = e.target.value
  store.syncUniverLocale(e.target.value)
}

// ── File operations ───────────────────────────────────────────────────────────
async function onImport() {
  if (!store.funiverRef || !store.univerRaw) return
  try {
    const name = await importFile(
      store.funiverRef,
      store.univerRaw,
      store.univerInstanceType,
      store.persistSnapshot,
    )
    store.setFileName(name)
    store.markClean()
    success(t('toast.imported', { name }))
  } catch (err) {
    if (err.message !== 'No file selected') error(t('toast.importError', { msg: err.message }))
  }
}

function onExport() {
  if (!store.funiverRef) return
  try {
    exportFile(store.funiverRef, store.fileName)
    store.markClean()
    success(t('toast.exported', { name: store.fileName }))
  } catch (err) {
    error(t('toast.exportError', { msg: err.message }))
  }
}

function newFile() {
  if (store.isDirty && !confirm(t('dialog.unsavedWarning'))) return
  if (!store.funiverRef || !store.univerRaw) return

  const wbId = store.funiverRef.getActiveWorkbook()?.getId()
  if (wbId) store.funiverRef.disposeUnit(wbId)
  store.univerRaw.createUnit(store.univerInstanceType.UNIVER_SHEET, blankSnapshot())
  store.reset()
  success(t('toast.newFile'))
}

function renameFile() {
  const name = prompt(t('dialog.rename'), store.fileName)
  if (!name?.trim()) return
  const trimmed = name.trim()
  store.setFileName(trimmed.endsWith('.xlsx') ? trimmed : `${trimmed}.xlsx`)
}
</script>
