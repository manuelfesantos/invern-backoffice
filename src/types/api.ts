// src/types/api.ts

// Based on #/components/schemas/ImageDTO
export interface ApiImage {
  url: string;
  alt: string;
}

// Based on #/components/schemas/ExtendedClientTax
export interface ApiTax {
  name: string;
  rate: number; // e.g., 0.23
  amount: number; // in cents
}

// Based on #/components/schemas/ExtendedProduct
export interface ApiProduct {
  id: string;
  name: string;
  stock: number;
  weight: number; // in grams
  images: ApiImage[];
  priceInCents: number; // in cents
  taxes: ApiTax[];
  description?: string; // Add if available in ExtendedProductDetails/ExtendedProductWithCollectionDetails if needed later
  // Add other fields from ExtendedProductDetails if needed, like description
}

// Based on #/components/schemas/Collection
export interface ApiCollection {
  id: string;
  name: string;
  image: ApiImage;
  description?: string; // Add if available in CollectionDetails if needed later
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  issues?: string[]; // Include issues for error responses if standardizing
}

// Specific response type for successful product creation (returns ID)
export interface ApiAdminProductCreateResponse {
  message: string;
  data: {
    productId: string;
  };
}

// Specific response type for successful deletes/generic success
export interface ApiAdminSuccessResponse {
  message: string;
  data?: unknown; // Data might be null or absent
}

export interface ApiProductCollectionInfo {
  id: string;
  name: string;
}

// Based on #/components/schemas/ExtendedProductWithCollectionDetails
export interface ApiProductDetail extends ApiProduct {
  // Extends the basic ApiProduct
  description: string;
  collection: ApiProductCollectionInfo;
  // Note: ApiProduct already includes images, priceInCents, grossPrice, taxes etc.
}

// Based on #/components/schemas/ExtendedCollectionDetails
export interface ApiCollectionDetail extends ApiCollection {
  // Extends the basic ApiCollection
  description: string;
  products: ApiProduct[]; // Uses the extended product type with prices/taxes
}

// Based roughly on ApiCollection, excluding read-only id
export interface ApiCollectionInput {
  name: string;
  description: string;
  image: ApiImage; // Assuming we send the full image object
}

export interface ApiProductInput {
  name: string;
  description: string; // Assuming description is part of the base data now
  priceInCents: number;
  stock: number;
  weight: number;
  images: ApiImage[]; // Assuming we send the full image objects
  collectionId: string; // Need to associate with a collection
}

// Based on #/components/schemas/ClientCurrency (also used in Country)
export type ApiClientCurrency = {
  name: string;
  code: string; // 3-letter uppercase
  symbol: string;
  stripeName: string;
};

// Based on #/components/schemas/Currency (Full details)
export type ApiAdminCurrency = ApiClientCurrency & {
  rateToEuro: number;
};

// Based on #/components/schemas/InsertCurrency
export interface ApiAdminCurrencyInput {
  name: string;
  code: string; // 3-letter uppercase
  symbol: string;
  rateToEuro: number;
  stripeName: string;
}

// --- Country Types ---

// Based on #/components/schemas/ClientCountry (used for listing)
export interface ApiClientCountry {
  name: string;
  code: string; // 2-letter uppercase
  locale: string;
  currency: ApiClientCurrency; // Nested currency info
  // Removed taxes as it's not in the /private/countries GET response schema
}

// Based on #/components/schemas/Country (Full details, needed for GET by code / POST/PUT responses)
// Assuming Tax schema is defined if needed, but it's not directly in the private country endpoints response/request bodies shown.
export type ApiAdminCountry = {
  name: string;
  code: string; // 2-letter uppercase
  locale: string;
  currency: ApiClientCurrency; // Nested currency info
  // taxes: ApiTax[]; // Add if the GET /private/countries/{code} actually returns this
};

// Based on #/components/schemas/InsertCountry
export interface ApiAdminCountryInput {
  name: string;
  code: string; // 2-letter uppercase
  locale: string;
  currencyCode: string; // 3-letter uppercase currency code
}

// --- NEW Order Related Types Start ---

