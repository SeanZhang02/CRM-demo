/**
 * Enhanced Excel Export Library
 *
 * Features:
 * - True Excel XLSX format support
 * - Professional formatting and styling
 * - Multiple sheets support
 * - Data validation and cell formatting
 * - Auto-sizing columns
 * - Headers and footers
 */

import * as XLSX from 'xlsx'

export interface ExcelColumn {
  key: string
  header: string
  width?: number
  type?: 'string' | 'number' | 'date' | 'currency' | 'percentage'
  format?: string
}

export interface ExcelSheet {
  name: string
  data: any[]
  columns: ExcelColumn[]
  title?: string
  summary?: {
    totalRows: number
    exportDate: Date
    filters?: string
  }
}

export interface ExcelExportOptions {
  filename: string
  sheets: ExcelSheet[]
  company?: {
    name: string
    logo?: string
  }
  metadata?: {
    title: string
    subject: string
    creator: string
    description?: string
  }
}

export class ExcelExporter {
  private workbook: XLSX.WorkBook

  constructor() {
    this.workbook = XLSX.utils.book_new()
  }

  /**
   * Export data to Excel with professional formatting
   */
  static async export(options: ExcelExportOptions): Promise<Blob> {
    const exporter = new ExcelExporter()
    return exporter.createWorkbook(options)
  }

  /**
   * Create formatted workbook
   */
  private async createWorkbook(options: ExcelExportOptions): Promise<Blob> {
    // Set workbook metadata
    if (options.metadata) {
      this.workbook.Props = {
        Title: options.metadata.title,
        Subject: options.metadata.subject,
        Author: options.metadata.creator,
        CreatedDate: new Date(),
        Company: options.company?.name || 'CRM System',
        Comments: options.metadata.description,
      }
    }

    // Create sheets
    for (const sheetData of options.sheets) {
      this.createSheet(sheetData)
    }

    // Generate Excel buffer
    const wbout = XLSX.write(this.workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
      cellDates: true,
    })

    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  }

  /**
   * Create formatted worksheet
   */
  private createSheet(sheetData: ExcelSheet): void {
    const { name, data, columns, title, summary } = sheetData

    // Prepare the worksheet data
    const worksheetData: any[][] = []
    let currentRow = 0

    // Add title if provided
    if (title) {
      worksheetData.push([title])
      worksheetData.push([]) // Empty row
      currentRow += 2
    }

    // Add summary information
    if (summary) {
      worksheetData.push(['Export Summary'])
      worksheetData.push(['Total Records:', summary.totalRows])
      worksheetData.push(['Export Date:', this.formatDate(summary.exportDate)])
      if (summary.filters) {
        worksheetData.push(['Applied Filters:', summary.filters])
      }
      worksheetData.push([]) // Empty row
      currentRow += summary.filters ? 5 : 4
    }

    // Add headers
    const headers = columns.map(col => col.header)
    worksheetData.push(headers)
    const headerRow = currentRow
    currentRow++

    // Add data rows
    for (const row of data) {
      const formattedRow = columns.map(col => this.formatCellValue(row[col.key], col))
      worksheetData.push(formattedRow)
      currentRow++
    }

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Apply formatting
    this.applyFormatting(worksheet, {
      titleRow: title ? 0 : -1,
      summaryStartRow: title ? 2 : 0,
      summaryEndRow: summary ? (title ? 2 : 0) + (summary.filters ? 4 : 3) : -1,
      headerRow,
      dataStartRow: headerRow + 1,
      dataEndRow: currentRow - 1,
      columns,
    })

    // Set column widths
    this.setColumnWidths(worksheet, columns)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(this.workbook, worksheet, name)
  }

  /**
   * Apply professional formatting to worksheet
   */
  private applyFormatting(
    worksheet: XLSX.WorkSheet,
    layout: {
      titleRow: number
      summaryStartRow: number
      summaryEndRow: number
      headerRow: number
      dataStartRow: number
      dataEndRow: number
      columns: ExcelColumn[]
    }
  ): void {
    if (!worksheet['!refs']) return

    const range = XLSX.utils.decode_range(worksheet['!refs'])

    // Title formatting
    if (layout.titleRow >= 0) {
      const titleCell = worksheet[XLSX.utils.encode_cell({ r: layout.titleRow, c: 0 })]
      if (titleCell) {
        titleCell.s = {
          font: { bold: true, sz: 16, color: { rgb: '1F4E79' } },
          alignment: { horizontal: 'left', vertical: 'center' },
        }
      }
    }

    // Summary section formatting
    if (layout.summaryStartRow >= 0 && layout.summaryEndRow >= 0) {
      for (let row = layout.summaryStartRow; row <= layout.summaryEndRow; row++) {
        const labelCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
        if (labelCell) {
          labelCell.s = {
            font: { bold: true, sz: 10 },
            alignment: { horizontal: 'left' },
          }
        }
      }
    }

    // Header formatting
    for (let col = 0; col < layout.columns.length; col++) {
      const headerCell = worksheet[XLSX.utils.encode_cell({ r: layout.headerRow, c: col })]
      if (headerCell) {
        headerCell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4F81BD' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        }
      }
    }

    // Data formatting
    for (let row = layout.dataStartRow; row <= layout.dataEndRow; row++) {
      for (let col = 0; col < layout.columns.length; col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })]
        if (cell) {
          const column = layout.columns[col]
          const isEvenRow = (row - layout.dataStartRow) % 2 === 0

          cell.s = {
            alignment: this.getAlignment(column.type),
            fill: { fgColor: { rgb: isEvenRow ? 'F2F2F2' : 'FFFFFF' } },
            border: {
              top: { style: 'thin', color: { rgb: 'D0D0D0' } },
              bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
              left: { style: 'thin', color: { rgb: 'D0D0D0' } },
              right: { style: 'thin', color: { rgb: 'D0D0D0' } },
            },
            numFmt: this.getNumberFormat(column.type, column.format),
          }
        }
      }
    }

    // Apply auto-filter to data
    if (layout.dataEndRow > layout.headerRow) {
      worksheet['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { r: layout.headerRow, c: 0 },
          e: { r: layout.dataEndRow, c: layout.columns.length - 1 },
        }),
      }
    }
  }

  /**
   * Set column widths based on content and type
   */
  private setColumnWidths(worksheet: XLSX.WorkSheet, columns: ExcelColumn[]): void {
    const colWidths = columns.map(col => {
      if (col.width) {
        return { wch: col.width }
      }

      // Auto-size based on type and header length
      let width = Math.max(col.header.length, 10)

      switch (col.type) {
        case 'date':
          width = Math.max(width, 12)
          break
        case 'currency':
          width = Math.max(width, 15)
          break
        case 'number':
          width = Math.max(width, 12)
          break
        case 'percentage':
          width = Math.max(width, 10)
          break
        default:
          width = Math.max(width, 20)
      }

      return { wch: Math.min(width, 50) } // Cap at 50 characters
    })

    worksheet['!cols'] = colWidths
  }

  /**
   * Format cell value based on column type
   */
  private formatCellValue(value: any, column: ExcelColumn): any {
    if (value === null || value === undefined || value === '') {
      return ''
    }

    switch (column.type) {
      case 'date':
        if (value instanceof Date) {
          return value
        }
        if (typeof value === 'string' || typeof value === 'number') {
          const date = new Date(value)
          return isNaN(date.getTime()) ? value : date
        }
        return value

      case 'number':
        const num = parseFloat(value)
        return isNaN(num) ? value : num

      case 'currency':
        const currency = parseFloat(value)
        return isNaN(currency) ? value : currency

      case 'percentage':
        const percent = parseFloat(value)
        return isNaN(percent) ? value : percent / 100

      case 'string':
      default:
        return String(value)
    }
  }

  /**
   * Get cell alignment based on column type
   */
  private getAlignment(type?: string): any {
    switch (type) {
      case 'number':
      case 'currency':
      case 'percentage':
        return { horizontal: 'right', vertical: 'center' }
      case 'date':
        return { horizontal: 'center', vertical: 'center' }
      default:
        return { horizontal: 'left', vertical: 'center' }
    }
  }

  /**
   * Get number format based on column type
   */
  private getNumberFormat(type?: string, customFormat?: string): string {
    if (customFormat) {
      return customFormat
    }

    switch (type) {
      case 'currency':
        return '"$"#,##0.00'
      case 'percentage':
        return '0.00%'
      case 'number':
        return '#,##0.00'
      case 'date':
        return 'mm/dd/yyyy'
      default:
        return 'General'
    }
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}

