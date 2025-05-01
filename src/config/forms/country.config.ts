// src/config/forms/country.config.ts
import { z } from "zod";
import {
  DomainFormConfig,
  FieldConnection,
  OptionType,
} from "@/types/form-config";
import {
  fetchCountryByCode,
  createCountry,
  updateCountry,
  fetchCurrencies,
} from "@/services/api";
import type {
  ApiAdminCountry,
  ApiAdminCountryInput,
  ApiAdminCurrency,
} from "@/types/api";
import { countryData } from "@/data/countries.ts";

// Define the form schema
const countrySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  code: z
    .string()
    .length(2, { message: "Code must be exactly 2 uppercase letters." })
    .regex(/^[A-Z]+$/, { message: "Code must be uppercase letters only." }),
  locale: z.string().min(2, { message: "Locale is required (e.g., en-US)." }),
  currencyCode: z
    .string()
    .length(3, {
      message: "Currency Code must be exactly 3 uppercase letters.",
    })
    .regex(/^[A-Z]+$/, {
      message: "Currency Code must be uppercase letters only.",
    }),
});

// Derive form values type from schema
export type CountryFormValues = z.infer<typeof countrySchema>;

const countryConnections: FieldConnection<CountryFormValues>[] = [
  {
    sourceField: "code",
    targetFields: ["name", "locale"], // Define fields to update
    lookupSet: countryData, // Use the imported data
    clearTargetsOnNoMatch: true, // Clear other fields if code doesn't match known currency
  },
  {
    sourceField: "name",
    targetFields: ["code", "locale"],
    lookupSet: countryData,
    clearTargetsOnNoMatch: true,
  },
  {
    sourceField: "locale",
    targetFields: ["code", "name"],
    lookupSet: countryData,
    clearTargetsOnNoMatch: true,
  },
];

// Create the type-safe configuration
export const countryFormConfig: DomainFormConfig<
  CountryFormValues,
  ApiAdminCountryInput,
  ApiAdminCountry
> = {
  entityName: "Country",
  entityNamePlural: "Countries",
  schema: countrySchema,
  keyField: "code",
  dependencies: [
    // <<< NEW: Define dependencies
    {
      key: "currencies", // Identifier for this dependency
      fetcher: fetchCurrencies, // Function to fetch the data
      transform: (
        currencies: ApiAdminCurrency[],
      ): OptionType[] => // Transform API data to options
        currencies.map((currency) => ({
          value: currency.code,
          label: `${currency.name} (${currency.code})`,
        })),
    },
    // Add more dependencies here if needed
  ],
  fields: [
    {
      name: "name",
      label: "Country Name",
      placeholder: "e.g. Portugal",
      defaultValue: "",
      component: "ComboBox",
      componentProps: {
        options: countryData.map((country) => ({
          label: country.name,
          value: country.name,
        })),
        name: "Name",
      },
    },
    {
      name: "code",
      label: "Country Code (ISO 2-Letter)",
      placeholder: "e.g. PT",
      defaultValue: "",
      disabled: (isEditMode) => isEditMode,
      description:
        "2-letter uppercase code (e.g., PT, ES, US). Cannot be changed after creation.",
      component: "ComboBox",
      componentProps: {
        options: countryData.map((country) => ({
          label: country.code,
          value: country.code,
        })),
        name: "Code",
      },
    },
    {
      name: "locale",
      label: "Locale",
      placeholder: "e.g. pt-PT",
      defaultValue: "",
      description: "Used for formatting numbers, dates (e.g., en-US, pt-PT).",
      component: "ComboBox",
      componentProps: {
        options: countryData.map((country) => ({
          label: country.locale,
          value: country.locale,
        })),
        name: "Locale",
      },
    },
    {
      name: "currencyCode",
      label: "Currency Code (ISO 3-Letter)",
      placeholder: "e.g. EUR",
      defaultValue: "",
      description:
        "The 3-letter code of the primary currency for this country (e.g., EUR, USD).",
      dependencyKey: "currencies",
      component: "ComboBox",
      componentProps: {},
    },
  ],
  apiConfig: {
    fetchOne: fetchCountryByCode,
    create: createCountry,
    update: updateCountry,
    transformApiToForm: (apiData: ApiAdminCountry): CountryFormValues => ({
      name: apiData.name,
      code: apiData.code,
      locale: apiData.locale,
      currencyCode: apiData.currency?.code || "",
    }),
    transformFormToApi: (formData: CountryFormValues): ApiAdminCountryInput =>
      formData,
  },
  routes: {
    list: "/countries",
    edit: (code) => `/countries/${code}`,
    new: "/countries/new",
  },
  messages: {
    createSuccess: (entity) =>
      `Country "${entity.name}" (${entity.code}) has been successfully created.`,
    updateSuccess: (entity) =>
      `Country "${entity.name}" (${entity.code}) has been successfully updated.`,
    loadError: "Could not load country data.",
    saveError: "Could not save country.",
    dependencyLoadError: "Could not load currencies for selection.",
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
        title: "Localization",
        fields: ["locale", "currencyCode"],
      },
    ],
  },
  fieldConnections: countryConnections,
};
