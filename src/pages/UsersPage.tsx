import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminFetchUsers, adminDeleteUser } from "@/services/api";
import type { ApiBaseUser } from "@/types/api";
import {
  ColumnDefinition,
  DataTableWrapper,
} from "@/components/layout/DataTableWrapper";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PaginationControls } from "@/components/layout/PaginationControls";
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
import { Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react"; // Added Check/X icons
import { toast } from "sonner";
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // For Role/Status

const PAGE_SIZE = 10; // Define page size

// Helper function to format dates
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

const columns: ColumnDefinition<ApiBaseUser>[] = [
  { key: "email", header: "Email" },
  { key: "name", header: "Name" },
  { key: "role", header: "Role" },
  { key: "isValidated", header: "Validated" },
  { key: "isOauth", header: "OAuth" },
  { key: "createdAt", header: "Registered" },
  {
    key: "actions",
    header: "Actions",
    className: "w-[130px] text-right", // Adjusted width
  },
];

const userSkeletonCells = [
  <TableCell key="sk-email">
    <Skeleton className="h-4 w-40" />
  </TableCell>,
  <TableCell key="sk-name">
    <Skeleton className="h-4 w-32" />
  </TableCell>,
  <TableCell key="sk-role">
    <Skeleton className="h-5 w-16" />
  </TableCell>,
  <TableCell key="sk-validated">
    <Skeleton className="h-4 w-4 mx-auto" />
  </TableCell>,
  <TableCell key="sk-oauth">
    <Skeleton className="h-4 w-4 mx-auto" />
  </TableCell>,
  <TableCell key="sk-date">
    <Skeleton className="h-4 w-36" />
  </TableCell>,
  <TableCell key="sk-actions" className="text-right">
    <Skeleton className="h-8 w-28" />
  </TableCell>,
];

export function UsersPage() {
  const [users, setUsers] = useState<ApiBaseUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMorePages, setHasMorePages] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<ApiBaseUser | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);
        const { users, count } = await adminFetchUsers({
          page: currentPage,
          pageSize: PAGE_SIZE,
        });
        setUsers(users);
        setTotalPages(Math.ceil(count / PAGE_SIZE));
        setHasMorePages(currentPage < Math.ceil(count / PAGE_SIZE));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        setUsers([]);
        setHasMorePages(false);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await adminDeleteUser(userToDelete.id);
      // Optimistic update or re-fetch current page
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      // Note: This might leave the page with fewer items than PAGE_SIZE.
      // A more robust solution might re-fetch the current page after delete.
      toast.success("User Deleted", {
        description: `User "${userToDelete.email}" has been deleted.`,
      });
      setUserToDelete(null);
    } catch (err) {
      toast.error("Delete Failed", {
        description:
          err instanceof Error ? err.message : "Could not delete user.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderUserRow = (user: ApiBaseUser) => (
    <>
      <TableCell className="font-medium">{user.email}</TableCell>
      <TableCell>
        {user.firstName} {user.lastName ?? ""}
      </TableCell>
      <TableCell>
        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
          {user.role}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        {user.isValidated ? (
          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive mx-auto" />
        )}
      </TableCell>
      <TableCell className="text-center">
        {user.isOauth ? (
          <CheckCircle className="h-4 w-4 text-blue-600 mx-auto" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
        )}
      </TableCell>
      <TableCell>{formatDate(user.createdAt)}</TableCell>
      <TableCell className="text-right space-x-1">
        <Button variant="ghost" size="icon" asChild title="View User Details">
          <Link to={`/users/${user.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        {/* Edit might go to the same page as View for now */}
        <Button variant="ghost" size="icon" asChild title="Edit User">
          <Link to={`/users/${user.id}`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Delete User"
          onClick={() => setUserToDelete(user)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </>
  );

  return (
    <PageWrapper title="Manage Users">
      <DataTableWrapper<ApiBaseUser>
        columns={columns}
        data={users}
        isLoading={loading}
        error={error}
        renderRow={renderUserRow}
        skeletonCells={userSkeletonCells}
        loadingRowCount={PAGE_SIZE}
      />
      <PaginationControls
        currentPage={currentPage}
        canGoPrev={currentPage > 1}
        canGoNext={hasMorePages}
        onPageChange={handlePageChange}
        totalPages={totalPages}
      />

      {/* Delete Confirmation Dialog */}
      {userToDelete && (
        <AlertDialog
          open={!!userToDelete}
          onOpenChange={(open) => !open && setUserToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                user account for{" "}
                <span className="font-semibold">{userToDelete.email}</span> and
                all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </PageWrapper>
  );
}
