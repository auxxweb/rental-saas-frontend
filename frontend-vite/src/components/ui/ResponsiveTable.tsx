import React, { useState } from 'react'
import Badge from './Badge'

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  mobileHidden?: boolean
}

interface ResponsiveTableProps {
  columns: Column[]
  data: any[]
  actions?: (row: any) => React.ReactNode
  emptyMessage?: string
  onRowClick?: (row: any) => void
}

export default function ResponsiveTable({
  columns,
  data,
  actions,
  emptyMessage = 'No data available',
  onRowClick,
}: ResponsiveTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  if (data.length === 0) {
    return (
      <div
        className="panel-card p-12 text-center"
      >
        <p className="text-[var(--text-secondary)]">{emptyMessage}</p>
      </div>
    )
  }

  // Mobile Card View (< lg)
  const MobileView = () => (
    <div className="lg:hidden space-y-3 sm:space-y-4">
      {data.map((row, index) => (
        <div
          key={index}
          className="panel-card p-4"
        >
          <div className="space-y-3">
            {columns
              .filter(col => !col.mobileHidden)
              .slice(0, 3)
              .map((column) => (
                <div key={column.key} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start sm:gap-3">
                  <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] shrink-0">{column.label}</span>
                  <span className="text-sm text-[var(--text-primary)] sm:text-right break-words min-w-0 flex-1">
                    {column.render ? column.render(row[column.key], row) : String(row[column.key] || '-')}
                  </span>
                </div>
              ))}
            
            {expandedRow === String(index) && (
              <div className="pt-3 border-t border-[var(--border)] space-y-3">
                {columns
                  .filter(col => !col.mobileHidden)
                  .slice(3)
                  .map((column) => (
                    <div key={column.key} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] shrink-0">{column.label}</span>
                      <span className="text-sm text-[var(--text-primary)] sm:text-right break-words min-w-0 flex-1">
                        {column.render ? column.render(row[column.key], row) : String(row[column.key] || '-')}
                      </span>
                    </div>
                  ))}
                {actions && (
                  <div className="pt-3 border-t border-[var(--border)]">
                    {actions(row)}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setExpandedRow(expandedRow === String(index) ? null : String(index))}
                className="min-h-[44px] px-2 -ms-2 text-sm font-medium text-[var(--accent)] hover:brightness-95 touch-manipulation rounded-lg"
              >
                {expandedRow === String(index) ? 'Show Less' : 'Show More'}
              </button>
              {actions && expandedRow !== String(index) && (
                <div>{actions(row)}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // Desktop Table View
  const DesktopView = () => (
    <div className="hidden lg:block w-full min-w-0 overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--border)]">
        <thead className="bg-[var(--surface-2)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-[var(--surface)] divide-y divide-[var(--border)]">
          {data.map((row, index) => (
            <tr
              key={index}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'hover:bg-[var(--surface-2)] cursor-pointer' : ''}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {column.render ? column.render(row[column.key], row) : String(row[column.key] || '-')}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div
      className="panel-card overflow-hidden"
    >
      <MobileView />
      <DesktopView />
    </div>
  )
}
