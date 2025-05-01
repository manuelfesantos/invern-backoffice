import { toast } from "sonner";

const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY; // Use a specific key if needed
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/EUR`;

/**
 * Fetches the exchange rate for a given currency code against EUR.
 * Returns the rate (how many units of the currency equal 1 EUR)
 * or null if the rate cannot be fetched or the code is invalid.
 *
 * @param currencyCode The 3-letter uppercase currency code (e.g., "USD").
 * @returns Promise resolving to the rate number, or null.
 */
export const getCurrencyRate = async (
  currencyCode: string,
): Promise<number | null> => {
  if (!currencyCode || currencyCode.length !== 3) {
    console.warn(
      "Invalid currency code provided for rate lookup:",
      currencyCode,
    );
    return null; // Invalid input
  }

  if (!API_KEY) {
    console.error(
      "Exchange Rate API Key (VITE_EXCHANGE_RATE_API_KEY) is not configured.",
    );
    toast.error("API Key Missing", {
      description: "Cannot fetch currency rate due to missing configuration.",
    });
    return null;
  }

  try {
    const response = await fetch(API_URL); // Fetch rates against EUR

    if (!response.ok) {
      // Attempt to read error details from the API response if possible
      const errorData = await response.json().catch(() => ({}));
      console.error("ExchangeRate API Error Response:", errorData);
      throw new Error(
        `Failed to fetch currency rates. Status: ${response.status}. ${errorData["error-type"] || ""}`,
      );
    }

    const data = await response.json();

    if (data.result !== "success") {
      throw new Error(
        `ExchangeRate API Error: ${data["error-type"] || "Unknown error"}`,
      );
    }

    const rates = data.conversion_rates;
    const rateAgainstEur = rates[currencyCode.toUpperCase()]; // Ensure uppercase

    if (rateAgainstEur === undefined || rateAgainstEur === null) {
      console.warn(
        `Currency rate for ${currencyCode} not found in API response.`,
      );
      // Don't show toast here, let the caller decide based on null return
      return null; // Currency code might be valid but not in this API's list
    }

    // The API gives rates relative to the base (EUR).
    // rateToEuro means "How many EUR does 1 unit of this currency buy?"
    // If rateAgainstEur is USD/EUR (e.g., 1.08), then rateToEuro is 1 / 1.08
    const rateToEuro = 1 / rateAgainstEur;

    // Optional: Round to a reasonable number of decimal places
    return parseFloat(rateToEuro.toFixed(6));
  } catch (error) {
    console.error(`Error fetching currency rate for ${currencyCode}:`, error);
    toast.error(`Rate Fetch Failed (${currencyCode})`, {
      description:
        error instanceof Error ? error.message : "Could not fetch rate.",
    });
    return null; // Indicate failure
  }
};
