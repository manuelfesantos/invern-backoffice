// src/components/domain/DomainForm.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DefaultValues, Path, PathValue, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DomainFormConfig,
  DomainEntity,
  OptionType,
  FieldCalculation,
} from "@/types/form-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ComboBox } from "@/components/ui/combobox.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

type DependencyData = Record<string, OptionType[]>;

type CalculationStatus = "idle" | "pending" | "success" | "error";
type CalculationState = Record<string, CalculationStatus>;

interface DomainFormProps<
  TFormValues extends Record<string, unknown>,
  TApiInput = TFormValues,
  TApiOutput extends DomainEntity = TApiInput & DomainEntity,
> {
  config: DomainFormConfig<TFormValues, TApiInput, TApiOutput>;
  keyParam?: string; // URL parameter to use for ID (defaults to "id")
}

export function DomainForm<
  TFormValues extends Record<string, unknown>,
  TApiInput = TFormValues,
  TApiOutput extends DomainEntity = TApiInput & DomainEntity,
>({
  config,
  keyParam = "id",
}: DomainFormProps<TFormValues, TApiInput, TApiOutput>) {
  const params = useParams<Record<string, string>>();
  const id = params[keyParam];
  const navigate = useNavigate();
  const isEditMode = id !== undefined && id !== "new";

  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingDeps, setLoadingDeps] = useState<boolean>(
    !!config.dependencies?.length,
  );
  const [depsError, setDepsError] = useState<string | null>(null);
  const [dependencyData, setDependencyData] = useState<DependencyData>({});
  const [calculationState, setCalculationState] = useState<CalculationState>(
    {},
  );

  const getFieldConfig = useCallback(
    (fieldName: keyof TFormValues & string) => {
      return config.fields.find((f) => f.name === fieldName);
    },
    [config.fields],
  );

  // Create default values from field configurations
  const defaultValues = useMemo(() => {
    return config.fields.reduce(
      (acc, field) => {
        acc[field.name] = field.defaultValue;
        return acc;
      },
      {} as Record<string, unknown>,
    ) as TFormValues;
  }, [config.fields]);

  const form = useForm<TFormValues>({
    resolver: zodResolver(config.schema),
    defaultValues: defaultValues as DefaultValues<TFormValues>,
    mode: "onChange",
  });

  const { watch, setValue, trigger, getValues } = form;

  const runCalculations = useCallback(
    async (
      calculations: FieldCalculation<TFormValues>[],
      match: Partial<TFormValues>,
    ) => {
      for (const calculation of calculations) {
        const {
          targetField,
          calculator,
          calculationTriggerField,
          errorMessage,
        } = calculation;
        const inputValue = match[calculationTriggerField];

        if (
          inputValue !== undefined &&
          inputValue !== null &&
          inputValue !== ""
        ) {
          setCalculationState((prev) => ({
            ...prev,
            [targetField]: "pending",
          }));
          try {
            console.log(
              `Running calculation for ${targetField} with input:`,
              inputValue,
            );
            const result = await calculator(inputValue); // Await the async calculator
            console.log(`Calculation result for ${targetField}:`, result);

            const targetPath = targetField as Path<TFormValues>;
            const fieldConfig = getFieldConfig(
              targetField as keyof TFormValues & string,
            );
            let valueToSet: any = result; // Start with the result

            // If calc failed (returned null/undefined), set to default value
            if (valueToSet === null || valueToSet === undefined) {
              valueToSet = fieldConfig?.defaultValue ?? null; // Use configured default or null
              setCalculationState((prev) => ({
                ...prev,
                [targetField]: "error",
              }));
            } else {
              // Apply input transform if available and result is not null/undefined
              if (fieldConfig?.transform?.input) {
                valueToSet = fieldConfig.transform.input(valueToSet);
              }
              setCalculationState((prev) => ({
                ...prev,
                [targetField]: "success",
              }));
            }

            console.log(`Setting value for ${targetField}:`, valueToSet);
            // Assert the type for setValue
            setValue(
              targetPath,
              valueToSet as PathValue<TFormValues, typeof targetPath>,
              {
                shouldValidate: true, // Validate after calculation
                shouldDirty: true,
                shouldTouch: true,
              },
            );
          } catch (err) {
            setCalculationState((prev) => ({
              ...prev,
              [targetField]: "error",
            }));
            const fieldConfig = getFieldConfig(
              targetField as keyof TFormValues & string,
            );
            console.error(`Error during calculation for ${targetField}:`, err);
            toast.error(`Calculation Error (${targetField})`, {
              description:
                errorMessage ||
                `Failed to calculate value for ${fieldConfig?.label || targetField}.`,
            });
            // Set to default on error
            const targetPath = targetField as Path<TFormValues>;

            setValue(
              targetPath,
              (fieldConfig?.defaultValue ?? null) as PathValue<
                TFormValues,
                typeof targetPath
              >,
              { shouldValidate: true },
            );
          }
        } else {
          // If trigger value is missing, maybe clear the target or set default
          const targetPath = targetField as Path<TFormValues>;
          const fieldConfig = getFieldConfig(
            targetField as keyof TFormValues & string,
          );
          setValue(
            targetPath,
            (fieldConfig?.defaultValue ?? null) as PathValue<
              TFormValues,
              typeof targetPath
            >,
            { shouldValidate: true },
          );
          setCalculationState((prev) => ({ ...prev, [targetField]: "idle" })); // Reset status
        }
      }
    },
    [setValue, getFieldConfig],
  );

  useEffect(() => {
    if (!config.fieldConnections || config.fieldConnections.length === 0) {
      return;
    }

    const subscriptions = config.fieldConnections.map((connection) => {
      const watchedFieldName = connection.sourceField as Path<TFormValues>;

      return watch(async (_values, { name, type }) => {
        // Make the callback async
        if (name !== watchedFieldName || type !== "change") {
          return;
        }

        console.log("Processing change for connection:", {
          sourceField: name,
          connection,
        });

        const sourceValue = getValues(watchedFieldName);
        const match = connection.lookupSet.find((item) => {
          const itemValue = item[connection.sourceField];
          if (
            typeof sourceValue === "string" &&
            typeof itemValue === "string"
          ) {
            return itemValue.toLowerCase() === sourceValue.toLowerCase();
          }
          return itemValue === sourceValue;
        });

        const fieldsToUpdate = new Set<Path<TFormValues>>();
        const fieldsToValidate = new Set<Path<TFormValues>>();

        if (match) {
          console.log("Match found:", match);
          // --- Update standard target fields ---
          connection.targetFields.forEach((targetFieldName) => {
            if (targetFieldName === connection.sourceField) return; // Don't self-update

            const targetPath = targetFieldName as Path<TFormValues>;
            const fieldConfig = getFieldConfig(targetFieldName);
            const defaultValueFromConfig = fieldConfig?.defaultValue;
            const valueFromMatch = match[targetFieldName];

            let finalValueToSet =
              valueFromMatch !== undefined
                ? valueFromMatch
                : defaultValueFromConfig;

            // Basic fallback if still undefined
            if (finalValueToSet === undefined) {
              const fieldType = typeof defaultValueFromConfig;
              finalValueToSet =
                fieldType === "number"
                  ? 0
                  : fieldType === "boolean"
                    ? false
                    : "";
            }

            // Transform before comparing/setting
            if (fieldConfig?.transform?.input) {
              finalValueToSet = fieldConfig.transform.input(finalValueToSet);
            }

            const currentValue = getValues(targetPath);
            if (currentValue !== finalValueToSet) {
              console.log(
                `Setting standard field ${targetFieldName} to:`,
                finalValueToSet,
              );
              setValue(
                targetPath,
                finalValueToSet as PathValue<TFormValues, typeof targetPath>,
                {
                  shouldValidate: false, // Defer validation until after all updates
                  shouldDirty: true,
                  shouldTouch: true,
                },
              );
              fieldsToUpdate.add(targetPath);
              fieldsToValidate.add(targetPath); // Mark for later validation
            }
          });

          // --- Run calculations (async) ---
          if (connection.calculations && connection.calculations.length > 0) {
            await runCalculations(connection.calculations, match); // Await calculations
            // Add calculated fields to validation list
            connection.calculations.forEach((calc) =>
              fieldsToValidate.add(calc.targetField as Path<TFormValues>),
            );
          }
        } else {
          console.log("No match found for source value:", sourceValue);
          // --- No match: Clear target fields if configured ---
          if (connection.clearTargetsOnNoMatch !== false) {
            const allTargets = [
              ...connection.targetFields,
              ...(connection.calculations?.map((c) => c.targetField) ?? []),
            ];

            allTargets.forEach((targetFieldNameOrPath) => {
              const targetFieldName =
                targetFieldNameOrPath as keyof TFormValues & string;
              if (targetFieldName === connection.sourceField) return; // Skip source

              const targetPath = targetFieldNameOrPath as Path<TFormValues>;
              const fieldConfig = getFieldConfig(targetFieldName);
              let defaultValue = fieldConfig?.defaultValue ?? null; // Default to null if no config default

              // Apply input transform to default value if exists
              if (fieldConfig?.transform?.input) {
                defaultValue = fieldConfig.transform.input(defaultValue);
              }

              const currentValue = getValues(targetPath);
              if (currentValue !== defaultValue) {
                console.log(
                  `Clearing field ${targetFieldName} to default:`,
                  defaultValue,
                );
                setValue(
                  targetPath,
                  defaultValue as PathValue<TFormValues, typeof targetPath>,
                  {
                    shouldValidate: false, // Defer validation
                    shouldDirty: true,
                    shouldTouch: true,
                  },
                );
                fieldsToUpdate.add(targetPath);
                fieldsToValidate.add(targetPath);
              }
              // Reset calculation status if it's a calculated field being cleared
              if (
                connection.calculations?.some(
                  (c) => c.targetField === targetPath,
                )
              ) {
                setCalculationState((prev) => ({
                  ...prev,
                  [targetPath]: "idle",
                }));
              }
            });
          }
        }

        console.log(
          "Field connection processing complete. Final values:",
          getValues(),
        );
      });
    });

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
      setCalculationState({}); // Reset calculation state on cleanup
    };
  }, [
    watch,
    setValue,
    trigger,
    getValues,
    config.fieldConnections,
    config.fields,
    runCalculations,
    getFieldConfig,
  ]);

  // Fetch dependencies
  useEffect(() => {
    console.log("Loading dependencies:", config.dependencies);
    if (!config.dependencies || config.dependencies.length === 0) {
      setLoadingDeps(false);
      return;
    }

    async function loadDependencies() {
      setLoadingDeps(true);
      setDepsError(null);
      try {
        const promises = config.dependencies!.map(async (dep) => {
          const rawData = await dep.fetcher();
          const options = dep.transform
            ? dep.transform(rawData)
            : (rawData as OptionType[]); // Assume data is already options if no transform
          return { key: dep.key, options };
        });

        const results = await Promise.all(promises);
        const dataMap = results.reduce<DependencyData>((acc, result) => {
          acc[result.key] = result.options;
          return acc;
        }, {});
        setDependencyData(dataMap);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load dependencies";
        setDepsError(errorMsg);
        toast.error("Error Loading Dependencies", {
          description:
            config.messages.dependencyLoadError ||
            "Could not load required data for the form.",
        });
        console.error("Dependency loading error:", err);
      } finally {
        setLoadingDeps(false);
      }
    }

    loadDependencies();
  }, [config.dependencies, config.messages.dependencyLoadError]);

  // Fetch existing data if in edit mode
  useEffect(() => {
    console.log("Loading entity data for ID:", id);
    if (!isEditMode || !id) {
      setLoading(false);
      return;
    }

    async function loadEntity() {
      try {
        setLoading(true);
        setError(null);
        const data = await config.apiConfig.fetchOne(id as string);
        const formData = config.apiConfig.transformApiToForm
          ? config.apiConfig.transformApiToForm(data)
          : (data as unknown as TFormValues);
        form.reset(formData);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMsg);
        toast.error(`Error loading ${config.entityName.toLowerCase()}`, {
          description: errorMsg || config.messages.loadError,
        });
      } finally {
        setLoading(false);
      }
    }
    loadEntity();
  }, [id, isEditMode, form, config]);

  // Handle form submission
  const onSubmit = async (values: TFormValues) => {
    setSaving(true);
    setError(null);

    // Transform form data to API format if needed
    const apiData = config.apiConfig.transformFormToApi
      ? config.apiConfig.transformFormToApi(values)
      : (values as unknown as TApiInput);

    try {
      let result;
      if (isEditMode && id) {
        result = await config.apiConfig.update(id, apiData);
        toast.success(`${config.entityName} Updated`, {
          description: config.messages.updateSuccess(result),
        });
      } else {
        result = await config.apiConfig.create(apiData);
        toast.success(`${config.entityName} Created`, {
          description: config.messages.createSuccess(result),
        });
      }
      navigate(config.routes.list);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMsg);
      toast.error(`Error saving ${config.entityName.toLowerCase()}`, {
        description: errorMsg || config.messages.saveError,
      });
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = isEditMode
    ? `Edit ${config.entityName}`
    : `Add New ${config.entityName}`;
  const pageDescription = isEditMode
    ? `Update ${config.entityName.toLowerCase()} details.`
    : `Fill in details for the new ${config.entityName.toLowerCase()}.`;

  // --- Render form field based on its component type ---
  const renderFormField = (
    field: (typeof config.fields)[number],
    formField: any,
  ) => {
    const isDisabled =
      (field.disabled ? field.disabled(isEditMode) : false) || loadingDeps;
    const componentProps = { ...field.componentProps };

    let options: OptionType[] =
      (field.componentProps?.options as OptionType[]) ?? [];

    // If the field depends on fetched data, get the options
    if (field.dependencyKey) {
      options = dependencyData[field.dependencyKey] || [];
      // Add loading state to component props if deps are loading/failed
      componentProps.disabled = isDisabled || !!depsError;
      if (loadingDeps && !options.length) {
        componentProps.placeholder = "Loading options...";
      } else if (depsError && !options.length) {
        componentProps.placeholder = "Error loading options";
      }
    }

    const fieldName = field.name as Path<TFormValues>;
    const calcStatus = calculationState[fieldName];
    const showCalcIndicator = ["pending", "error"].includes(
      calcStatus || "idle",
    );

    switch (field.component) {
      case "Textarea":
        return (
          <Textarea
            placeholder={field.placeholder}
            {...formField}
            disabled={isDisabled}
            {...componentProps}
          />
        );
      case "Checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formField.value}
              onCheckedChange={formField.onChange}
              disabled={isDisabled}
              {...componentProps}
            />
            <span>{field.label}</span>
          </div>
        );
      case "Select":
        return (
          <Select
            onValueChange={formField.onChange}
            defaultValue={formField.value}
            value={formField.value} // Controlled component
            disabled={isDisabled || !!depsError} // Disable if deps failed
            {...componentProps} // Pass other props like placeholder
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.length > 0 ? (
                options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  {loadingDeps
                    ? "Loading..."
                    : depsError
                      ? "Error"
                      : "No options"}
                </div>
              )}
            </SelectContent>
          </Select>
        );
      case "ComboBox":
        return (
          <ComboBox
            {...formField}
            {...componentProps}
            disabled={isDisabled}
            onChange={formField.onChange}
            value={formField.value}
            options={options}
          />
        );
      case "Input":
      default: {
        const isNumberInput = componentProps?.type === "number";

        // Special handler for number inputs
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (isNumberInput) {
            const value = e.target.value;
            // Parse the string value.
            // parseFloat handles decimals. Use parseInt if only integers are allowed.
            // If the value is empty or cannot be parsed, it becomes NaN.
            const numericValue = value === "" ? NaN : parseFloat(value);
            formField.onChange(numericValue); // Pass NaN or the parsed number to RHF
          } else {
            // Default behavior for non-number inputs
            formField.onChange(e.target.value);
          }
        };

        return (
          <div className="relative flex items-center">
            {" "}
            {/* Wrapper for indicator */}
            <Input
              {...formField}
              {...componentProps}
              type={componentProps?.type || "text"}
              onChange={handleChange}
              placeholder={field.placeholder}
              disabled={isDisabled}
            />
            {showCalcIndicator && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 transform">
                {calcStatus === "pending" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {calcStatus === "error" && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
              </div>
            )}
          </div>
        );
      }
    }
  };

  // --- Loading State ---
  if (loading || loadingDeps) {
    return (
      <div className="container mx-auto py-10">
        <Button variant="outline" size="sm" asChild className="mb-6" disabled>
          <Link to={config.routes.list}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
            {config.entityNamePlural}
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {Array(config.fields.length)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            <Skeleton className="h-10 w-36" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadError = error || depsError;
  if (loadError && !saving && isEditMode && !form.formState.isDirty) {
    return (
      <div className="container mx-auto py-10">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link to={config.routes.list}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
            {config.entityNamePlural}
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading {config.entityName}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Render Form ---
  const renderFields = () => {
    // If sections are defined, render fields in sections
    if (config.layout?.sections) {
      return config.layout.sections.map((section, index) => (
        <div key={index} className="mb-8">
          {section.title && (
            <h3 className="text-lg font-medium mb-2">{section.title}</h3>
          )}
          {section.description && (
            <p className="text-muted-foreground mb-4">{section.description}</p>
          )}
          <div className="space-y-6">
            {section.fields.map((fieldName) => {
              const field = config.fields.find((f) => f.name === fieldName);
              if (!field) return null;

              return (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name as Path<TFormValues>}
                  render={({ field: formField }) => (
                    <FormItem>
                      {field.component !== "Checkbox" && (
                        <FormLabel>{field.label}</FormLabel>
                      )}
                      <FormControl>
                        {renderFormField(field, formField)}
                      </FormControl>
                      {field.description && (
                        <FormDescription>{field.description}</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
          </div>
        </div>
      ));
    }

    // Otherwise, render all fields in order
    return config.fields.map((field) => (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name as Path<TFormValues>}
        render={({ field: formField }) => (
          <FormItem>
            {field.component !== "Checkbox" && (
              <FormLabel>{field.label}</FormLabel>
            )}
            <FormControl>{renderFormField(field, formField)}</FormControl>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    ));
  };

  // Determine column classes based on layout
  const getGridClass = () => {
    if (!config.layout?.columns || config.layout.columns === 1) {
      return "space-y-6";
    }
    return config.layout.columns === 2
      ? "grid grid-cols-1 md:grid-cols-2 gap-6"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  };

  return (
    <div className="container mx-auto py-10">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link to={config.routes.list}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
          {config.entityNamePlural}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className={getGridClass()}
            >
              {renderFields()}

              {/* Display general save error */}
              {error && saving && (
                <Alert variant="destructive" className="col-span-full">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Save Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className={config.layout?.columns ? "col-span-full" : ""}>
                <Button type="submit" disabled={saving || !!depsError}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving
                    ? "Saving..."
                    : isEditMode
                      ? `Update ${config.entityName}`
                      : `Create ${config.entityName}`}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
