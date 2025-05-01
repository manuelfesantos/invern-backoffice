// src/pages/ProductsPage.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchProducts, deleteProduct } from "@/services/api";
import type { ApiProduct } from "@/types/api";
import {
  ColumnDefinition,
  DataTableWrapper,
} from "@/components/layout/DataTableWrapper";
import { PageWrapper } from "@/components/layout/PageWrapper";
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
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TableCell } from "@/components/ui/table"; // Import TableCell

// --- Helper Functions ---
function formatPrice(priceInCents: number, locale = "en-US", currency = "USD") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(priceInCents / 100);
}

const columns: ColumnDefinition<ApiProduct>[] = [
  { key: "name", header: "Name" },
  { key: "stock", header: "Stock" },
  {
    key: "priceInCents",
    header: "Price",
    headerClassName: "text-right",
    cellClassName: "text-right",
  },
  {
    key: "actions",
    header: "Actions",
    className: "w-[100px] text-right", // Applied to both head and cell via className prop
  },
];

const productSkeletonCells = [
  <TableCell key="sk-name">
    <Skeleton className="h-5 w-40" />
  </TableCell>,
  <TableCell key="sk-stock">
    <Skeleton className="h-5 w-12" />
  </TableCell>,
  <TableCell key="sk-price" className="text-right">
    <Skeleton className="h-5 w-16" />
  </TableCell>,
  <TableCell key="sk-actions" className="text-right">
    <Skeleton className="h-8 w-20" />
  </TableCell>,
];
// --- Component ---
export function ProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<ApiProduct | null>(
    null,
  );

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMsg);
        setProducts([]);
        // No toast here, error displayed by wrapper
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      toast.success("Product Deleted", {
        description: `Product "${productToDelete.name}" has been deleted.`,
      });
      setProductToDelete(null);
    } catch (err) {
      toast.error("Delete Failed", {
        description:
          err instanceof Error ? err.message : "Could not delete product.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderProductRow = (product: ApiProduct) => (
    <>
      <TableCell>{product.name}</TableCell>
      <TableCell>{product.stock}</TableCell>
      <TableCell className="text-right">
        {formatPrice(product.priceInCents, "pt-PT", "EUR")}
      </TableCell>
      <TableCell className="text-right space-x-1">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/products/${product.id}`} title="Edit Product">
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
        {/* REMOVED AlertDialogTrigger */}
        <Button
          variant="ghost"
          size="icon"
          title="Delete Product"
          onClick={() => setProductToDelete(product)} // CHANGED onClick
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        {/* END REMOVAL/CHANGE */}
      </TableCell>
    </>
  );

  return (
    <PageWrapper
      title="Manage Products"
      addHref="/products/new"
      addLabel="Add New Product"
      // Pass top-level error if needed, but DataTableWrapper handles data loading error
      // error={error && products.length === 0 ? error : null} // Example: only show top error if load failed AND no data
    >
      <DataTableWrapper<ApiProduct>
        columns={columns}
        data={products}
        isLoading={loading}
        error={error} // Pass error state to table wrapper
        renderRow={renderProductRow}
        skeletonCells={productSkeletonCells}
      />

      {/* Delete Confirmation Dialog - Outside the wrapper, controlled by local state */}
      {productToDelete && (
        <AlertDialog
          open={!!productToDelete}
          onOpenChange={(open) => !open && setProductToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                product
                <span className="font-semibold"> "{productToDelete.name}"</span>
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProductToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </PageWrapper>
  );
}
