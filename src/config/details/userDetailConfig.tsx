import { DomainDetailConfig } from "@/types/detail-config.ts"; // Adjust path as needed
import { adminFetchUserById } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { ApiBaseUser } from "@/types/api.ts";

// Helper function to format dates
function formatDate(dateString: string | null | undefined) {
  return dateString ? new Date(dateString).toLocaleString() : "N/A";
}

// Helper function for boolean display
function formatBoolean(value: boolean | null | undefined) {
  if (value === true) return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (value === false) return <XCircle className="h-4 w-4 text-destructive" />;
  return <span className="text-muted-foreground italic">N/A</span>;
}

export const userDetailConfig: DomainDetailConfig<ApiBaseUser> = {
  entityName: "User",
  entityNamePlural: "Users",
  keyField: "id",
  apiConfig: {
    fetchOne: adminFetchUserById,
  },
  fields: [
    { key: "id", label: "User ID", className: "font-mono text-xs" },
    { key: "email", label: "Email" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    {
      key: "role",
      label: "Role",
      format: (role) => (
        <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
          {role}
        </Badge>
      ),
    },
    { key: "isValidated", label: "Email Validated", format: formatBoolean },
    { key: "isOauth", label: "OAuth Login", format: formatBoolean },
    {
      key: "googleUserId",
      label: "Google User ID",
      renderIf: (user) => user.isOauth,
    },
    { key: "address.street", label: "Street" },
    { key: "address.houseNumber", label: "House No." },
    { key: "address.apartment", label: "Apartment" },
    { key: "address.postalCode", label: "Postal Code" },
    { key: "address.city", label: "City" },
    { key: "address.province", label: "Province/State" },
    { key: "address.country", label: "Country Code" },
    { key: "createdAt", label: "Registered On", format: formatDate },
    { key: "lastModifiedAt", label: "Last Updated", format: formatDate },
    { key: "version", label: "Version" },
  ],
  layout: {
    columns: 2, // Use 2 columns for layout
    sections: [
      {
        title: "Account Information",
        fields: [
          "id",
          "email",
          "role",
          "isValidated",
          "isOauth",
          "googleUserId",
          "createdAt",
          "lastModifiedAt",
          "version",
        ],
        className: "col-span-full md:col-span-1", // Span full on small, 1 col on medium+
      },
      {
        title: "Personal Details",
        fields: ["firstName", "lastName"],
        className: "col-span-full md:col-span-1",
      },
      {
        title: "Address",
        renderIf: (user) => !!user.address, // Only show section if address exists
        fields: [
          "address.street",
          "address.houseNumber",
          "address.apartment",
          "address.postalCode",
          "address.city",
          "address.province",
          "address.country",
        ],
        className: "col-span-full md:col-span-1",
      },
    ],
    mainClassName: "md:grid-cols-[max-content_1fr]", // Default single column for section content on smaller screens
  },
  routes: {
    list: "/users",
    // edit: (id) => `/users/${id}/edit`, // Add if you have a separate edit form/page
  },
  messages: {
    loadError: "Could not load user details.",
    notFound: "User not found.",
  },
};