// Based on #/components/schemas/AddressInput
export interface ApiAddressInput {
  street: string;
  houseNumber: string;
  apartment?: string | null;
  postalCode: string;
  city: string;
  province?: string | null;
}

// Based on #/components/schemas/Address
export interface ApiAddress extends ApiAddressInput {
  country: string; // 2-letter code
}

// Based on #/components/schemas/UserDetailsInput
export interface ApiUserDetailsInput {
  email: string;
  firstName: string;
  lastName?: string | null;
}

// Based on #/components/schemas/UserDetails
// Note: This is essentially the same as UserDetailsInput in the provided spec
export type ApiUserDetails = ApiUserDetailsInput;

// Based on #/components/schemas/LineItem
// Incorporates base product fields directly for simplicity
export interface ApiLineItem {
  id: string; // Product ID
  name: string;
  priceInCents: number; // Net price of the product itself
  stock: number; // Stock *at time of order* or current? Usually snapshot.
  weight: number;
  images: ApiImage[];
  quantity: number;
}

// Based on #/components/schemas/LineItemError
export interface ApiLineItemError {
  message: string;
  type: "NOT_ENOUGH_STOCK"; // Add other possible error types here
}

// Based on #/components/schemas/ExtendedLineItem
export interface ApiExtendedLineItem extends ApiLineItem {
  netPrice: number; // Total net price for this line item (product price * quantity)
  grossPrice: number; // Total gross price for this line item (including taxes)
  taxes: ApiTax[]; // Taxes applicable to this line item with calculated amounts
  issues?: ApiLineItemError[];
}

// Based on #/components/schemas/BaseShippingMethod
export interface ApiBaseShippingMethod {
  id: string; // UUID
  name: string;
}

// Based on #/components/schemas/ShippingRate
export interface ApiShippingRate {
  priceInCents: number;
  minWeight: number;
  maxWeight: number;
  deliveryTime: number; // Business days
  countryCodes: string[]; // 2-letter codes
}

// Based on #/components/schemas/SelectedShippingMethod
export interface ApiSelectedShippingMethod extends ApiBaseShippingMethod {
  rate: ApiShippingRate;
}

// Based on #/components/schemas/PaymentMethod
export interface ApiPaymentMethod {
  type: "card" | "paypal"; // Add other payment types if supported
  brand?: string | null;
  last4?: string | null;
}

// Based on #/components/schemas/ClientPayment
export interface ApiClientPayment {
  state:
    | "draft"
    | "succeeded"
    | "canceled"
    | "created"
    | "processing"
    | "failed";
  netAmount?: number | null; // in cents
  grossAmount: number; // in cents
  paymentMethod?: ApiPaymentMethod | null;
}

// Based on #/components/schemas/ShippingTransaction
export interface ApiShippingTransaction {
  id: string; // UUID
  status: "processing" | "shipped" | "delivered" | "canceled";
  trackingUrl?: string | null;
}

// Based on #/components/schemas/ClientOrder
export interface ApiClientOrder {
  id: string; // Order UUID
  createdAt: string; // ISO Date string
  lastModifiedAt: string; // ISO Date string
  products: ApiLineItem[]; // Uses basic LineItem here
  address: ApiAddress;
  personalDetails: ApiUserDetails;
  shippingMethod: ApiSelectedShippingMethod;
  payment?: ApiClientPayment | null;
  shippingTransaction: ApiShippingTransaction;
  isCanceled: boolean;
}

// Based on #/components/schemas/ExtendedClientOrder
export interface ApiExtendedClientOrder
  extends Omit<ApiClientOrder, "products"> {
  // Re-define products with the extended type
  products: ApiExtendedLineItem[];
  // Add fields from ExtendedClientOrder
  taxes: ApiTax[]; // Aggregated taxes for the whole order
  currency: ApiClientCurrency;
  status:
    | "processing_payment"
    | "packaging"
    | "shipping"
    | "completed"
    | "canceled"
    | "error"; // Calculated overall order status
}

// Based on #/components/schemas/GetOrderResponse
export interface GetOrderResponse {
  message: string;
  data: {
    order: ApiExtendedClientOrder;
    accessToken: string; // User's access token might be refreshed
  };
}
