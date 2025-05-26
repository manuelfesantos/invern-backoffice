import type {
  ApiProduct,
  ApiCollection,
  ApiResponse,
  ApiProductDetail,
  ApiCollectionDetail,
  ApiCollectionInput,
  ApiProductInput,
  ApiClientCountry,
  ApiAdminCountry,
  ApiAdminCountryInput,
  ApiAdminCurrency,
  ApiAdminCurrencyInput,
  ApiAdminSuccessResponse,
  ApiCart,
  ApiBaseUser,
  ApiOrder,
  ApiUpdateAdminOrderInput,
  ApiSecretKeyInput,
  ApiAdminListParams,
  ApiAdminOrderListParams,
} from "@/types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api-local.invernspirit.com";

const CLOUDFLARE_CLIENT_ID = import.meta.env.VITE_ADMIN_CLIENT_ID;
const CLOUDFLARE_CLIENT_SECRET = import.meta.env.VITE_ADMIN_CLIENT_SECRET;

function getAdminHeaders(): HeadersInit {
  if (!CLOUDFLARE_CLIENT_ID || !CLOUDFLARE_CLIENT_SECRET) {
    console.warn(
      "Admin Secret Key (VITE_ADMIN_SECRET_KEY) is not set. Private API calls may fail.",
    );
  }
  return {
    "Content-Type": "application/json",
    "CF-Access-Client-Id": CLOUDFLARE_CLIENT_ID || "",
    "CF-Access-Client-Secret": CLOUDFLARE_CLIENT_SECRET || "",
  };
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("API Error Response:", responseData);
    throw new Error(
      responseData.message ||
        (responseData.issues && responseData.issues.join(", ")) ||
        `HTTP error! status: ${response.status}`,
    );
  }
  return responseData as ApiResponse<T>;
}

export async function fetchProducts(): Promise<ApiProduct[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/products`, {
      headers: getAdminHeaders(),
    });
    const result = await handleResponse<ApiProduct[]>(response);
    return result.data;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
}

export async function fetchCollections(): Promise<ApiCollection[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/collections`, {
      headers: getAdminHeaders(),
    });
    const result = await handleResponse<ApiCollection[]>(response);
    return result.data;
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    throw error;
  }
}

/**
 * Fetches details for a specific product.
 * Corresponds to: GET /public/countries/{countryCode}/products/{id}
 * @param productId - The ID of the product
 * @returns Promise resolving to ApiProductDetail
 */
export async function fetchProductById(
  productId: string,
): Promise<ApiProductDetail> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/products/${productId}`,
      {
        headers: getAdminHeaders(),
      },
    );
    const result = await handleResponse<ApiProductDetail>(response);
    return result.data;
  } catch (error) {
    console.error(`Failed to fetch product ${productId}:`, error);
    throw error;
  }
}

/**
 * Fetches details for a specific collection, including its products.
 * Corresponds to: GET /public/countries/{countryCode}/collections/{id}
 * @param collectionId - The ID of the collection
 * @returns Promise resolving to ApiCollectionDetail
 */
export async function fetchCollectionById(
  collectionId: string,
): Promise<ApiCollectionDetail> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/collections/${collectionId}`,
      {
        headers: getAdminHeaders(),
      },
    );
    const result = await handleResponse<ApiCollectionDetail>(response);
    return result.data;
  } catch (error) {
    console.error(`Failed to fetch collection ${collectionId}:`, error);
    throw error;
  }
}

/**
 * Creates a new product. Assumes POST to the products list endpoint.
 * @param productData - The data for the new product.
 * @returns Promise resolving to the created ApiProductDetail (or relevant response type)
 */
export async function createProduct(
  productData: ApiProductInput,
): Promise<ApiProductDetail> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/products`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(productData),
    });
    const result = await handleResponse<ApiProductDetail>(response);
    return result.data;
  } catch (error) {
    console.error("Failed to create product:", error);
    throw error;
  }
}

/**
 * Updates an existing product. Assumes PUT to the specific product endpoint.
 * @param countryCode - The ISO 2-letter country code (e.g., "PT")
 * @param productId - The ID of the product to update.
 * @param productData - The updated data for the product.
 * @returns Promise resolving to the updated ApiProductDetail (or relevant response type)
 */
export async function updateProduct(
  productId: string,
  productData: ApiProductInput,
): Promise<ApiProductDetail> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/products/${productId}`,
      {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(productData),
      },
    );
    const result = await handleResponse<ApiProductDetail>(response);
    return result.data;
  } catch (error) {
    console.error(`Failed to update product ${productId}:`, error);
    throw error;
  }
}

