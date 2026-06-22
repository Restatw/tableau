<template>
  <div id="univer-container" class="univer-container" />
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useSpreadsheetStore } from '@/stores/spreadsheet'
import { useFileIO } from '@/composables/useFileIO'

// ── Univer core ──────────────────────────────────────────────────────────────
import { Univer, UniverInstanceType, LocaleType } from '@univerjs/core'
import { defaultTheme } from '@univerjs/design'
import { UniverRenderEnginePlugin }     from '@univerjs/engine-render'
import { UniverFormulaEnginePlugin }    from '@univerjs/engine-formula'
import { UniverUIPlugin }               from '@univerjs/ui'
import { UniverDocsPlugin }             from '@univerjs/docs'
import { UniverDocsUIPlugin }           from '@univerjs/docs-ui'
import { UniverSheetsPlugin }           from '@univerjs/sheets'
import { UniverSheetsUIPlugin }         from '@univerjs/sheets-ui'
import { UniverSheetsFormulaPlugin }    from '@univerjs/sheets-formula'
import { UniverSheetsFormulaUIPlugin }  from '@univerjs/sheets-formula-ui'
import { UniverSheetsNumfmtPlugin }     from '@univerjs/sheets-numfmt'
import { FUniver }                      from '@univerjs/facade'

// ── Locale data (Univer's own i18n, separate from vue-i18n) ─────────────────
import DesignEnUS       from '@univerjs/design/locale/en-US'
import UIEnUS           from '@univerjs/ui/locale/en-US'
import DocsUIEnUS       from '@univerjs/docs-ui/locale/en-US'
import SheetsEnUS       from '@univerjs/sheets/locale/en-US'
import SheetsUIEnUS     from '@univerjs/sheets-ui/locale/en-US'
import SheetsFormulaEnUS    from '@univerjs/sheets-formula/locale/en-US'
import SheetsFormulaUIEnUS  from '@univerjs/sheets-formula-ui/locale/en-US'

import DesignZhCN       from '@univerjs/design/locale/zh-CN'
import UIZhCN           from '@univerjs/ui/locale/zh-CN'
import DocsUIZhCN       from '@univerjs/docs-ui/locale/zh-CN'
import SheetsZhCN       from '@univerjs/sheets/locale/zh-CN'
import SheetsUIZhCN     from '@univerjs/sheets-ui/locale/zh-CN'
import SheetsFormulaZhCN    from '@univerjs/sheets-formula/locale/zh-CN'
import SheetsFormulaUIZhCN  from '@univerjs/sheets-formula-ui/locale/zh-CN'

import DesignZhTW       from '@univerjs/design/locale/zh-TW'
import UIZhTW           from '@univerjs/ui/locale/zh-TW'
import DocsUIZhTW       from '@univerjs/docs-ui/locale/zh-TW'
import SheetsZhTW       from '@univerjs/sheets/locale/zh-TW'
import SheetsUIZhTW     from '@univerjs/sheets-ui/locale/zh-TW'
import SheetsFormulaZhTW    from '@univerjs/sheets-formula/locale/zh-TW'
import SheetsFormulaUIZhTW  from '@univerjs/sheets-formula-ui/locale/zh-TW'

// ── CSS ──────────────────────────────────────────────────────────────────────
import '@univerjs/design/lib/index.css'
import '@univerjs/ui/lib/index.css'
import '@univerjs/docs-ui/lib/index.css'
import '@univerjs/sheets-ui/lib/index.css'
import '@univerjs/sheets-formula-ui/lib/index.css'

// ────────────────────────────────────────────────────────────────────────────

const store         = useSpreadsheetStore()
const { blankSnapshot } = useFileIO()

function mergeLocale(...parts) {
  return Object.assign({}, ...parts)
}

const LOCALES = {
  [LocaleType.EN_US]: mergeLocale(
    DesignEnUS, UIEnUS, DocsUIEnUS,
    SheetsEnUS, SheetsUIEnUS, SheetsFormulaEnUS, SheetsFormulaUIEnUS,
  ),
  [LocaleType.ZH_CN]: mergeLocale(
    DesignZhCN, UIZhCN, DocsUIZhCN,
    SheetsZhCN, SheetsUIZhCN, SheetsFormulaZhCN, SheetsFormulaUIZhCN,
  ),
  [LocaleType.ZH_TW]: mergeLocale(
    DesignZhTW, UIZhTW, DocsUIZhTW,
    SheetsZhTW, SheetsUIZhTW, SheetsFormulaZhTW, SheetsFormulaUIZhTW,
  ),
}

let univerInstance = null
let _saveTimer    = null

function scheduleSave(fUniver) {
  clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    const snapshot = fUniver.getActiveWorkbook()?.getSnapshot()
    if (snapshot) store.persistSnapshot(snapshot)
  }, 1500)
}

onMounted(() => {
  univerInstance = new Univer({
    theme: defaultTheme,
    locale: LocaleType.EN_US,
    locales: LOCALES,
  })

  univerInstance.registerPlugin(UniverRenderEnginePlugin)
  univerInstance.registerPlugin(UniverFormulaEnginePlugin)

  univerInstance.registerPlugin(UniverUIPlugin, {
    container: 'univer-container',
  })

  univerInstance.registerPlugin(UniverDocsPlugin, { hasScroll: false })
  univerInstance.registerPlugin(UniverDocsUIPlugin)

  univerInstance.registerPlugin(UniverSheetsPlugin)
  univerInstance.registerPlugin(UniverSheetsUIPlugin)
  univerInstance.registerPlugin(UniverSheetsFormulaPlugin)
  univerInstance.registerPlugin(UniverSheetsFormulaUIPlugin)
  univerInstance.registerPlugin(UniverSheetsNumfmtPlugin)

  // Load persisted snapshot from localStorage, fall back to blank workbook
  const initSnapshot = store.loadSnapshot() ?? blankSnapshot()
  univerInstance.createUnit(UniverInstanceType.UNIVER_SHEET, initSnapshot)

  const fUniver = FUniver.newAPI(univerInstance)
  store.setFUniver(fUniver)
  store.setUniverRaw(univerInstance, UniverInstanceType)

  // CommandType: COMMAND=0 (user action, enters undo stack)
  //              OPERATION=1 (Univer internal, e.g. scroll/render)
  //              MUTATION=2  (Univer internal low-level)
  // Only COMMAND(0) should mark the document dirty.
  // Also skip the very first async init wave with a short guard.
  let isReady = false
  setTimeout(() => { isReady = true }, 300)

  fUniver.onCommandExecuted((cmd) => {
    if (!isReady) return
    if (cmd.type === 1 || cmd.type === 2) return   // skip OPERATION / MUTATION
    store.markDirty()
    scheduleSave(fUniver)
  })
})

onBeforeUnmount(() => {
  clearTimeout(_saveTimer)
  univerInstance?.dispose?.()
  univerInstance = null
  store.setFUniver(null)
})
</script>

<style scoped>
.univer-container {
  width: 100%;
  height: 100%;
}
</style>
