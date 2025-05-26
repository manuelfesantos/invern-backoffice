import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPageChange: (newPage: number) => void;
  totalPages?: number;
}

export function PaginationControls({
  currentPage,
  canGoPrev,
  canGoNext,
  onPageChange,
  totalPages,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <span className="text-sm text-muted-foreground">
        Page {currentPage}
        {totalPages ? ` of ${totalPages}` : ""}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label="Go to next page"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