/**
 * Creates a new collection. Assumes POST to the collections list endpoint.
 * @param collectionData - The data for the new collection.
 * @returns Promise resolving to the created ApiCollectionDetail (or relevant response type)
 */
export async function createCollection(
  collectionData: ApiCollectionInput,
): Promise<ApiCollectionDetail> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/collections`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(collectionData),
    });
    const result = await handleResponse<ApiCollectionDetail>(response);
    return result.data;
  } catch (error) {
    console.error("Failed to create collection:", error);
    throw error;
  }
}

/**
 * Updates an existing collection. Assumes PUT to the specific collection endpoint.
 * @param collectionId - The ID of the collection to update.
 * @param collectionData - The updated data for the collection.
 * @returns Promise resolving to the updated ApiCollectionDetail (or relevant response type)
 */
export async function updateCollection(
  collectionId: string,
  collectionData: ApiCollectionInput,
): Promise<ApiCollectionDetail> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/collections/${collectionId}`,
      {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(collectionData),
      },
    );
    const result = await handleResponse<ApiCollectionDetail>(response);
    return result.data;
  } catch (error) {
    console.error(`Failed to update collection ${collectionId}:`, error);
    throw error;
  }
}

/**
 * Deletes a specific product.
 * Corresponds to: DELETE /public/countries/{countryCode}/products/{id}
 * @param productId - The ID of the product to delete.
 * @returns Promise resolving to the API response (often just a success message or empty on 204)
 */
export async function deleteProduct(
  productId: string,
): Promise<ApiResponse<unknown>> {
  // Assuming the backend returns a simple success message or potentially 204 No Content
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/products/${productId}`,
      {
        method: "DELETE",
        headers: getAdminHeaders(),
      },
    );
    return await handleResponse<unknown>(response);
  } catch (error) {
    console.error(`Failed to delete product ${productId}:`, error);
    throw error;
  }
}

// --- NEW Function: Delete Collection ---
/**
 * Deletes a specific collection.
 * Corresponds to: DELETE /public/countries/{countryCode}/collections/{id}
 * @param collectionId - The ID of the collection to delete.
 * @returns Promise resolving to the API response (often just a success message or empty on 204)
 */
export async function deleteCollection(
  collectionId: string,
): Promise<ApiResponse<unknown>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/collections/${collectionId}`,
      {
        method: "DELETE",
        headers: getAdminHeaders(),
      },
    );
    // Assuming backend returns JSON on success
    return await handleResponse<unknown>(response);
  } catch (error) {
    console.error(`Failed to delete collection ${collectionId}:`, error);
    throw error;
  }
}

// --- Fetch Countries (Admin) ---
/**
 * Fetches all countries (admin view).
 * Corresponds to: GET /private/countries
 */
export async function fetchCountries(): Promise<ApiClientCountry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/countries`, {
      headers: getAdminHeaders(),
    });
    const result = (await handleResponse<ApiClientCountry[]>(
      response,
    )) as ApiResponse<ApiClientCountry[]>;
    return result.data;
  } catch (error) {
    console.error("Failed to fetch admin countries:", error);
    throw error;
  }
}

// --- Fetch Country by Code (Admin) ---
/**
 * Fetches details for a specific country (admin view).
 * Corresponds to: GET /private/countries/{code}
 * @param countryCode - The 2-letter code of the country
 */
export async function fetchCountryByCode(
  countryCode: string,
): Promise<ApiAdminCountry> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/countries/${countryCode}`,
      {
        headers: getAdminHeaders(),
      },
    );
    const result = (await handleResponse<ApiAdminCountry>(
      response,
    )) as ApiResponse<ApiAdminCountry>;
    return result.data;
  } catch (error) {
    console.error(`Failed to fetch admin country ${countryCode}:`, error);
    throw error;
  }
}

// --- Create Country (Admin) ---
/**
 * Creates a new country (admin).
 * Corresponds to: POST /private/countries
 * @param countryData - The data for the new country (ApiAdminCountryInput).
 * @returns Promise resolving to the created country details (ApiAdminCountry).
 */
