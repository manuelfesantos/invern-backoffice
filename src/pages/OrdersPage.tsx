import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminFetchOrders, adminCancelOrder } from "@/services/api"; // Assuming adminCancelOrder exists or add it
import type { ApiOrder } from "@/types/api";
import {
  ColumnDefinition,
  DataTableWrapper,
} from "@/components/layout/DataTableWrapper";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PaginationControls } from "@/components/layout/PaginationControls"; // Import Pagination
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, XCircle, Loader2 } from "lucide-react"; // Icons for View, Cancel
import { toast } from "sonner";
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // For status

const PAGE_SIZE = 10; // Define page size

// Helper function to format dates
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

// Helper function to format currency (assuming EUR for now)
function formatPrice(priceInCents: number | null | undefined) {
  if (priceInCents === null || priceInCents === undefined) return "N/A";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(priceInCents / 100);
}

const columns: ColumnDefinition<ApiOrder>[] = [
  { key: "id", header: "Order ID", cellClassName: "font-mono text-xs" },
  { key: "customer", header: "Customer" },
  { key: "createdAt", header: "Date" },
  {
    key: "total",
    header: "Total",
    headerClassName: "text-right",
    cellClassName: "text-right",
  },
  { key: "status", header: "Status", cellClassName: "text-center" },
  {
    key: "actions",
    header: "Actions",
    className: "w-[120px] text-right", // Adjusted width
  },
];

const orderSkeletonCells = [
  <TableCell key="sk-id">
    <Skeleton className="h-4 w-48" />
  </TableCell>,
  <TableCell key="sk-customer">
    <Skeleton className="h-4 w-32" />
  </TableCell>,
  <TableCell key="sk-date">
    <Skeleton className="h-4 w-36" />
  </TableCell>,
  <TableCell key="sk-total" className="text-right">
    <Skeleton className="h-4 w-16" />
  </TableCell>,
  <TableCell key="sk-status" className="text-center">
    <Skeleton className="h-5 w-20 mx-auto" />
  </TableCell>,
  <TableCell key="sk-actions" className="text-right">
    <Skeleton className="h-8 w-24" />
  </TableCell>,
];

export function OrdersPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMorePages, setHasMorePages] = useState<boolean>(false);
  const [orderToCancel, setOrderToCancel] = useState<ApiOrder | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0); // Total pages

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);
        const { orders, count } = await adminFetchOrders({
          page: currentPage,
          pageSize: PAGE_SIZE,
        });
        setOrders(orders);
        setTotalPages(Math.ceil(count / PAGE_SIZE)); // Calculate total pages
        setHasMorePages(currentPage < Math.ceil(count / PAGE_SIZE));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        setOrders([]);
        setHasMorePages(false);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [currentPage]); // Re-fetch when currentPage changes

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      const updatedOrder = await adminCancelOrder(orderToCancel.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
      );
      toast.success("Order Cancelled", {
        description: `Order ${orderToCancel.id} has been marked as cancelled.`,
      });
      setOrderToCancel(null);
    } catch (err) {
      toast.error("Cancel Failed", {
        description:
          err instanceof Error ? err.message : "Could not cancel order.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Simplified status mapping
  const getStatusVariant = (
    order: ApiOrder,
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (order.isCanceled) return "destructive";
    if (order.payment?.state === "succeeded") {
      if (order.shippingTransaction.status === "delivered") return "default"; // Consider 'success' variant if added
      if (order.shippingTransaction.status === "shipped") return "outline";
      return "secondary"; // processing, packaging
    }
    if (order.payment?.state === "failed") return "destructive";
    return "secondary"; // draft, created, processing payment
  };

  const renderOrderRow = (order: ApiOrder) => (
    <>
      <TableCell className="font-mono text-xs">{order.id}</TableCell>
      <TableCell>
        {order.personalDetails.email || order.userId || "Guest"}
      </TableCell>
      <TableCell>{formatDate(order.createdAt)}</TableCell>
      <TableCell className="text-right font-medium">
        {formatPrice(order.payment?.grossAmount)}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={getStatusVariant(order)}>
          {order.isCanceled ? "Cancelled" : (order.payment?.state ?? "Draft")} /{" "}
          {order.shippingTransaction.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right space-x-1">
        <Button variant="ghost" size="icon" asChild title="View Order Details">
          <Link to={`/orders/${order.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Cancel Order"
          onClick={() => setOrderToCancel(order)}
          disabled={!!order.isCanceled} // Disable if already cancelled
          className="text-destructive hover:text-destructive"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </TableCell>
    </>
  );

  return (
    <PageWrapper title="Manage Orders">
      <DataTableWrapper<ApiOrder>
        columns={columns}
        data={orders}
        isLoading={loading}
        error={error}
        renderRow={renderOrderRow}
        skeletonCells={orderSkeletonCells}
        loadingRowCount={PAGE_SIZE}
      />
      <PaginationControls
        currentPage={currentPage}
        canGoPrev={currentPage > 1}
        canGoNext={hasMorePages}
        onPageChange={handlePageChange}
        totalPages={totalPages}
      />

      {/* Cancel Confirmation Dialog */}
      {orderToCancel && (
        <AlertDialog
          open={!!orderToCancel}
          onOpenChange={(open) => !open && setOrderToCancel(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark order{" "}
                <span className="font-semibold font-mono text-xs">
                  {orderToCancel.id}
                </span>{" "}
                as cancelled. This may trigger stock adjustments. Are you sure
                you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOrderToCancel(null)}>
                Back
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelConfirm}
                disabled={isCancelling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isCancelling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isCancelling ? "Cancelling..." : "Confirm Cancel"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </PageWrapper>
  );
}
