// src/components/layout/DataTableWrapper.tsx
import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ColumnDefinition<T> {
  key: keyof T | string; // Can be a keyof T or a custom string (e.g., for 'actions')
  header: string;
  className?: string; // Optional className for the TableHead/TableCell
  headerClassName?: string; // Optional specific className for the TableHead
  cellClassName?: string; // Optional specific className for the TableCell
}

interface DataTableWrapperProps<T> {
  columns: ColumnDefinition<T>[];
  data: T[];
  isLoading: boolean;
  error?: string | null; // Error specifically for data loading
  renderRow: (item: T, index: number) => React.ReactNode; // Function to render cells for a row
  skeletonCells: React.ReactNode[]; // Array of skeleton cells for one row
  loadingRowCount?: number;
  noDataMessage?: string;
  errorMessage?: string;
  caption?: string;
}

export function DataTableWrapper<T>({
  columns,
  data,
  isLoading,
  error,
  renderRow,
  skeletonCells,
  loadingRowCount = 5,
  noDataMessage = "No items found.",
  errorMessage = "Could not load data. Please try again later.",
  caption,
}: DataTableWrapperProps<T>) {
  const colSpan = columns.length;

  return (
    <div className="border rounded-lg">
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        {isLoading && !caption && <TableCaption>Loading...</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((col, index) => (
              <TableHead
                key={String(col.key) + index}
                className={cn(col.className, col.headerClassName)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: loadingRowCount }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>{skeletonCells}</TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={colSpan}
                className="h-24 text-center text-muted-foreground"
              >
                {errorMessage}
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colSpan}
                className="h-24 text-center text-muted-foreground"
              >
                {noDataMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={index}>
                {/* Render the cells using the provided function */}
                {renderRow(item, index)}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Helper for conditional class names (optional, assumes you have cn setup)
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
