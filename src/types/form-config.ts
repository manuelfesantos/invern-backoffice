// src/types/form-config.ts
import { ZodType } from "zod";
import { FieldValues, Path } from "react-hook-form";

// Standard option type for Select/ComboBox
export interface OptionType {
  value: string;
  label: string;
}

// Configuration for a single dependency
export interface DependencyConfig<TData = unknown> {
  key: string; // Unique key to identify this dependency (e.g., 'currencies', 'collections')
  fetcher: () => Promise<TData[]>; // Function to fetch the raw dependency data
  transform?: (data: TData[]) => OptionType[]; // Optional: Transform raw data into options
}

// Generic field configuration type with better typing
export interface FieldConfig<
  TValue = unknown,
  TFormValues = Record<string, unknown>,
> {
  name: keyof TFormValues & string;
  label: string;
  placeholder?: string;
  description?: string;
  defaultValue: TValue;
  disabled?: (isEditMode: boolean) => boolean;
  transform?: {
    input?: (value: TValue) => any;
    output?: (value: TValue) => TValue;
  };
  component?:
    | "Input"
    | "Textarea"
    | "Select"
    | "Checkbox"
    | "RadioGroup"
    | "DatePicker"
    | "ComboBox"
    | string;
  componentProps?: Record<string, unknown>;
  validation?: Record<string, unknown>; // Additional validation props for specific components
  dependencyKey?: string; // <<< NEW: Key to link this field to a fetched dependency
}

// Domain entity types
export interface DomainEntity {
  id?: string | number;
  [key: string]: unknown;
}

// Type-safe API functions interface
export interface ApiConfig<
  TFormValues,
  TApiInput,
  TApiOutput extends DomainEntity,
> {
  fetchOne: (id: string) => Promise<TApiOutput>;
  create: (data: TApiInput) => Promise<TApiOutput>;
  update: (id: string, data: TApiInput) => Promise<TApiOutput>;
  transformApiToForm?: (apiData: TApiOutput) => TFormValues;
  transformFormToApi?: (formData: TFormValues) => TApiInput;
}

export interface FieldCalculation<TFormValues extends FieldValues> {
  /** The target field whose value will be set by the calculation. */
  targetField: Path<TFormValues>; // Use Path for type safety
  /** The async function to run. It receives the value from the `calculationTriggerField` of the matched lookup item. */
  calculator: (inputValue: any) => Promise<number | string | null | undefined>; // Returns the value to set, or null/undefined on failure/no value
  /** The field from the matched `lookupSet` item whose value is passed to the `calculator`. */
  calculationTriggerField: keyof TFormValues & string;
  /** Optional: Message to show in a toast if the calculation fails. */
  errorMessage?: string;
}

export interface FieldConnection<TFormValues extends FieldValues> {
  /** The field that triggers the updates when its value changes. */
  sourceField: keyof TFormValues & string;
  /** The other fields that should be automatically updated. */
  targetFields: (keyof TFormValues & string)[];
  /** The dataset containing all possible valid combinations of connected fields. */
  lookupSet: Partial<TFormValues>[]; // Array of objects representing valid combinations
  /** Optional: If true, clear target fields if no match is found in lookupSet. Defaults to true. */
  clearTargetsOnNoMatch?: boolean;
  calculations?: FieldCalculation<TFormValues>[];
}

// Domain form configuration with improved typing
export interface DomainFormConfig<
  TFormValues extends Record<string, unknown>,
  TApiInput = TFormValues,
  TApiOutput extends DomainEntity = TApiInput & DomainEntity,
> {
  entityName: string;
  entityNamePlural: string;
  schema: ZodType<TFormValues>;
  fields: FieldConfig<unknown, TFormValues>[];
  apiConfig: ApiConfig<TFormValues, TApiInput, TApiOutput>;
  routes: {
    list: string;
    edit: (id: string) => string;
    new: string;
  };
  messages: {
    createSuccess: (entity: TApiOutput) => string;
    updateSuccess: (entity: TApiOutput) => string;
    loadError: string;
    saveError: string;
    dependencyLoadError?: string;
  };
  keyField?: keyof TApiOutput & string; // The field that serves as the entity ID
  dependencies?: DependencyConfig<any>[];
  layout?: {
    sections?: {
      title?: string;
      description?: string;
      fields: (keyof TFormValues & string)[];
    }[];
    columns?: 1 | 2 | 3;
  };
  fieldConnections?: FieldConnection<TFormValues>[];
}
