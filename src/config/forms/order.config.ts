// src/config/forms/order.config.ts
import { z } from "zod";
import { DomainFormConfig } from "@/types/form-config";
import { fetchOrderById, fetchOrders } from "@/services/api"; // Import fetchOrders as well
import type { ExtendedClientOrder } from "@/types/api"; // Use the detailed order type

// --- Zod Schema for Order Data (matching ExtendedClientOrder) ---
// Define nested schemas first for clarity
const clientCurrencySchema = z.object({
  name: z.string(),
  code: z.string().length(3),
  symbol: z.string(),
  stripeName: z.string(),
});

const extendedClientTaxSchema = z.object({
  name: z.string(),
  rate: z.number(),
  amount: z.number().int(),
});

const imageDTOSchema = z.object({
  url: z.string().url(),
  alt: z.string(),
});

const lineItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  priceInCents: z.number().int(),
  stock: z.number().int(),
  weight: z.number().int(),
  images: z.array(imageDTOSchema),
  quantity: z.number().int().min(1),
});

const lineItemErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["NOT_ENOUGH_STOCK"]), // Add other potential error types
});

const extendedLineItemSchema = lineItemSchema.extend({
  netPrice: z.number().int(),
  grossPrice: z.number().int(),
  taxes: z.array(extendedClientTaxSchema),
  issues: z.array(lineItemErrorSchema).optional(), // Assuming issues might not always be present
});

const addressSchema = z.object({
  street: z.string(),
  houseNumber: z.string(),
  apartment: z.string().nullable().optional(),
  postalCode: z.string(),
  city: z.string(),
  province: z.string().nullable().optional(),
  country: z.string().length(2),
});

const userDetailsSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string().nullable().optional(),
});

const shippingRateSchema = z.object({
  priceInCents: z.number().int(),
  minWeight: z.number().int(),
  maxWeight: z.number().int(),
  deliveryTime: z.number().int(),
  countryCodes: z.array(z.string().length(2)),
});

const selectedShippingMethodSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  rate: shippingRateSchema,
});

const paymentMethodSchema = z.object({
  type: z.enum(["card", "paypal"]), // Add other types if applicable
  brand: z.string().nullable().optional(),
  last4: z.string().nullable().optional(),
});

const clientPaymentSchema = z.object({
  state: z.enum([
    "draft",
    "succeeded",
    "canceled",
    "created",
    "processing",
    "failed",
  ]),
  netAmount: z.number().int().nullable().optional(),
  grossAmount: z.number().int(),
  paymentMethod: paymentMethodSchema.nullable().optional(),
});

const shippingTransactionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["processing", "shipped", "delivered", "canceled"]),
  trackingUrl: z.string().url().nullable().optional(),
});

// --- Main Order Schema ---
const orderSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  lastModifiedAt: z.string().datetime(),
  products: z.array(extendedLineItemSchema),
  address: addressSchema,
  personalDetails: userDetailsSchema,
  shippingMethod: selectedShippingMethodSchema,
  payment: clientPaymentSchema.nullable().optional(),
  shippingTransaction: shippingTransactionSchema,
  isCanceled: z.boolean(),
  taxes: z.array(extendedClientTaxSchema),
  currency: clientCurrencySchema,
  status: z.enum([
    "processing_payment",
    "packaging",
    "shipping",
    "completed",
    "canceled",
    "error",
  ]),
});

// Derive form values type from schema - useful even for display/detail views
export type OrderDisplayValues = z.infer<typeof orderSchema>;

// --- Helper Function for Formatting ---
// (You might have these globally)
const formatCurrency = (
  amountInCents: number,
  currencyCode = "EUR",
  locale = "en-US",
) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(amountInCents / 100);
};

const formatDate = (dateString: string, locale = "en-US") => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
};

// --- DomainFormConfig for Orders (Primarily for Viewing) ---
export const orderConfig: DomainFormConfig<
  OrderDisplayValues, // Using the Zod schema type
  never, // No dedicated Input type as orders aren't created/updated this way
  ExtendedClientOrder // API returns this type
