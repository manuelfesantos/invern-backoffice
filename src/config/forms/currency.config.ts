import { z } from "zod";
import {
  DomainFormConfig,
  FieldCalculation,
  FieldConnection,
} from "@/types/form-config";
import {
  fetchCurrencyByCode,
  createCurrency,
  updateCurrency,
} from "@/services/api";
import { ApiAdminCurrency, ApiAdminCurrencyInput } from "@/types/api.ts";
import { currencyData } from "@/data/currencies.ts";
import { getCurrencyRate } from "@/services/currency-rate.ts";
import { toast } from "sonner";

const currencySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 3 characters." }),
  code: z
    .string()
    .length(3, { message: "Code must be exactly 3 uppercase letters." })
    .regex(/^[A-Z]+$/, { message: "Code must be uppercase letters only." }),
  symbol: z.string().min(1, { message: "Symbol is required." }),
  rateToEuro: z.number().min(0, { message: "Rate to Euro must be positive." }),
  stripeName: z.string(),
});

// Derive form values type from schema
export type CurrencyFormValues = z.infer<typeof currencySchema>;

const rateCalculation = {
  targetField: "rateToEuro",
  // The calculator function now receives the currency code
  calculator: async (currencyCode: string) => {
    if (!currencyCode) return null;
    // Optional: Add a small delay for UX if needed, or show loading state
    // await new Promise(resolve => setTimeout(resolve, 500));
    const rate = await getCurrencyRate(currencyCode);
    if (rate === null) {
      toast.warning(`Rate Not Found`, {
        description: `Could not automatically fetch the exchange rate for ${currencyCode}. Please enter it manually.`,
      });
    }
    return rate; // Return the fetched rate or null
  },
  calculationTriggerField: "code", // Use the 'code' from the matched lookupSet item
  errorMessage: "Failed to automatically fetch currency rate.", // Generic error message
} satisfies FieldCalculation<CurrencyFormValues>;

const currencyConnections: FieldConnection<CurrencyFormValues>[] = [
  {
    sourceField: "code",
    targetFields: ["name", "symbol", "stripeName", "rateToEuro"],
    lookupSet: currencyData,
    clearTargetsOnNoMatch: true,
    calculations: [rateCalculation],
  },
  {
    sourceField: "name",
    targetFields: ["code", "symbol", "stripeName", "rateToEuro"],
    lookupSet: currencyData,
    clearTargetsOnNoMatch: true,
    calculations: [rateCalculation],
  },
  {
    sourceField: "symbol",
    targetFields: ["code", "name", "stripeName", "rateToEuro"],
    lookupSet: currencyData,
    clearTargetsOnNoMatch: true, // Be careful with non-unique symbols
    calculations: [rateCalculation],
  },
  {
    sourceField: "stripeName",
    targetFields: ["code", "name", "symbol", "rateToEuro"],
    lookupSet: currencyData,
    clearTargetsOnNoMatch: true,
    calculations: [rateCalculation],
  },
];

// Create the type-safe configuration
export const currencyFormConfig: DomainFormConfig<
  CurrencyFormValues,
  ApiAdminCurrencyInput,
  ApiAdminCurrency
> = {
  entityName: "Currency",
  entityNamePlural: "Currencies",
  schema: currencySchema,
  keyField: "code",
  fields: [
    {
      name: "name",
      label: "Currency Name",
      placeholder: "e.g. Euro",
      defaultValue: "",
      component: "ComboBox",
      componentProps: {
        options: currencyData.map((currency) => ({
          label: currency.name,
          value: currency.name,
        })),
      },
    },
    {
      name: "code",
      label: "Currency Code",
      placeholder: "e.g. EUR",
      defaultValue: "",
      disabled: (isEditMode) => isEditMode,
      description:
        "3-letter uppercase code (e.g., EUR, USD). Cannot be changed after creation.",
      component: "ComboBox",
      componentProps: {
        options: currencyData.map((currency) => ({
          label: currency.code,
          value: currency.code,
        })),
      },
    },
    {
      name: "symbol",
      label: "Symbol",
      placeholder: "e.g. €",
      defaultValue: "",
      description: "Used for formatting numbers, dates (e.g., en-US, pt-PT).",
      component: "ComboBox",
      componentProps: {
        options: currencyData.map((currency) => ({
          label: currency.symbol,
          value: currency.symbol,
        })),
      },
    },
    {
      name: "rateToEuro",
      label: "Rate to Euro",
      placeholder: "e.g. 1.0",
      defaultValue: 0,
      description:
        "The rate of this currency compared to Euro (e.g., 1.0 for 1:1).",
      component: "Input",
      componentProps: {
        type: "number",
        step: "0.01",
      },
      transform: {
        input: (value) => {
          const parsedValue = parseFloat(value as string);
          return isNaN(parsedValue) ? 0 : parsedValue;
        },
        output: (value) => {
          if (typeof value === "number") {
            return value.toString();
          } else {
            return value;
          }
        },
      },
    },
    {
      name: "stripeName",
      label: "Stripe Name",
      placeholder: "e.g. eur",
      defaultValue: "",
      description:
        "The name of this currency as it appears in Stripe (e.g., eur).",
      component: "ComboBox",
      componentProps: {
        options: currencyData.map((currency) => ({
          label: currency.stripeName,
          value: currency.stripeName,
        })),
      },
    },
  ],
  apiConfig: {
    fetchOne: fetchCurrencyByCode,
    create: createCurrency,
    update: updateCurrency,
    transformApiToForm: (apiData: ApiAdminCurrency): CurrencyFormValues => ({
      name: apiData.name,
      code: apiData.code,
      symbol: apiData.symbol,
      rateToEuro: apiData.rateToEuro,
      stripeName: apiData.stripeName,
    }),
    transformFormToApi: (formData: CurrencyFormValues): ApiAdminCurrencyInput =>
      formData,
  },
  routes: {
    list: "/currencies",
    edit: (code) => `/currencies/${code}`,
    new: "/currencies/new",
  },
  messages: {
    createSuccess: (entity) =>
      `Currency "${entity.name}" (${entity.code}) has been successfully created.`,
    updateSuccess: (entity) =>
      `Currency "${entity.name}" (${entity.code}) has been successfully updated.`,
    loadError: "Could not load currency data.",
    saveError: "Could not save currency.",
  },
  // Optional: define form layout
  layout: {
    columns: 2,
    sections: [
      {
        title: "Basic Information",
        fields: ["name", "code"],
      },
      {
        title: "Additional Information",
        fields: ["symbol", "rateToEuro", "stripeName"],
      },
    ],
  },
  fieldConnections: currencyConnections,
};
