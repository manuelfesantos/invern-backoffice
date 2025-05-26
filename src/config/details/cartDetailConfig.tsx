// src/config/details/cartDetailConfig.tsx
import { DomainDetailConfig } from "@/types/detail-config.ts"; // Adjust path, Add ApiLineItem
import { adminFetchCartById } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Import Table components
import { Link } from "react-router-dom";
import { ApiCart, ApiLineItem } from "@/types/api.ts"; // To link to product pages

// Helper function to format dates (keep if not already defined globally)
function formatDate(dateString: string | null | undefined) {
  return dateString ? new Date(dateString).toLocaleString() : "N/A";
}

// Helper function to format price (keep or import)
function formatPrice(priceInCents: number | null | undefined) {
  if (priceInCents === null || priceInCents === undefined) return "N/A";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR", // Assuming EUR, adjust if currency info is available on cart/product
  }).format(priceInCents / 100);
}

export const cartDetailConfig: DomainDetailConfig<ApiCart> = {
  entityName: "Cart",
  entityNamePlural: "Carts",
  keyField: "id",
  apiConfig: {
    fetchOne: adminFetchCartById,
  },
  fields: [
    // --- Basic Cart Info ---
    { key: "id", label: "Cart ID", className: "font-mono text-xs" },
    {
      key: "isLoggedIn",
      label: "Type",
      format: (loggedIn) => (
        <Badge variant={loggedIn ? "outline" : "secondary"}>
          {loggedIn ? "Logged In User" : "Anonymous"}
        </Badge>
      ),
    },
    { key: "createdAt", label: "Created On", format: formatDate },
    { key: "lastModifiedAt", label: "Last Modified", format: formatDate },

    // --- Products List ---
    {
      key: "products", // Target the products array
      label: "Products In Cart", // Label for the section/field
      // Custom formatter to render a table of products
      format: (products: ApiLineItem[] | undefined) => {
        if (!products || products.length === 0) {
          return (
            <span className="text-muted-foreground italic">Cart is empty</span>
          );
        }

        return (
          <div className="border rounded-md overflow-hidden">
            {" "}
            {/* Optional wrapper */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Price (Unit)</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <img
                        src={item.images?.[0]?.url || "/placeholder.svg"} // Use placeholder if no image
                        alt={item.images?.[0]?.alt || item.name}
                        className="h-10 w-10 object-contain rounded border"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {/* Optional: Link to product detail page */}
                      <Link
                        to={`/products/${item.id}`}
                        className="hover:underline"
                      >
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(item.priceInCents)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatPrice(item.priceInCents * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      },
      // Ensure this field spans full width if using columns
      className: "col-span-full",
      labelClassName: "sr-only", // Hide label as section title is used
    },
  ],
  // Layout configuration to structure the details
  layout: {
    columns: 1, // Keep main layout simple or adjust as needed
    mainClassName: "grid-cols-[max-content_1fr]", // For label/value pairs
    sections: [
      {
        title: "Cart Summary",
        fields: ["id", "isLoggedIn", "createdAt", "lastModifiedAt"],
        className: "mb-6", // Add spacing below summary
      },
      {
        title: "Cart Items",
        fields: ["products"], // Reference the products field key
      },
    ],
  },
  routes: {
    list: "/carts",
  },
  messages: {
    loadError: "Could not load cart details.",
    notFound: "Cart not found.",
  },
};
