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
  ApiClientOrder,
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

// --- Fetch User Orders ---
/**
 * Fetches orders for the currently authenticated user.
 * Corresponds to: GET /public/countries/{countryCode}/orders
 * Assumes countryCode is handled implicitly or globally. Requires user authentication.
 */
export async function fetchOrders(): Promise<ApiClientOrder[]> {
  // TODO: Determine how countryCode is passed/obtained if needed. Assuming handled globally for now.
  const countryCode = "PT"; // Placeholder - replace with actual logic if needed
  try {
    const response = await fetch(`${API_BASE_URL}/private/orders`, {
      // Assumes authentication is handled by cookies/headers managed elsewhere
      // Add authorization headers if using bearer tokens explicitly
      headers: getAdminHeaders(), // Using admin for now, adjust if user auth differs
    });
    // The response schema wraps the array in { message, data: { orders: [...] } }
    const result =
      await handleResponse<GetUserOrdersResponse["data"]>(response);
    return result.data.orders; // Extract the orders array
  } catch (error) {
    console.error("Failed to fetch user orders:", error);
    throw error;
  }
}
