import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSelectItem?: (item: T) => void;
}

export function DataTable<T extends object>({
  columns,
  data,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  searchable,
  searchPlaceholder,
  onSelectItem,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");

  if (loading) return <LoadingSpinner />;
  if (!data.length) return <EmptyState />;

  const filteredData = searchTerm
    ? data.filter((item) =>
        Object.values(item).some(
          (val) =>
            typeof val === "string" &&
            val.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  return (
    <div className="overflow-x-auto border border-brand/10 corner-borders">
      {searchable && (
        <div className="flex items-center gap-3 p-3 border-b border-brand/5 bg-gray-950 border-draw-focus">
          <span className="text-brand text-[10px] font-mono">{">"}_ </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder || "SEARCH_RECORDS..."}
            className="flex-1 bg-transparent text-xs font-mono text-gray-300 focus:outline-none placeholder:text-gray-700 tracking-wider"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-gray-600 hover:text-brand text-[9px] font-mono tracking-wider">
              CLEAR
            </button>
          )}
        </div>
      )}
      <table className="w-full text-xs text-left font-mono" role="table">
        <thead className="bg-gray-950 text-gray-500 uppercase text-[9px] tracking-[0.2em]">
          <tr className="border-b border-brand/10">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 font-medium ${
                  col.sortable
                    ? "cursor-pointer hover:text-brand select-none"
                    : ""
                }`}
                onClick={() => col.sortable && onSort?.(col.key)}
                aria-sort={
                  sortBy === col.key
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable &&
                    (sortBy === col.key ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="h-3 w-3 text-brand" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-brand" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    ))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand/5">
          {filteredData.map((item, i) => (
            <tr
              key={((item as Record<string, unknown>).id as string | number) ?? i}
              className={`bg-gray-950 hover:bg-brand/[0.03] transition-colors row-glow stagger-child ${
                onRowClick || onSelectItem ? "cursor-pointer" : ""
              }`}
              style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}
              onClick={() => {
                onRowClick?.(item);
                onSelectItem?.(item);
              }}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-300">
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
