import { Search, ArrowUpDown } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function DataTable({ columns, data, loading, onSort, sortField, sortDir, emptyMessage = 'No records found' }: any) {
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            {columns.map((col: any, i: number) => (
              <th key={i} className={`table-header ${col.className || ''}`} style={col.style}>
                {col.sortable ? (
                  <button onClick={() => onSort && onSort(col.key)} className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100">
                    {col.header}
                    <ArrowUpDown size={12} className={sortField === col.key ? 'text-primary-600' : 'opacity-30'} />
                  </button>
                ) : col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {(!data || data.length === 0)
            ? <tr><td colSpan={columns.length} className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</td></tr>
            : data.map((row: any, ri: number) =>
                <tr key={row.id || ri} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  {columns.map((col: any, ci: number) => (
                    <td key={ci} className={`table-cell ${col.tdClassName || ''}`} style={col.style}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              )
          }
        </tbody>
      </table>
    </div>
  );
}
