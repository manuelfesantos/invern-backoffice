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

// Based on #/components/schemas/Cart
export type ApiCart = {
  id: string;
  createdAt: string; // date-time
  lastModifiedAt: string; // date-time
  isLoggedIn: boolean;
  products: ApiLineItem[]; // Assuming ApiLineItem is defined or needs definition
};

// Based on #/components/schemas/LineItem (used in Cart) - Assuming it's similar to ApiProduct with quantity
export interface ApiLineItem extends ApiProduct {
  quantity: number;
}

// Based on #/components/schemas/BaseUser
export type ApiBaseUser = {
  id: string;
  cartId?: string | null; // Assuming cartId is optional
  email: string;
  firstName: string;
  lastName?: string | null;
  address?: ApiAddress | null; // Assuming ApiAddress is defined or needs definition
  createdAt: string; // date-time
  lastModifiedAt: string; // date-time
  version: number;
  role: "ADMIN" | "USER";
  isOauth: boolean;
  googleUserId?: string | null;
  isValidated: boolean;
};

// Based on #/components/schemas/Address (used in BaseUser)
export interface ApiAddress {
  street: string;
  houseNumber: string;
  apartment?: string | null;
  postalCode: string;
  city: string;
  province?: string | null;
  country: string; // 2-letter code
}

// Based on #/components/schemas/Order
export interface ApiOrder {
  id: string;
  createdAt: string; // date-time
  lastModifiedAt: string; // date-time
  products: ApiLineItem[]; // Assuming ApiLineItem is defined
  address: ApiAddress; // Assuming ApiAddress is defined
  personalDetails: {
    // Based on UserDetails schema
    email: string;
    firstName: string;
    lastName?: string | null;
  };
  shippingMethod: ApiSelectedShippingMethod; // Assuming ApiSelectedShippingMethod defined
  payment?: ApiClientPayment | null; // Assuming ApiClientPayment defined
  shippingTransaction: ApiShippingTransaction; // Assuming ApiShippingTransaction defined
  userId?: string | null;
  paymentId?: string | null;
  stripeId: string;
  isCanceled?: boolean | null;
}

// Based on #/components/schemas/SelectedShippingMethod (used in Order)
export interface ApiSelectedShippingMethod {
  id: string;
  name: string;
  rate: ApiShippingRate; // Assuming ApiShippingRate defined
  // Add createdAt/lastModifiedAt if they exist in BaseShippingMethod
}

// Based on #/components/schemas/ShippingRate (used in SelectedShippingMethod)
export interface ApiShippingRate {
  priceInCents: number;
  minWeight: number;
  maxWeight: number;
  deliveryTime: number;
  countryCodes: string[];
}

// Based on #/components/schemas/ClientPayment (used in Order)
export interface ApiClientPayment {
  state:
    | "draft"
    | "succeeded"
    | "canceled"
    | "created"
    | "processing"
    | "failed";
  netAmount?: number | null;
  grossAmount: number;
  paymentMethod?: {
    type: "card" | "paypal";
    brand?: string | null;
    last4?: string | null;
  } | null;
}

// Based on #/components/schemas/ShippingTransaction (used in Order)
export interface ApiShippingTransaction {
  id: string;
  status: "processing" | "shipped" | "delivered" | "canceled";
  trackingUrl?: string | null;
  createdAt: string; // date-time
  lastModifiedAt: string; // date-time
}

// Based on #/components/schemas/UpdateAdminOrderInput
export interface ApiUpdateAdminOrderInput {
  isCanceled?: boolean;
  // Add other fields defined in the schema if needed, e.g., shippingTransactionId
}

// Based on #/components/schemas/SecretKeyInput
export interface ApiSecretKeyInput {
  secretKey: string;
}

// Specific type for GET /private/stock/{productId} response data
export interface ApiStockResponse {
  stock: number;
}

// Parameter types for endpoints with query params
export interface ApiAdminListParams {
  page?: number;
  pageSize?: number;
}

export interface ApiAdminOrderListParams extends ApiAdminListParams {
  userId?: string;
  paymentId?: string;
  stripeId?: string;
  shippingTransactionId?: string;
}
