import type { ReactNode } from "react";
import type { DomainEntity } from "./form-config"; // Re-use DomainEntity if suitable

// Configuration for a single field to display
export interface DetailFieldConfig<TApiOutput extends DomainEntity> {
  key: string; // Path to the data field (e.g., 'name', 'address.street')
  label: string; // Display label for the field
  format?: (value: any, entity: TApiOutput) => ReactNode; // Optional custom formatter
  renderIf?: (entity: TApiOutput) => boolean; // Optional condition to render this field
  className?: string; // Optional class for the value element (dd)
  labelClassName?: string; // Optional class for the label element (dt)
}

// API configuration specific to fetching details
export interface DetailApiConfig<TApiOutput extends DomainEntity> {
  fetchOne: (id: string) => Promise<TApiOutput>;
}

// Layout configuration
export interface DetailLayoutConfig<TApiOutput extends DomainEntity> {
  sections?: {
    title?: string;
    description?: string;
    fields: (keyof TApiOutput | string)[]; // Keys matching DetailFieldConfig.key
    className?: string; // Optional class for the section div
    renderIf?: (entity: TApiOutput) => boolean; // Optional condition to render this section
  }[];
  columns?: 1 | 2; // Number of columns for the main detail area
  mainClassName?: string; // Optional class for the main content container (dl or grid div)
}

// Main configuration for the DomainDetailPage
export interface DomainDetailConfig<TApiOutput extends DomainEntity> {
  entityName: string; // e.g., "User", "Cart"
  entityNamePlural: string; // e.g., "Users", "Carts"
  keyField: keyof TApiOutput & string; // Field in the API response representing the ID (e.g., 'id')
  apiConfig: DetailApiConfig<TApiOutput>;
  fields: DetailFieldConfig<TApiOutput>[];
  layout?: DetailLayoutConfig<TApiOutput>;
  routes: {
    list: string; // URL to navigate back to the list page
    edit?: (id: string) => string; // Optional URL for the edit button
  };
  messages: {
    loadError: string; // Error message if fetching fails
    notFound?: string; // Optional specific message for 404
  };
  // Optional: Add custom actions if needed beyond Edit
  // customActions?: (entity: TApiOutput) => ReactNode[];
}