export async function createCountry(
  countryData: ApiAdminCountryInput,
): Promise<ApiAdminCountry> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/countries`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(countryData),
    });
    const result = (await handleResponse<ApiAdminCountry>(
      response,
    )) as ApiResponse<ApiAdminCountry>;
    return result.data;
  } catch (error) {
    console.error("Failed to create admin country:", error);
    throw error;
  }
}

// --- Update Country (Admin) ---
/**
 * Updates an existing country (admin).
 * Corresponds to: PUT /private/countries/{code}
 * @param countryCode - The 2-letter code of the country to update.
 * @param countryData - The updated data for the country (ApiAdminCountryInput).
 * @returns Promise resolving to the updated country details (ApiAdminCountry).
 */
export async function updateCountry(
  countryCode: string,
  countryData: ApiAdminCountryInput,
): Promise<ApiAdminCountry> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/countries/${countryCode}`,
      {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(countryData),
      },
    );
    const result = (await handleResponse<ApiAdminCountry>(
      response,
    )) as ApiResponse<ApiAdminCountry>;
    return result.data;
  } catch (error) {
    console.error(`Failed to update admin country ${countryCode}:`, error);
    throw error;
  }
}

// --- Delete Country (Admin) ---
/**
 * Deletes a specific country (admin).
 * Corresponds to: DELETE /private/countries/{code}
 * @param countryCode - The 2-letter code of the country to delete.
 */
export async function deleteCountry(
  countryCode: string,
): Promise<ApiAdminSuccessResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/countries/${countryCode}`,
      {
        method: "DELETE",
        headers: getAdminHeaders(),
      },
    );
    return (await handleResponse<never>(response)) as ApiAdminSuccessResponse;
  } catch (error) {
    console.error(`Failed to delete admin country ${countryCode}:`, error);
    throw error;
  }
}

// --- Fetch Currencies (Admin) ---
/**
 * Fetches all currencies (admin view).
 * Corresponds to: GET /private/currencies
 */
export async function fetchCurrencies(): Promise<ApiAdminCurrency[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/currencies`, {
      headers: getAdminHeaders(),
    });
    const result = (await handleResponse<ApiAdminCurrency[]>(
      response,
    )) as ApiResponse<ApiAdminCurrency[]>;
    return result.data;
  } catch (error) {
    console.error("Failed to fetch admin currencies:", error);
    throw error;
  }
}

// --- Fetch Currency by Code (Admin) ---
/**
 * Fetches details for a specific currency (admin view).
 * Corresponds to: GET /private/currencies/{code}
 * @param currencyCode - The 3-letter code of the currency
 */
export async function fetchCurrencyByCode(
  currencyCode: string,
): Promise<ApiAdminCurrency> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/currencies/${currencyCode}`,
      {
        headers: getAdminHeaders(),
      },
    );
    const result = (await handleResponse<ApiAdminCurrency>(
      response,
    )) as ApiResponse<ApiAdminCurrency>;
    return result.data;
  } catch (error) {
    console.error(`Failed to fetch admin currency ${currencyCode}:`, error);
    throw error;
  }
}

// --- Create Currency (Admin) ---
/**
 * Creates a new currency (admin).
 * Corresponds to: POST /private/currencies
 * @param currencyData - The data for the new currency (ApiAdminCurrencyInput).
 * @returns Promise resolving to the created currency details (ApiAdminCurrency).
 */
export async function createCurrency(
  currencyData: ApiAdminCurrencyInput,
): Promise<ApiAdminCurrency> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/currencies`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(currencyData),
    });
    const result = (await handleResponse<ApiAdminCurrency>(
      response,
    )) as ApiResponse<ApiAdminCurrency>;
    return result.data;
  } catch (error) {
    console.error("Failed to create admin currency:", error);
    throw error;
  }
}

// --- Update Currency (Admin) ---
/**
 * Updates an existing currency (admin).
 * Corresponds to: PUT /private/currencies/{code}
 * @param currencyCode - The 3-letter code of the currency to update.
 * @param currencyData - The updated data for the currency (ApiAdminCurrencyInput).
 * @returns Promise resolving to the updated currency details (ApiAdminCurrency).
 */
export async function updateCurrency(
  currencyCode: string,
  currencyData: ApiAdminCurrencyInput,
): Promise<ApiAdminCurrency> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/currencies/${currencyCode}`,
      {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(currencyData),
      },
    );
    const result = (await handleResponse<ApiAdminCurrency>(
      response,
    )) as ApiResponse<ApiAdminCurrency>;
    return result.data;
  } catch (error) {
    console.error(`Failed to update admin currency ${currencyCode}:`, error);
    throw error;
  }
}

// --- Delete Currency (Admin) ---
/**
 * Deletes a specific currency (admin).
 * Corresponds to: DELETE /private/currencies/{code}
 * @param currencyCode - The 3-letter code of the currency to delete.
 */
export async function deleteCurrency(
  currencyCode: string,
): Promise<ApiAdminSuccessResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/currencies/${currencyCode}`,
      {
        method: "DELETE",
        headers: getAdminHeaders(),
      },
    );
    return (await handleResponse<never>(response)) as ApiAdminSuccessResponse;
  } catch (error) {
    console.error(`Failed to delete admin currency ${currencyCode}:`, error);
    throw error;
  }
}

