import { useState } from 'react'
import { Button } from './Button'
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react'
import { exportData, ExportFormat, ExportColumn } from '@/lib/exportUtils'

interface ExportButtonProps<T extends Record<string, any>> {
  data: T[]
  columns?: ExportColumn[]
  filename?: string
  title?: string
  subtitle?: string
  disabled?: boolean
  variant?: 'default' | 'dropdown' | 'split'
  size?: 'sm' | 'default' | 'lg'
}

export function ExportButton<T extends Record<string, any>>({
  data,
  columns,
  filename = 'export',
  title,
  subtitle,
  disabled = false,
  variant = 'dropdown',
  size = 'default',
}: ExportButtonProps<T>) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExport = (format: ExportFormat) => {
    exportData(data, format, {
      filename,
      columns,
      title,
      subtitle,
    })
    setIsOpen(false)
  }

  const exportOptions = [
    { format: 'csv' as ExportFormat, label: 'CSV', icon: FileText, description: 'Comma-separated values' },
    { format: 'excel' as ExportFormat, label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
    { format: 'pdf' as ExportFormat, label: 'PDF', icon: File, description: 'Portable document format' },
  ]

  if (variant === 'default') {
    return (
      <div className="flex gap-2">
        {exportOptions.map((option) => (
          <Button
            key={option.format}
            variant="outline"
            size={size}
            onClick={() => handleExport(option.format)}
            disabled={disabled || data.length === 0}
          >
            <option.icon className="h-4 w-4 mr-2" />
            Export {option.label}
          </Button>
        ))}
      </div>
    )
  }

  if (variant === 'split') {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size={size}
          onClick={() => handleExport('csv')}
          disabled={disabled || data.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={() => handleExport('excel')}
          disabled={disabled || data.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={() => handleExport('pdf')}
          disabled={disabled || data.length === 0}
        >
          <File className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Dropdown variant
  return (
    <div className="relative">
      <Button
        variant="outline"
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || data.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-background border rounded-md shadow-lg z-20">
            <div className="p-1">
              {exportOptions.map((option) => (
                <button
                  key={option.format}
                  onClick={() => handleExport(option.format)}
                  className="w-full flex items-start gap-3 p-3 hover:bg-muted rounded-md transition-colors text-left"
                >
                  <option.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
