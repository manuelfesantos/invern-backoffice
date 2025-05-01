// src/pages/CurrenciesPage.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchCurrencies, deleteCurrency } from "@/services/api";
import type { ApiAdminCurrency } from "@/types/api";
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

const columns: ColumnDefinition<ApiAdminCurrency>[] = [
  { key: "code", header: "Code", className: "w-[100px]" },
  { key: "name", header: "Name" },
  { key: "symbol", header: "Symbol", className: "w-[80px]" },
  {
    key: "rateToEuro",
    header: "Rate to EUR",
    headerClassName: "text-right",
    cellClassName: "text-right",
  },
  { key: "stripeName", header: "Stripe Name" },
  {
    key: "actions",
    header: "Actions",
    className: "w-[100px] text-right",
  },
];

const currencySkeletonCells = [
  <TableCell key="sk-code">
    <Skeleton className="h-5 w-16" />
  </TableCell>,
  <TableCell key="sk-name">
    <Skeleton className="h-5 w-36" />
  </TableCell>,
  <TableCell key="sk-symbol">
    <Skeleton className="h-5 w-8" />
  </TableCell>,
  <TableCell key="sk-rate" className="text-right">
    <Skeleton className="h-5 w-20" />
  </TableCell>,
  <TableCell key="sk-stripe">
    <Skeleton className="h-5 w-24" />
  </TableCell>,
  <TableCell key="sk-actions" className="text-right">
    <Skeleton className="h-8 w-20" />
  </TableCell>,
];

export function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<ApiAdminCurrency[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [currencyToDelete, setCurrencyToDelete] =
    useState<ApiAdminCurrency | null>(null);

  useEffect(() => {
    async function loadCurrencies() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCurrencies();
        setCurrencies(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        setCurrencies([]);
      } finally {
        setLoading(false);
      }
    }
    loadCurrencies();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!currencyToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCurrency(currencyToDelete.code);
      setCurrencies((prev) =>
        prev.filter((c) => c.code !== currencyToDelete.code),
      );
      toast.success("Currency Deleted", {
        description: `Currency "${currencyToDelete.name}" (${currencyToDelete.code}) has been deleted.`,
      });
      setCurrencyToDelete(null);
    } catch (err) {
      toast.error("Delete Failed", {
        description:
          err instanceof Error ? err.message : "Could not delete currency.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderCurrencyRow = (currency: ApiAdminCurrency) => (
    <>
      <TableCell className="font-medium">{currency.code}</TableCell>
      <TableCell>{currency.name}</TableCell>
      <TableCell>{currency.symbol}</TableCell>
      <TableCell className="text-right">{currency.rateToEuro}</TableCell>
      <TableCell>{currency.stripeName}</TableCell>
      <TableCell className="text-right space-x-1">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/currencies/${currency.code}`} title="Edit Currency">
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
        {/* REMOVED AlertDialogTrigger */}
        <Button
          variant="ghost"
          size="icon"
          title="Delete Currency"
          onClick={() => setCurrencyToDelete(currency)} // CHANGED onClick
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
      title="Manage Currencies"
      addHref="/currencies/new"
      addLabel="Add New Currency"
    >
      <DataTableWrapper<ApiAdminCurrency>
        columns={columns}
        data={currencies}
        isLoading={loading}
        error={error}
        renderRow={renderCurrencyRow}
        skeletonCells={currencySkeletonCells}
        loadingRowCount={3}
      />

      {/* Delete Confirmation Dialog */}
      {currencyToDelete && (
        <AlertDialog
          open={!!currencyToDelete}
          onOpenChange={(open) => !open && setCurrencyToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                currency
                <span className="font-semibold">
                  {" "}
                  "{currencyToDelete.name}" ({currencyToDelete.code})
                </span>
                . Make sure this currency is not actively used by any country.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCurrencyToDelete(null)}>
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
