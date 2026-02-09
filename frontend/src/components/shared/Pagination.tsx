import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-between border-t border-brand/10 px-4 py-3 mt-4"
      aria-label="Pagination"
    >
      <p className="text-[10px] text-gray-600 font-mono tracking-wider">
        PAGE <span className="text-brand">{page}</span> OF{" "}
        <span className="text-brand">{totalPages}</span>
        <span className="ml-2 text-gray-700">// {total} RECORDS</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center bg-gray-950 border border-brand/10 px-3 py-1.5 text-[10px] font-mono text-gray-400 hover:text-brand hover:border-brand/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors tracking-wider"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3 w-3 mr-1" />
          PREV
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center bg-gray-950 border border-brand/10 px-3 py-1.5 text-[10px] font-mono text-gray-400 hover:text-brand hover:border-brand/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors tracking-wider"
          aria-label="Next page"
        >
          NEXT
          <ChevronRight className="h-3 w-3 ml-1" />
        </button>
      </div>
    </nav>
  );
}
