import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableToolbar } from "./data-table-toolbar";

type DataTableProps<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  searchPlaceholder?: string;
  getRowId?: (row: TData) => string;
};

export function DataTable<TData>({ columns, data, searchPlaceholder, getRowId }: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection
    },
    enableRowSelection: true,
    getRowId,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <DataTableToolbar
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        placeholder={searchPlaceholder}
        selectedCount={table.getSelectedRowModel().rows.length}
      />
      <div className="mt-4 overflow-x-auto rounded-md border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th className="h-11 w-11 px-3 text-left align-middle">
                  <button
                    aria-label="Selectionner toutes les lignes"
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border border-input bg-background text-primary",
                      table.getIsAllPageRowsSelected() && "bg-primary text-primary-foreground"
                    )}
                    onClick={table.getToggleAllPageRowsSelectedHandler()}
                    type="button"
                  >
                    {table.getIsAllPageRowsSelected() ? <Check className="h-3 w-3" /> : null}
                  </button>
                </th>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th className="h-11 px-3 text-left align-middle font-medium" key={header.id}>
                      {header.isPlaceholder ? null : (
                        <button
                          className={cn(
                            "inline-flex items-center gap-1 rounded-sm text-left outline-none",
                            header.column.getCanSort() && "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          )}
                          disabled={!header.column.getCanSort()}
                          onClick={header.column.getToggleSortingHandler()}
                          type="button"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() ? (
                            sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5" />
                          ) : null}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr className="border-t transition-colors hover:bg-muted/40 data-[selected=true]:bg-muted" data-selected={row.getIsSelected()} key={row.id}>
                  <td className="px-3 py-3 align-middle">
                    <button
                      aria-label="Selectionner la ligne"
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border border-input bg-background text-primary",
                        row.getIsSelected() && "bg-primary text-primary-foreground"
                      )}
                      onClick={row.getToggleSelectedHandler()}
                      type="button"
                    >
                      {row.getIsSelected() ? <Check className="h-3 w-3" /> : null}
                    </button>
                  </td>
                  {row.getVisibleCells().map((cell) => (
                    <td className="px-3 py-3 align-middle" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="h-24 px-3 text-center text-muted-foreground" colSpan={columns.length + 1}>
                  Aucun resultat
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount() || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            Precedent
          </Button>
          <Button type="button" variant="outline" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