/**
 * Utility function for quick CSV to Excel conversion
 */
export function csvToExcel(csvData: string, filename: string): Promise<Blob> {
  const lines = csvData.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    return row
  })

  const columns: ExcelColumn[] = headers.map(header => ({
    key: header,
    header: header,
    type: 'string',
  }))

  return ExcelExporter.export({
    filename,
    sheets: [
      {
        name: 'Data',
        data,
        columns,
        title: 'Exported Data',
        summary: {
          totalRows: data.length,
          exportDate: new Date(),
        },
      },
    ],
    metadata: {
      title: 'Data Export',
      subject: 'CRM Data Export',
      creator: 'CRM System',
    },
  })
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Estimate export file size
 */
export function estimateExportSize(
  data: any[],
  columns: ExcelColumn[],
  format: 'csv' | 'excel' = 'csv'
): string {
  if (data.length === 0) return '0 Bytes'

  // Calculate average row size
  const sampleRow = data[0]
  const avgRowSize = columns.reduce((size, col) => {
    const value = sampleRow[col.key]
    const valueSize = value ? String(value).length : 0
    return size + valueSize + 1 // +1 for delimiter
  }, 0)

  // Estimate total size
  const headerSize = columns.reduce((size, col) => size + col.header.length + 1, 0)
  const dataSize = avgRowSize * data.length
  let totalSize = headerSize + dataSize

  // Excel files are typically 2-3x larger than CSV due to formatting
  if (format === 'excel') {
    totalSize *= 2.5
  }

  return formatFileSize(totalSize)
}