// --- Carts Admin ---

/**
 * Fetches a list of all carts (admin view).
 * Corresponds to: GET /private/carts
 * @param params - Optional pagination parameters (page, pageSize).
 */
export async function adminFetchCarts(
  params?: ApiAdminListParams,
): Promise<{ count: number; carts: ApiCart[] }> {
  const url = new URL(`${API_BASE_URL}/private/carts`);
  if (params?.page) url.searchParams.append("page", String(params.page));
  if (params?.pageSize)
    url.searchParams.append("pageSize", String(params.pageSize));

  try {
    const response = await fetch(url.toString(), {
      headers: getAdminHeaders(),
    });
    const result = await handleResponse<{ count: number; carts: ApiCart[] }>(
      response,
    );
    return result.data;
  } catch (error) {
    console.error("Failed to fetch admin carts:", error);
    throw error;
  }
}

/**
 * Fetches details for a specific cart by ID (admin view).
 * Corresponds to: GET /private/carts/{id}
 * @param cartId - The ID of the cart.
 */
export async function adminFetchCartById(cartId: string): Promise<ApiCart> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/carts/${cartId}`, {
      headers: getAdminHeaders(),
    });
    const result = await handleResponse<ApiCart>(response);
    return result.data;
  } catch (error) {
    console.error(`Failed to fetch admin cart ${cartId}:`, error);
    throw error;
  }
}

// --- Users Admin ---

/**
 * Fetches a list of all users (admin view).
 * Corresponds to: GET /private/users
 * @param params - Optional pagination parameters (page, pageSize).
 */
export async function adminFetchUsers(
  params?: ApiAdminListParams,
): Promise<{ count: number; users: ApiBaseUser[] }> {
  const url = new URL(`${API_BASE_URL}/private/users`);
  if (params?.page) url.searchParams.append("page", String(params.page));
  if (params?.pageSize)
    url.searchParams.append("pageSize", String(params.pageSize));

  try {
    const response = await fetch(url.toString(), {
      headers: getAdminHeaders(),
    });
    const result = await handleResponse<{
      count: number;
      users: ApiBaseUser[];
    }>(response);
    return result.data;
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    throw error;
  }
}

/**
 * Fetches details for a specific user by ID (admin view).
 * Corresponds to: GET /private/users/{id}
 * @param userId - The ID of the user.
 */
export async function adminFetchUserById(userId: string): Promise<ApiBaseUser> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/users/${userId}`, {
      headers: getAdminHeaders(),
    });
    const result = await handleResponse<ApiBaseUser>(response);
    return result.data;
  } catch (error) {
    console.error(`Failed to fetch admin user ${userId}:`, error);
    throw error;
  }
}

/**
 * Deletes a user by ID (admin view).
 * Corresponds to: DELETE /private/users/{id}
 * @param userId - The ID of the user to delete.
 */
export async function adminDeleteUser(
  userId: string,
): Promise<ApiAdminSuccessResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/users/${userId}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    });
    // Type assertion needed as handleResponse expects a generic T in data
    return (await handleResponse<never>(response)) as ApiAdminSuccessResponse;
  } catch (error) {
    console.error(`Failed to delete admin user ${userId}:`, error);
    throw error;
  }
}

// --- Orders Admin ---

/**
 * Fetches a list of all orders (admin view).
 * Corresponds to: GET /private/orders
 * @param params - Optional pagination and filtering parameters.
 */
export async function adminFetchOrders(
  params?: ApiAdminOrderListParams,
): Promise<{ count: number; orders: ApiOrder[] }> {
  const url = new URL(`${API_BASE_URL}/private/orders`);
  if (params?.page) url.searchParams.append("page", String(params.page));
  if (params?.pageSize)
    url.searchParams.append("pageSize", String(params.pageSize));
  if (params?.userId) url.searchParams.append("userId", params.userId);
  if (params?.paymentId) url.searchParams.append("paymentId", params.paymentId);
  if (params?.stripeId) url.searchParams.append("stripeId", params.stripeId);
  if (params?.shippingTransactionId)
    url.searchParams.append(
      "shippingTransactionId",
      params.shippingTransactionId,
    );

  try {
    const response = await fetch(url.toString(), {
      headers: getAdminHeaders(),
    });
    const result = await handleResponse<{ count: number; orders: ApiOrder[] }>(
      response,
    );
    return result.data;
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);
    throw error;
  }
}

