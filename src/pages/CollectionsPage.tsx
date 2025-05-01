// src/pages/CollectionsPage.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchCollections, deleteCollection } from "@/services/api";
import type { ApiCollection } from "@/types/api";
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

const columns: ColumnDefinition<ApiCollection>[] = [
  { key: "name", header: "Name" },
  {
    key: "actions",
    header: "Actions",
    className: "w-[100px] text-right",
  },
];

const collectionSkeletonCells = [
  <TableCell key="sk-name">
    <Skeleton className="h-5 w-48" />
  </TableCell>,
  <TableCell key="sk-actions" className="text-right">
    <Skeleton className="h-8 w-20" />
  </TableCell>,
];

export function CollectionsPage() {
  const [collections, setCollections] = useState<ApiCollection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [collectionToDelete, setCollectionToDelete] =
    useState<ApiCollection | null>(null);

  useEffect(() => {
    async function loadCollections() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCollections();
        setCollections(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        setCollections([]);
      } finally {
        setLoading(false);
      }
    }
    loadCollections();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!collectionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCollection(collectionToDelete.id);
      setCollections((prev) =>
        prev.filter((c) => c.id !== collectionToDelete.id),
      );
      toast.success("Collection Deleted", {
        description: `Collection "${collectionToDelete.name}" has been deleted.`,
      });
      setCollectionToDelete(null);
    } catch (err) {
      toast.error("Delete Failed", {
        description:
          err instanceof Error ? err.message : "Could not delete collection.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderCollectionRow = (collection: ApiCollection) => (
    <>
      <TableCell>{collection.name}</TableCell>
      <TableCell className="text-right space-x-1">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/collections/${collection.id}`} title="Edit Collection">
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
        {/* REMOVED AlertDialogTrigger */}
        <Button
          variant="ghost"
          size="icon"
          title="Delete Collection"
          onClick={() => setCollectionToDelete(collection)} // CHANGED onClick
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
      title="Manage Collections"
      addHref="/collections/new"
      addLabel="Add New Collection"
    >
      <DataTableWrapper<ApiCollection>
        columns={columns}
        data={collections}
        isLoading={loading}
        error={error}
        renderRow={renderCollectionRow}
        skeletonCells={collectionSkeletonCells}
        loadingRowCount={3} // Adjust skeleton count if needed
      />

      {/* Delete Confirmation Dialog */}
      {collectionToDelete && (
        <AlertDialog
          open={!!collectionToDelete}
          onOpenChange={(open) => !open && setCollectionToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                collection
                <span className="font-semibold">
                  {" "}
                  "{collectionToDelete.name}"
                </span>
                . Deleting a collection might affect associated products.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCollectionToDelete(null)}>
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
