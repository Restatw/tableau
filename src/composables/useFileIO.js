import * as XLSX from 'xlsx'

// ─── CellValueType (mirrors @univerjs/core enum) ─────────────────────────────
const CellValueType = { NUMBER: 2, STRING: 1, BOOLEAN: 4 }

// ─── Conversion: AOA → Univer cellData ───────────────────────────────────────
function aoa2cellData(aoa) {
  const cellData = {}
  aoa.forEach((row, r) => {
    const rowObj = {}
    ;(row || []).forEach((val, c) => {
      if (val === null || val === undefined || val === '') return
      const t = typeof val === 'number' ? CellValueType.NUMBER : CellValueType.STRING
      rowObj[c] = { v: val, t }
    })
    if (Object.keys(rowObj).length) cellData[r] = rowObj
  })
  return cellData
}

// ─── Conversion: Univer cellData → AOA ───────────────────────────────────────
function cellData2aoa(cellData, rowCount, colCount) {
  const rows = []
  for (let r = 0; r < rowCount; r++) {
    const row = []
    for (let c = 0; c < colCount; c++) {
      row.push(cellData?.[r]?.[c]?.v ?? null)
    }
    rows.push(row)
  }
  while (rows.length && rows[rows.length - 1].every(v => v === null)) rows.pop()
  return rows
}

// ─── Build full workbook snapshot from SheetJS workbook ──────────────────────
function buildSnapshot(xlsxWb) {
  const sheetOrder = []
  const sheets = {}

  xlsxWb.SheetNames.forEach((name, i) => {
    const ws  = xlsxWb.Sheets[name]
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true })
    const id  = `sheet-${i}`
    sheetOrder.push(id)

    const maxCols = aoa.reduce((m, r) => Math.max(m, r.length), 0)

    sheets[id] = {
      id,
      name,
      tabColor: '',
      hidden: 0,
      rowCount: Math.max(aoa.length + 10, 1000),
      columnCount: Math.max(maxCols + 4, 26),
      zoomRatio: 1,
      scrollTop: 0,
      scrollLeft: 0,
      defaultColumnWidth: 93,
      defaultRowHeight: 27,
      mergeData: [],
      cellData: aoa2cellData(aoa),
      rowData: {},
      columnData: {},
      showGridlines: 1,
      rowHeader: { width: 46, hidden: 0 },
      columnHeader: { height: 20, hidden: 0 },
      selections: ['A1'],
      freeze: { xSplit: 0, ySplit: 0, ySplitPos: 84, xSplitPos: 46 },
    }
  })

  return {
    id: 'workbook-01',
    sheetOrder,
    name: xlsxWb.SheetNames[0] ?? 'Workbook',
    appVersion: '3.0.0-alpha',
    locale: 'zhCN',
    sheets,
    styles: {},
    resources: [],
  }
}

// ─── Blank workbook snapshot ──────────────────────────────────────────────────
function blankSnapshot() {
  return {
    id: 'workbook-01',
    sheetOrder: ['sheet-01'],
    name: 'Workbook',
    appVersion: '3.0.0-alpha',
    locale: 'zhCN',
    sheets: {
      'sheet-01': {
        id: 'sheet-01',
        name: 'Sheet1',
        tabColor: '',
        hidden: 0,
        rowCount: 1000,
        columnCount: 26,
        zoomRatio: 1,
        scrollTop: 0,
        scrollLeft: 0,
        defaultColumnWidth: 93,
        defaultRowHeight: 27,
        mergeData: [],
        cellData: {},
        rowData: {},
        columnData: {},
        showGridlines: 1,
        rowHeader: { width: 46, hidden: 0 },
        columnHeader: { height: 20, hidden: 0 },
        selections: ['A1'],
        freeze: { xSplit: 0, ySplit: 0, ySplitPos: 84, xSplitPos: 46 },
      },
    },
    styles: {},
    resources: [],
  }
}

// ─── Public composable ────────────────────────────────────────────────────────
export function useFileIO() {
  /**
   * Open file picker, parse with SheetJS, reload Univer with parsed data.
   *
   * @param {object} fUniver        FUniver facade instance
   * @param {object} univerRaw      raw Univer instance (for createUnit)
   * @param {object} UniverInstanceType
   * @returns {Promise<string>}     resolved filename
   */
  async function importFile(fUniver, univerRaw, UniverInstanceType) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type  = 'file'
      input.accept = '.xlsx,.xls,.csv,.ods'

      input.onchange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return reject(new Error('No file selected'))

        try {
          const buf  = await file.arrayBuffer()
          const xlsxWb = XLSX.read(buf, { type: 'array', raw: true })
          const snapshot = buildSnapshot(xlsxWb)

          // Dispose current workbook, recreate with imported data
          const wbId = fUniver.getActiveWorkbook()?.getId()
          if (wbId) fUniver.disposeUnit(wbId)
          univerRaw.createUnit(UniverInstanceType.UNIVER_SHEET, snapshot)

          resolve(file.name)
        } catch (err) {
          reject(err)
        }
      }

      input.click()
    })
  }

  /**
   * Serialize current Univer workbook to .xlsx via SheetJS.
   *
   * @param {object} fUniver  FUniver facade instance
   * @param {string} fileName
   */
  function exportFile(fUniver, fileName) {
    const fWorkbook = fUniver.getActiveWorkbook()
    if (!fWorkbook) throw new Error('No active workbook')

    // getSnapshot() returns full IWorkbookData including all cellData
    const snapshot = fWorkbook.getSnapshot()
    const wb = XLSX.utils.book_new()

    ;(snapshot.sheetOrder || Object.keys(snapshot.sheets)).forEach(id => {
      const sheet = snapshot.sheets[id]
      if (!sheet) return
      const aoa = cellData2aoa(sheet.cellData || {}, sheet.rowCount || 1000, sheet.columnCount || 26)
      const ws  = XLSX.utils.aoa_to_sheet(aoa.length ? aoa : [[]])
      XLSX.utils.book_append_sheet(wb, ws, sheet.name || id)
    })

    XLSX.writeFile(wb, fileName)
  }

  return { importFile, exportFile, blankSnapshot }
}