> = {
  entityName: "Order",
  entityNamePlural: "Orders",
  schema: orderSchema,
  keyField: "id", // The unique identifier for an order
  fields: [
    // --- Fields for Display ---
    // These would typically be rendered using custom display components, not standard form inputs
    {
      name: "id",
      label: "Order ID",
      component: "Display", // Indicates read-only display
      defaultValue: "",
    },
    {
      name: "status",
      label: "Status",
      component: "StatusBadge", // Custom component to show status visually
      defaultValue: "processing_payment",
    },
    {
      name: "createdAt",
      label: "Order Date",
      component: "Display",
      defaultValue: "",
      transform: { output: (value) => formatDate(value as string) },
    },
    {
      name: "personalDetails",
      label: "Customer",
      component: "CustomerDisplay", // Custom component
      defaultValue: { email: "", firstName: "", lastName: "" },
      transform: {
        output: (value) => {
          const details = value as OrderDisplayValues["personalDetails"];
          return `${details.firstName} ${details.lastName || ""} (${details.email})`;
        },
      },
    },
    {
      name: "address",
      label: "Shipping Address",
      component: "AddressDisplay", // Custom component
      defaultValue: {
        street: "",
        houseNumber: "",
        postalCode: "",
        city: "",
        country: "",
      },
    },
    {
      name: "products",
      label: "Items",
      component: "OrderItemsList", // Custom component
      defaultValue: [],
    },
    {
      name: "shippingMethod",
      label: "Shipping Method",
      component: "ShippingDisplay", // Custom component
      defaultValue: { id: "", name: "", rate: {} as any }, // Provide default structure
      transform: {
        output: (value) => {
          const method = value as OrderDisplayValues["shippingMethod"];
          return `${method.name} (${formatCurrency(method.rate.priceInCents, method.rate.countryCodes[0] || "EUR")})`; // Example formatting
        },
      },
    },
    {
      name: "payment",
      label: "Payment",
      component: "PaymentDisplay", // Custom component
      defaultValue: null,
    },
    {
      name: "shippingTransaction",
      label: "Shipment Status",
      component: "ShippingStatusDisplay", // Custom component
      defaultValue: { id: "", status: "processing", trackingUrl: null },
    },
    {
      name: "isCanceled",
      label: "Canceled",
      component: "BooleanDisplay", // Custom component
      defaultValue: false,
    },
    {
      name: "currency",
      label: "Currency",
      component: "Display",
      defaultValue: { name: "", code: "", symbol: "", stripeName: "" },
      transform: { output: (value) => (value as any).code },
    },
    // Calculated Totals (might be displayed separately)
    // Need a way to display totals derived from items + shipping + taxes
    // For example, create a pseudo-field or handle in the UI component
    /*
            {
                name: 'totalGross', // Example pseudo-field
                label: 'Order Total (Gross)',
                component: 'PriceDisplay',
                // Calculation would happen based on products + shippingMethod.rate.priceInCents
                defaultValue: 0,
            },
            */
  ],
  apiConfig: {
    // Primarily for fetching data for display
    fetchOne: fetchOrderById,
    // `fetchAll` isn't directly used by DomainForm but needed for the list page
    // We can add a placeholder or the actual function if the config structure demands it
    // fetchAll: fetchOrders, // Add if needed by consuming components or a generic structure
    create: async () => {
      throw new Error("Orders cannot be created directly via this form.");
    },
    update: async () => {
      throw new Error("Orders cannot be updated directly via this form.");
    },
    // Transformation might be needed if API structure differs slightly from Zod schema
    transformApiToForm: (apiData: ExtendedClientOrder): OrderDisplayValues => {
      // Add any necessary transformations here (e.g., date parsing if not string)
      // Ensure default values for optional fields if API might omit them
      return {
        ...apiData,
        payment: apiData.payment ?? null, // Ensure null if missing
        // Ensure other optional/nullable fields are handled
      };
    },
    // No transformFormToApi needed as we don't submit order edits this way
  },
  routes: {
    list: "/orders", // Route for the list page
    edit: (id) => `/orders/${id}`, // Route for the detail/view page
    new: "", // No "new" route for orders via form
  },
  messages: {
    // Primarily error messages for fetching
    loadError: "Could not load order details.",
    saveError: "Operation not supported.", // Generic for disabled save actions
    createSuccess: () => "Operation not supported.",
    updateSuccess: () => "Operation not supported.",
    dependencyLoadError: "Could not load related data.", // If dependencies were added
  },
  // No dependencies needed typically for viewing orders unless filtering options are dynamic
  dependencies: [],
  // Define layout for the detail view page
  layout: {
    columns: 2, // Example: 2 columns
    sections: [
      {
        title: "Order Summary",
        fields: ["id", "status", "createdAt", "isCanceled"], // Maps to fields defined above
      },
      {
        title: "Customer & Shipping",
        fields: ["personalDetails", "address"],
      },
      {
        title: "Items",
        fields: ["products"], // This field likely spans full width in UI
      },
      {
        title: "Shipping & Payment",
        fields: [
          "shippingMethod",
          "payment",
          "shippingTransaction",
          "currency",
        ],
      },
      // You might add a section for calculated totals if handled via pseudo-fields
    ],
  },
  // No field connections or calculations needed for viewing
  fieldConnections: [],
};
