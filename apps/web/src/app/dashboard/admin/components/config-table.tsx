import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ConfigRow = Doc<"appConfigs">;

type ConfigTableProps = {
  data: ConfigRow[];
  onEdit: (config: ConfigRow) => void;
  onDelete: (config: ConfigRow) => void;
  className?: string;
};

export function ConfigTable({
  data,
  onEdit,
  onDelete,
  className,
}: ConfigTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "key",
      desc: false,
    },
  ]);

  const columns = useMemo<ColumnDef<ConfigRow>[]>(
    () => [
      {
        accessorKey: "key",
        header: "Key",
        cell: ({ row }) => (
          <span className="font-mono text-xs sm:text-sm">
            {row.original.key}
          </span>
        ),
      },
      {
        accessorKey: "value",
        header: "Value",
        cell: ({ row }) => (
          <div className="group relative">
            <div className="rounded-md bg-muted px-3 py-2 pr-12 font-mono text-xs sm:text-sm">
              {row.original.value ? (
                row.original.value
              ) : (
                <span className="italic text-muted-foreground">Not set</span>
              )}
            </div>
            <Button
              aria-label={`Edit ${row.original.key}`}
              variant="ghost"
              size="icon"
              className="absolute right-10 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              aria-label={`Delete ${row.original.key}`}
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                No configurations found. Click "Add" to create one.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