/**
 * Fetches details for a specific order by ID (admin view).
 * Corresponds to: GET /private/orders/{id}
 * @param orderId - The ID of the order.
 */
export async function adminFetchOrderById(orderId: string): Promise<ApiOrder> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/orders/${orderId}`, {
      headers: getAdminHeaders(),
    });
    const result = await handleResponse<ApiOrder>(response);
    return result.data;
  } catch (error) {
    console.error(`Failed to fetch admin order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Updates an existing order (admin view). Use with caution.
 * Corresponds to: PUT /private/orders/{id}
 * @param orderId - The ID of the order to update.
 * @param orderData - The data to update.
 */
export async function adminUpdateOrder(
  orderId: string,
  orderData: ApiUpdateAdminOrderInput,
): Promise<ApiOrder> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/orders/${orderId}`, {
      method: "PUT",
      headers: getAdminHeaders(),
      body: JSON.stringify(orderData),
    });
    const result = await handleResponse<ApiOrder>(response);
    return result.data;
  } catch (error) {
    console.error(`Failed to update admin order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Marks an order as cancelled (admin view).
 * Corresponds to: PUT /private/orders/{id}/cancel
 * @param orderId - The ID of the order to cancel.
 */
export async function adminCancelOrder(orderId: string): Promise<ApiOrder> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/orders/${orderId}/cancel`,
      {
        method: "PUT", // Swagger uses PUT for this cancel operation
        headers: getAdminHeaders(),
      },
    );
    const result = await handleResponse<ApiOrder>(response);
    return result.data;
  } catch (error) {
    console.error(`Failed to cancel admin order ${orderId}:`, error);
    throw error;
  }
}

// --- Scheduled Tasks ---

/**
 * Triggers the task to check and expire checkout sessions.
 * Corresponds to: POST /private/check-expired-sessions
 */
export async function triggerCheckExpiredSessions(): Promise<ApiAdminSuccessResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/private/check-expired-sessions`,
      {
        method: "POST",
        headers: getAdminHeaders(),
      },
    );
    // Type assertion needed as handleResponse expects a generic T in data
    return (await handleResponse<never>(response)) as ApiAdminSuccessResponse;
  } catch (error) {
    console.error("Failed to trigger check expired sessions:", error);
    throw error;
  }
}

// --- Test Data ---

/**
 * Inserts test data into the system. Requires secret key.
 * Corresponds to: POST /private/insert-test-data
 * @param secretData - Object containing the secretKey.
 */
export async function insertTestData(
  secretData: ApiSecretKeyInput,
): Promise<ApiAdminSuccessResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/insert-test-data`, {
      method: "POST",
      headers: getAdminHeaders(), // Assumes admin headers are sufficient, or adjust if X-Admin-Secret-Key is strictly required separately
      body: JSON.stringify(secretData),
    });
    // Type assertion needed as handleResponse expects a generic T in data
    return (await handleResponse<never>(response)) as ApiAdminSuccessResponse;
  } catch (error) {
    console.error("Failed to insert test data:", error);
    throw error;
  }
}

// --- Stock Admin ---

/**
 * Initializes the R2 stock bucket. Requires secret key.
 * Corresponds to: POST /private/stock/setup
 * @param secretData - Object containing the secretKey.
 */
export async function setupStockBucket(
  secretData: ApiSecretKeyInput,
): Promise<ApiAdminSuccessResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/private/stock/setup`, {
      method: "POST",
      headers: getAdminHeaders(), // Assumes admin headers are sufficient
      body: JSON.stringify(secretData),
    });
    // Type assertion needed as handleResponse expects a generic T in data
    return (await handleResponse<never>(response)) as ApiAdminSuccessResponse;
  } catch (error) {
    console.error("Failed to setup stock bucket:", error);
    throw error;
  }
}

/**
 * Gets stock for a specific product (Local Dev Only).
 * Corresponds to: GET /private/stock/{productId}
 * @param productId - The ID of the product.
 */
export async function getProductStock(productId: string): Promise<number> {
  // WARNING: Add check for non-local environment if needed, although API should return 405
  try {
    const response = await fetch(`${API_BASE_URL}/private/stock/${productId}`, {
      headers: getAdminHeaders(),
    });
    // Assuming response data is { message: string, data: number } based on swagger example
    const result = await handleResponse<{ stock: number }>(response);
    return result.data.stock;
  } catch (error) {
    console.error(`Failed to get stock for product ${productId}:`, error);
    throw error;
  }
}
