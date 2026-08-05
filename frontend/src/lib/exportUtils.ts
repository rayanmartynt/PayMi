import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export type ExportFormat = 'csv' | 'excel' | 'pdf'

export interface ExportColumn {
  key: string
  label: string
  format?: (value: any) => string
}

export interface ExportOptions {
  filename?: string
  columns?: ExportColumn[]
  title?: string
  subtitle?: string
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
) {
  const { filename = 'export', columns } = options

  const processedData = columns
    ? data.map((item) => {
        const row: Record<string, any> = {}
        columns.forEach((col) => {
          row[col.label] = col.format
            ? col.format(item[col.key])
            : item[col.key]
        })
        return row
      })
    : data

  const csv = Papa.unparse(processedData)
  downloadFile(csv, `${filename}.csv`, 'text/csv')
}

/**
 * Export data to Excel format
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
) {
  const { filename = 'export', columns, title } = options

  const worksheetData = columns
    ? data.map((item) =>
        columns.map((col) =>
          col.format ? col.format(item[col.key]) : item[col.key]
        )
      )
    : data.map((item) => Object.values(item))

  const headers = columns
    ? columns.map((col) => col.label)
    : Object.keys(data[0] || {})

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...worksheetData])

  if (title) {
    XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: 'A1' })
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A2' })
    XLSX.utils.sheet_add_aoa(worksheet, worksheetData, { origin: 'A3' })
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Export data to PDF format
 */
export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
) {
  const { filename = 'export', columns, title, subtitle } = options

  const doc = new jsPDF()

  // Add title if provided
  if (title) {
    doc.setFontSize(18)
    doc.text(title, 14, 22)
  }

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(subtitle, 14, 30)
  }

  // Prepare table data
  const headers = columns
    ? columns.map((col) => col.label)
    : Object.keys(data[0] || {})

  const tableData = columns
    ? data.map((item) =>
        columns.map((col) =>
          col.format ? col.format(item[col.key]) : item[col.key]
        )
      )
    : data.map((item) => Object.values(item))

  // Add table to PDF
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: title ? 40 : 14,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  })

  // Add footer with date
  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(8)
  doc.setTextColor(150)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      14,
      doc.internal.pageSize.height - 10
    )
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    )
  }

  doc.save(`${filename}.pdf`)
}

/**
 * Main export function that routes to specific format
 */
export function exportData<T extends Record<string, any>>(
  data: T[],
  format: ExportFormat,
  options: ExportOptions = {}
) {
  switch (format) {
    case 'csv':
      exportToCSV(data, options)
      break
    case 'excel':
      exportToExcel(data, options)
      break
    case 'pdf':
      exportToPDF(data, options)
      break
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Helper function to download files
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
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
 * Common column formatters
 */
export const formatters = {
  currency: (value: number) => {
    return new Intl.NumberFormat('en-SL', {
      style: 'currency',
      currency: 'SLE',
    }).format(value)
  },

  date: (value: Date | string) => {
    return new Date(value).toLocaleDateString('en-SL')
  },

  dateTime: (value: Date | string) => {
    return new Date(value).toLocaleString('en-SL')
  },

  boolean: (value: boolean) => {
    return value ? 'Yes' : 'No'
  },

  percentage: (value: number) => {
    return `${value.toFixed(2)}%`
  },

  number: (value: number) => {
    return new Intl.NumberFormat('en-SL').format(value)
  },
}
