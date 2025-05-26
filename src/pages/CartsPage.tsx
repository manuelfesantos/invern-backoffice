import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminFetchCarts } from "@/services/api";
import type { ApiCart } from "@/types/api";
import {
  ColumnDefinition,
  DataTableWrapper,
} from "@/components/layout/DataTableWrapper";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PaginationControls } from "@/components/layout/PaginationControls";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react"; // View icon
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 10; // Define page size

// Helper function to format dates
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

const columns: ColumnDefinition<ApiCart>[] = [
  { key: "id", header: "Cart ID", cellClassName: "font-mono text-xs" },
  { key: "type", header: "Type", cellClassName: "text-center" },
  { key: "itemCount", header: "Items", cellClassName: "text-center" },
  { key: "lastModifiedAt", header: "Last Modified" },
  {
    key: "actions",
    header: "Actions",
    className: "w-[100px] text-right",
  },
];

const cartSkeletonCells = [
  <TableCell key="sk-id">
    <Skeleton className="h-4 w-48" />
  </TableCell>,
  <TableCell key="sk-type" className="text-center">
    <Skeleton className="h-5 w-20 mx-auto" />
  </TableCell>,
  <TableCell key="sk-items" className="text-center">
    <Skeleton className="h-4 w-8 mx-auto" />
  </TableCell>,
  <TableCell key="sk-date">
    <Skeleton className="h-4 w-36" />
  </TableCell>,
  <TableCell key="sk-actions" className="text-right">
    <Skeleton className="h-8 w-16" />
  </TableCell>,
];

export function CartsPage() {
  const [carts, setCarts] = useState<ApiCart[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMorePages, setHasMorePages] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    async function loadCarts() {
      try {
        setLoading(true);
        setError(null);
        const { count, carts } = await adminFetchCarts({
          page: currentPage,
          pageSize: PAGE_SIZE,
        });
        setTotalPages(Math.ceil(count / PAGE_SIZE));
        setCarts(carts);
        setHasMorePages(currentPage < Math.ceil(count / PAGE_SIZE));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        setCarts([]);
        setHasMorePages(false);
      } finally {
        setLoading(false);
      }
    }
    loadCarts();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderCartRow = (cart: ApiCart) => (
    <>
      <TableCell className="font-mono text-xs">{cart.id}</TableCell>
      <TableCell className="text-center">
        <Badge variant={cart.isLoggedIn ? "outline" : "secondary"}>
          {cart.isLoggedIn ? "Logged In" : "Anonymous"}
        </Badge>
      </TableCell>
      <TableCell className="text-center">{cart.products.length}</TableCell>
      <TableCell>{formatDate(cart.lastModifiedAt)}</TableCell>
      <TableCell className="text-right space-x-1">
        <Button variant="ghost" size="icon" asChild title="View Cart Details">
          <Link to={`/carts/${cart.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        {/* Add other actions if needed, e.g., delete old anonymous carts? */}
      </TableCell>
    </>
  );

  return (
    <PageWrapper title="View Carts">
      <DataTableWrapper<ApiCart>
        columns={columns}
        data={carts}
        isLoading={loading}
        error={error}
        renderRow={renderCartRow}
        skeletonCells={cartSkeletonCells}
        loadingRowCount={PAGE_SIZE}
        noDataMessage="No carts found."
        errorMessage="Could not load carts."
      />
      <PaginationControls
        currentPage={currentPage}
        canGoPrev={currentPage > 1}
        canGoNext={hasMorePages}
        onPageChange={handlePageChange}
        totalPages={totalPages}
      />
    </PageWrapper>
  );
}
