import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, current, total, limit = 12, onPageChange }: { pagination?: any, current?: number, total?: number, limit?: number, onPageChange: (p: number) => void }) {
  if (!pagination && (!current || !total)) return null;
  const p = pagination?.page || current || 1;
  const t = pagination?.total || total || 0;
  const l = pagination?.limit || limit;
  const totalPages = pagination?.totalPages || Math.ceil(t / l);
  if (totalPages <= 1) return null;

  const from = Math.min((p - 1) * l + 1, t);
  const to   = Math.min(p * l, t);


  const pagesArr = [];
  const range = 2;
  for (let i = Math.max(1, p - range); i <= Math.min(totalPages, p + range); i++) {
    pagesArr.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-700 dark:text-gray-200">{from}–{to}</span> of{' '}
        <span className="font-medium text-gray-700 dark:text-gray-200">{t}</span> results
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(p - 1)} disabled={p <= 1}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        {pagesArr[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">1</button>
            {pagesArr[0] > 2 && <span className="text-gray-400 px-1">…</span>}
          </>
        )}
        {pagesArr.map(pNum => (
          <button
            key={pNum} onClick={() => onPageChange(pNum)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              pNum === p
                ? 'bg-primary-600 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {pNum}
          </button>
        ))}
        {pagesArr[pagesArr.length - 1] < totalPages && (
          <>
            {pagesArr[pagesArr.length - 1] < totalPages - 1 && <span className="text-gray-400 px-1">…</span>}
            <button onClick={() => onPageChange(totalPages)} className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">{totalPages}</button>
          </>
        )}
        <button
          onClick={() => onPageChange(p + 1)} disabled={p >= totalPages}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
