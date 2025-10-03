import React, { useState, useMemo, useEffect } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from './button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card'
import { cn } from '@/lib/utils'

/**
 * @param {Object} props
 * @param {"default" | "compact"} [props.density="default"] - Controls table spacing density
 */
export function DataTable({
  data = [],
  columns = [],
  loading = false,
  onSort,
  onPageChange,
  onPageSizeChange, // Added this prop
  onRowSelect,
  actions = [],
  className,
  emptyMessage = "No data available",
  pageSize = 10,
  currentPage = 1,
  totalItems,
  showPagination = true,
  showRowSelection = false,
  selectedRows = [],
  isShowingAll = false,
  manualPagination = false,
  density = "default",
  ...props
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const densityStyles = {
    default: {
      outerSpacing: "space-y-4",
      tableRounded: "rounded-xl",
      headerCell: "px-4 py-3 text-sm",
      bodyCell: "px-4 py-3 text-sm",
      checkboxSize: "h-4 w-4",
      iconSize: "h-4 w-4",
      paginationText: "text-sm",
      skeletonPadding: "p-4",
    },
    compact: {
      outerSpacing: "space-y-2",
      tableRounded: "rounded-lg",
      headerCell: "px-2 py-1.5 text-xs",
      bodyCell: "px-2 py-2 text-xs",
      checkboxSize: "h-3.5 w-3.5",
      iconSize: "h-3.5 w-3.5",
      paginationText: "text-xs",
      skeletonPadding: "p-3",
    },
  }

  const styles = densityStyles[density] || densityStyles.default

  // Calculate pagination
  const totalAvailable = totalItems ?? data.length
  const totalPages = Math.max(1, Math.ceil((totalAvailable || 0) / (pageSize || 1)))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  // If showing all items, don't show pagination controls
  const showPaginationControls = showPagination && !isShowingAll
  const paginatedData = isShowingAll
    ? data
    : manualPagination
      ? data
      : data.slice(startIndex, endIndex)

  const displayStart = totalAvailable === 0 ? 0 : startIndex + 1
  const displayEnd = manualPagination
    ? Math.min(startIndex + data.length, totalAvailable)
    : Math.min(endIndex, totalAvailable)

  const handleSort = (column) => {
    if (!column.sortable) return

    let direction = 'asc'
    if (sortConfig.key === column.key && sortConfig.direction === 'asc') {
      direction = 'desc'
    } else if (sortConfig.key === column.key && sortConfig.direction === 'desc') {
      direction = null
    }

    setSortConfig({ key: direction ? column.key : null, direction })
    if (onSort) {
      onSort(column.key, direction)
    }
  }

  const getSortIcon = (column) => {
    if (!column.sortable) return null

    if (sortConfig.key !== column.key) {
      return <ChevronsUpDown className={cn(styles.iconSize, "text-muted-foreground")} />
    }

    if (sortConfig.direction === 'asc') {
      return <ChevronUp className={styles.iconSize} />
    }

    if (sortConfig.direction === 'desc') {
      return <ChevronDown className={styles.iconSize} />
    }

    return <ChevronsUpDown className={cn(styles.iconSize, "text-muted-foreground")} />
  }

  const handleRowSelect = (rowId, checked) => {
    if (onRowSelect) {
      onRowSelect(rowId, checked)
    }
  }

  const handleSelectAll = (checked) => {
    const allRowIds = paginatedData.map(row => row.id)
    if (onRowSelect) {
      onRowSelect(allRowIds, checked)
    }
  }

  const selectedIds = useMemo(() => new Set(selectedRows.filter(Boolean).map(row => row.id)), [selectedRows])
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(row => selectedIds.has(row.id))
  const isSomeSelected = paginatedData.some(row => selectedIds.has(row.id))

  // Mobile Card View Component
  const MobileCardView = ({ data, columns, actions, showRowSelection, selectedIds, handleRowSelect, density, styles }) => {
    return (
      <div className="space-y-3 md:space-y-4">
        {data.map((row, rowIndex) => (
          <Card key={`mobile-${row.id}-${rowIndex}`} className="mobile-data-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {columns.find(col => col.key !== 'actions')?.render
                    ? columns.find(col => col.key !== 'actions').render(row[columns.find(col => col.key !== 'actions').key], row)
                    : row[columns.find(col => col.key !== 'actions')?.key] || 'Item'
                  }
                </CardTitle>
                {showRowSelection && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                    className={cn("rounded border-border/50", styles.checkboxSize)}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 gap-2">
                {columns.filter(column => column.key !== 'actions').slice(1).map((column) => (
                  <div key={column.key} className="data-table-mobile-field">
                    <label className="data-table-mobile-label">{column.label}</label>
                    <div className="data-table-mobile-value">
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key] || '-'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            {actions.length > 0 && (
              <CardFooter className="pt-3">
                <div className="flex gap-2 justify-end w-full">
                  {actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      variant={action.variant || "ghost"}
                      size={density === "compact" ? "compact" : "sm"}
                      onClick={() => action.onClick(row)}
                      className={cn(action.className, "min-h-[44px] md:min-h-0")}
                    >
                      {action.icon && <action.icon className={styles.iconSize} />}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn(styles.outerSpacing, className)}>
        {/* Desktop Table skeleton */}
        <div className="hidden md:block">
          <div className={cn(styles.tableRounded, "border border-border/50 bg-card overflow-hidden")}>
            <div className={styles.skeletonPadding}>
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading data...</span>
              </div>
            </div>
            <div className="border-t border-border/50">
              {Array.from({ length: pageSize }).map((_, index) => (
                <div key={index} className={cn("flex items-center space-x-4 border-b border-border/50 last:border-b-0", styles.skeletonPadding)}>
                  {showRowSelection && <div className={cn(styles.checkboxSize, "bg-muted animate-pulse rounded")} />}
                  {columns.map((column, colIndex) => (
                    <div key={colIndex} className="flex-1">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    </div>
                  ))}
                  {actions.length > 0 && <div className="w-8 h-8 bg-muted animate-pulse rounded" />}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Mobile Card skeleton */}
        <div className="block md:hidden">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="h-5 bg-muted animate-pulse rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted animate-pulse rounded w-1/4"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="h-3 bg-muted animate-pulse rounded w-1/4"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(styles.outerSpacing, className)} {...props}>
      {/* Mobile Card View */}
      <div className="block md:hidden">
        {isMobile && (
          paginatedData.length === 0 ? (
            <Card>
              <CardContent className={cn(density === "compact" ? "py-8" : "py-12", "text-center text-muted-foreground")}>
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-sm">{emptyMessage}</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <MobileCardView
              data={paginatedData}
              columns={columns}
              actions={actions}
              showRowSelection={showRowSelection}
              selectedIds={selectedIds}
              handleRowSelect={handleRowSelect}
              density={density}
              styles={styles}
            />
          )
        )}
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className={cn(styles.tableRounded, "border border-border/50 bg-card overflow-hidden shadow-lg")}>
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead className="border-b border-border/50 bg-muted/30">
              <tr>
                {showRowSelection && (
                  <th className={cn("w-12 text-left", styles.headerCell)}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) {
                          const allSelected = paginatedData.length > 0 && paginatedData.every(row => selectedIds.has(row.id));
                          const someSelected = paginatedData.some(row => selectedIds.has(row.id));
                          el.indeterminate = someSelected && !allSelected;
                        }
                      }}
                      onChange={(e) => {
                        const allRowIds = paginatedData.map(row => row.id);
                        if (onRowSelect) {
                          onRowSelect(allRowIds, e.target.checked);
                        }
                      }}
                      className={cn("rounded border-border/50", styles.checkboxSize)}
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      styles.headerCell,
                      "text-left font-semibold text-muted-foreground",
                      column.sortable && "cursor-pointer hover:bg-muted/50 transition-colors",
                      column.className
                    )}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      {getSortIcon(column)}
                    </div>
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className={cn("w-12 text-right", styles.headerCell)}>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (showRowSelection ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                    className={cn(styles.bodyCell, density === "compact" ? "py-8" : "py-12", "text-center text-muted-foreground")}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-sm">{emptyMessage}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={`${row.id}-${rowIndex}`}
                    className="border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    {showRowSelection && (
                      <td className={styles.bodyCell}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                          className={cn("rounded border-border/50", styles.checkboxSize)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={cn(styles.bodyCell, column.className)}>
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key] || '-'
                        }
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className={cn(styles.bodyCell, "text-right")}>
                        <div className="flex items-center justify-end space-x-2 data-table-actions">
                          {actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              variant={action.variant || "ghost"}
                              size={density === "compact" ? "compact" : "sm"}
                              onClick={() => action.onClick(row)}
                              className={cn(action.className, "min-h-[44px] md:min-h-0")}
                            >
                              {action.icon && <action.icon className={styles.iconSize} />}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Pagination */}
      {showPaginationControls && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className={cn(styles.paginationText, "text-muted-foreground w-full md:w-auto")}>
            {totalAvailable === 0
              ? 'No entries'
              : `Showing ${displayStart} to ${displayEnd} of ${totalAvailable} entries`}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <span className={cn(styles.paginationText, "text-muted-foreground")}>Rows per page:</span>
              <select
                value={pageSize >= 1000 ? 'all' : pageSize}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all') {
                    onPageSizeChange && onPageSizeChange(totalItems || data.length);
                  } else {
                    onPageSizeChange && onPageSizeChange(parseInt(value));
                  }
                }}
                className="px-2 py-1 text-sm border border-border rounded bg-background w-full sm:w-auto"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
                <option value="all">All</option>
              </select>
            </div>

            <Button
              variant="outline"
              size={density === "compact" ? "compact" : "sm"}
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex-1 sm:flex-initial"
            >
              <ChevronLeft className={styles.iconSize} />
              Previous
            </Button>

            <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                if (pageNum > totalPages) return null

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size={density === "compact" ? "compact" : "sm"}
                    onClick={() => onPageChange && onPageChange(pageNum)}
                    className="w-8 h-8 p-0 flex-shrink-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size={density === "compact" ? "compact" : "sm"}
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex-1 sm:flex-initial"
            >
              Next
              <ChevronRight className={styles.iconSize} />
            </Button>
          </div>
        </div>
      )}

      {/* Show page size info when showing all items */}
      {!showPaginationControls && showPagination && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className={cn(styles.paginationText, "text-muted-foreground w-full md:w-auto")}>
            Showing all {totalItems || data.length} entries
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <span className={cn(styles.paginationText, "text-muted-foreground")}>Page size:</span>
              <select
                value={pageSize >= 1000 ? 'all' : pageSize}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all') {
                    onPageSizeChange && onPageSizeChange(totalItems || data.length);
                  } else {
                    onPageSizeChange && onPageSizeChange(parseInt(value));
                  }
                }}
                className="px-2 py-1 text-sm border border-border rounded bg-background w-full sm:w-auto"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
                <option value="all">All</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
