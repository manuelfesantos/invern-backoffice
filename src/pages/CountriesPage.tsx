// src/pages/CountriesPage.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchCountries, deleteCountry } from "@/services/api";
import type { ApiClientCountry } from "@/types/api";
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

const columns: ColumnDefinition<ApiClientCountry>[] = [
  { key: "code", header: "Code", className: "w-[100px]" },
  { key: "name", header: "Name" },
  { key: "locale", header: "Locale" },
  { key: "currency", header: "Currency" },
  {
    key: "actions",
    header: "Actions",
    className: "w-[100px] text-right",
  },
];

const countrySkeletonCells = [
  <TableCell key="sk-code">
    <Skeleton className="h-5 w-16" />
  </TableCell>,
  <TableCell key="sk-name">
    <Skeleton className="h-5 w-48" />
  </TableCell>,
  <TableCell key="sk-locale">
    <Skeleton className="h-5 w-24" />
  </TableCell>,
  <TableCell key="sk-currency">
    <Skeleton className="h-5 w-16" />
  </TableCell>,
  <TableCell key="sk-actions" className="text-right">
    <Skeleton className="h-8 w-20" />
  </TableCell>,
];

export function CountriesPage() {
  const [countries, setCountries] = useState<ApiClientCountry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [countryToDelete, setCountryToDelete] =
    useState<ApiClientCountry | null>(null);

  useEffect(() => {
    async function loadCountries() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCountries();
        setCountries(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        setCountries([]);
      } finally {
        setLoading(false);
      }
    }
    loadCountries();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!countryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCountry(countryToDelete.code);
      setCountries((prev) =>
        prev.filter((c) => c.code !== countryToDelete.code),
      );
      toast.success("Country Deleted", {
        description: `Country "${countryToDelete.name}" (${countryToDelete.code}) has been deleted.`,
      });
      setCountryToDelete(null);
    } catch (err) {
      toast.error("Delete Failed", {
        description:
          err instanceof Error ? err.message : "Could not delete country.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderCountryRow = (country: ApiClientCountry) => (
    <>
      <TableCell className="font-medium">{country.code}</TableCell>
      <TableCell>{country.name}</TableCell>
      <TableCell>{country.locale}</TableCell>
      <TableCell>
        {country.currency?.code} ({country.currency?.symbol})
      </TableCell>
      <TableCell className="text-right space-x-1">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/countries/${country.code}`} title="Edit Country">
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
        {/* REMOVED AlertDialogTrigger */}
        <Button
          variant="ghost"
          size="icon"
          title="Delete Country"
          onClick={() => setCountryToDelete(country)} // CHANGED onClick
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
      title="Manage Countries"
      addHref="/countries/new"
      addLabel="Add New Country"
    >
      <DataTableWrapper<ApiClientCountry>
        columns={columns}
        data={countries}
        isLoading={loading}
        error={error}
        renderRow={renderCountryRow}
        skeletonCells={countrySkeletonCells}
        loadingRowCount={4}
      />

      {/* Delete Confirmation Dialog */}
      {countryToDelete && (
        <AlertDialog
          open={!!countryToDelete}
          onOpenChange={(open) => !open && setCountryToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                country
                <span className="font-semibold">
                  {" "}
                  "{countryToDelete.name}" ({countryToDelete.code})
                </span>
                . This might affect associated taxes or shipping rates.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCountryToDelete(null)}>
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
