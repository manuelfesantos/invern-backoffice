// src/components/domain/DomainForm.tsx
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  HTMLInputTypeAttribute,
} from "react";
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
import { ComboBox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DependencyData = Record<string, OptionType[]>;
type CalculationStatus = "idle" | "pending" | "success" | "error";
type CalculationState = Record<string, CalculationStatus>;
type FormState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  loadingDeps: boolean;
  depsError: string | null;
  dependencyData: DependencyData;
  calculationState: CalculationState;
};

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
  const isEditMode = Boolean(id && id !== "new");

  // Ref to track if a connection update is in progress
  const isProcessingConnectionRef = useRef(false);

  // Consolidate all form state into a single state object
  const [formState, setFormState] = useState<FormState>({
    loading: isEditMode,
    saving: false,
    error: null,
    loadingDeps: Boolean(config.dependencies?.length),
    depsError: null,
    dependencyData: {},
    calculationState: {},
  });

  // Create default values from field configurations
  const defaultValues = useMemo(() => {
    return config.fields.reduce(
      (acc, field) => {
        acc[field.name] = field.defaultValue;
        return acc;
      },
      {} as Record<string, unknown>,
    ) as DefaultValues<TFormValues>;
  }, [config.fields]);

  const form = useForm<TFormValues>({
    resolver: zodResolver(config.schema),
    defaultValues,
    mode: "onChange",
  });

  const { watch, setValue, getValues, control } = form;

  // Memoized helper to get field configuration
  const getFieldConfig = useCallback(
    (fieldName: keyof TFormValues & string) => {
      return config.fields.find((f) => f.name === fieldName);
    },
    [config.fields],
  );

  // Helper function to update form state to avoid repeated setState calls
  const updateFormState = useCallback((newState: Partial<FormState>) => {
    setFormState((prevState) => ({ ...prevState, ...newState }));
  }, []);

  // Batch calculation state updates to avoid multiple state updates
  const calculationStateRef = useRef<CalculationState>({});

  // Handle field calculations in a more controlled way
  const runCalculations = useCallback(
    async (
      calculations: FieldCalculation<TFormValues>[],
      match: Partial<TFormValues>,
    ) => {
      // Use ref to track calculation state changes
      const newCalculationState = { ...calculationStateRef.current };

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
          // Update calculation state in ref
          newCalculationState[targetField] = "pending";
          calculationStateRef.current = newCalculationState;

          // Only update UI state once per calculation batch
          if (!isProcessingConnectionRef.current) {
            updateFormState({ calculationState: newCalculationState });
          }

          try {
            const result = await calculator(inputValue);
            const targetPath = targetField as Path<TFormValues>;
            const fieldConfig = getFieldConfig(
              targetField as keyof TFormValues & string,
            );

            // Determine the value to set based on calculation result
            let valueToSet: any = result;

            if (valueToSet === null || valueToSet === undefined) {
              valueToSet = fieldConfig?.defaultValue ?? null;
              newCalculationState[targetField] = "error";
            } else {
              // Apply input transform if available
              if (fieldConfig?.transform?.input) {
                valueToSet = fieldConfig.transform.input(valueToSet);
              }
              newCalculationState[targetField] = "success";
            }

            // Set the form value
            setValue(
              targetPath,
              valueToSet as PathValue<TFormValues, typeof targetPath>,
              {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              },
            );
          } catch (err) {
            newCalculationState[targetField] = "error";
            const fieldConfig = getFieldConfig(
              targetField as keyof TFormValues & string,
            );

            console.error(`Error during calculation for ${targetField}:`, err);
            toast.error(`Calculation Error (${targetField})`, {
              description:
                errorMessage ||
                `Failed to calculate value for ${fieldConfig?.label || targetField}.`,
            });

            // Set default value on error
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
          // Reset the field if trigger value is missing
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

          newCalculationState[targetField] = "idle";
        }
      }

      // Store in ref
      calculationStateRef.current = newCalculationState;

      // Only do the state update at the end
      if (!isProcessingConnectionRef.current) {
        updateFormState({ calculationState: newCalculationState });
      }
    },
    [getFieldConfig, setValue, updateFormState],
  );

  // Process field connections more efficiently
  useEffect(() => {
    if (!config.fieldConnections || config.fieldConnections.length === 0) {
      return;
    }

    // Store unsubscribe functions
    const unsubscribeFns: Array<() => void> = [];

    // Process each connection
    config.fieldConnections.forEach((connection) => {
      const watchedFieldName = connection.sourceField as Path<TFormValues>;

      // Watch for changes to the source field
      const subscription = watch((_, { name, type }) => {
        if (name !== watchedFieldName || type !== "change") {
          return;
        }

        // Prevent recursive updates by tracking processing state
        if (isProcessingConnectionRef.current) return;
        isProcessingConnectionRef.current = true;

        // Create a queue to handle the async operations
        const processConnection = async () => {
          try {
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

            // Track fields to validate after all updates
            const fieldsToValidate = new Set<Path<TFormValues>>();

            if (match) {
              // Update standard target fields
              connection.targetFields.forEach((targetFieldName) => {
                if (targetFieldName === connection.sourceField) return;

                const targetPath = targetFieldName as Path<TFormValues>;
                const fieldConfig = getFieldConfig(targetFieldName);
                const defaultValueFromConfig = fieldConfig?.defaultValue;
                const valueFromMatch = match[targetFieldName];

                let finalValueToSet =
                  valueFromMatch !== undefined
                    ? valueFromMatch
                    : defaultValueFromConfig;

                // Fallback for undefined values
                if (finalValueToSet === undefined) {
                  const fieldType = typeof defaultValueFromConfig;
                  finalValueToSet =
                    fieldType === "number"
                      ? 0
                      : fieldType === "boolean"
                        ? false
                        : "";
                }

                // Apply transformation if available
                if (fieldConfig?.transform?.input) {
                  finalValueToSet =
                    fieldConfig.transform.input(finalValueToSet);
                }

                const currentValue = getValues(targetPath);
                if (currentValue !== finalValueToSet) {
                  setValue(
                    targetPath,
                    finalValueToSet as PathValue<
                      TFormValues,
                      typeof targetPath
                    >,
                    {
                      shouldValidate: false,
                      shouldDirty: true,
                      shouldTouch: true,
                    },
                  );
                  fieldsToValidate.add(targetPath);
                }
              });

              // Run calculations if available
              if (
                connection.calculations &&
                connection.calculations.length > 0
              ) {
                await runCalculations(connection.calculations, match);
                connection.calculations.forEach((calc) =>
                  fieldsToValidate.add(calc.targetField as Path<TFormValues>),
                );
              }
            } else {
              // Clear target fields if no match found and configured to do so
              if (connection.clearTargetsOnNoMatch !== false) {
                const allTargets = [
                  ...connection.targetFields,
                  ...(connection.calculations?.map((c) => c.targetField) ?? []),
                ];

                allTargets.forEach((targetFieldNameOrPath) => {
                  if (targetFieldNameOrPath === connection.sourceField) return;

                  const targetPath = targetFieldNameOrPath as Path<TFormValues>;
                  const fieldConfig = getFieldConfig(
                    targetFieldNameOrPath as keyof TFormValues & string,
                  );

                  let defaultValue = fieldConfig?.defaultValue ?? null;

                  // Apply input transform if available
                  if (fieldConfig?.transform?.input) {
                    defaultValue = fieldConfig.transform.input(defaultValue);
                  }

                  const currentValue = getValues(targetPath);
                  if (currentValue !== defaultValue) {
                    setValue(
                      targetPath,
                      defaultValue as PathValue<TFormValues, typeof targetPath>,
                      {
                        shouldValidate: false,
                        shouldDirty: true,
                        shouldTouch: true,
                      },
                    );
                    fieldsToValidate.add(targetPath);
                  }

                  // Update calculation state in ref
                  if (
                    connection.calculations?.some(
                      (c) => c.targetField === targetPath,
                    )
                  ) {
                    calculationStateRef.current = {
                      ...calculationStateRef.current,
                      [targetPath]: "idle",
                    };
                  }
                });
              }
            }

            // Apply batched UI updates after all processing is done
            updateFormState({
              calculationState: { ...calculationStateRef.current },
            });
          } finally {
            // Always reset the processing flag when done
            isProcessingConnectionRef.current = false;
          }
        };

        // Execute the async processing
        processConnection();
      });

      unsubscribeFns.push(() => subscription.unsubscribe());
    });

    // Clean up all subscriptions
    return () => {
      unsubscribeFns.forEach((unsubscribe) => unsubscribe());
      calculationStateRef.current = {};
      updateFormState({ calculationState: {} });
    };
  }, [
    watch,
    setValue,
    getValues,
    config.fieldConnections,
    getFieldConfig,
    runCalculations,
    form,
    updateFormState,
  ]);

  // Load dependencies more efficiently
  useEffect(() => {
    if (!config.dependencies || config.dependencies.length === 0) {
      updateFormState({ loadingDeps: false });
      return;
    }

    let isMounted = true;

    async function loadDependencies() {
      updateFormState({ loadingDeps: true, depsError: null });

      try {
        const results = await Promise.all(
          config.dependencies!.map(async (dep) => {
            const rawData = await dep.fetcher();
            const options = dep.transform
              ? dep.transform(rawData)
              : (rawData as OptionType[]);
            return { key: dep.key, options };
          }),
        );

        if (!isMounted) return;

        const dataMap = results.reduce<DependencyData>((acc, result) => {
          acc[result.key] = result.options;
          return acc;
        }, {});

        updateFormState({ dependencyData: dataMap, loadingDeps: false });
      } catch (err) {
        if (!isMounted) return;

        const errorMsg =
          err instanceof Error ? err.message : "Failed to load dependencies";
        updateFormState({ depsError: errorMsg, loadingDeps: false });

        toast.error("Error Loading Dependencies", {
          description:
            config.messages.dependencyLoadError ||
            "Could not load required data for the form.",
        });

        console.error("Dependency loading error:", err);
      }
    }

    loadDependencies();

    return () => {
      isMounted = false;
    };
  }, [
    config.dependencies,
    config.messages.dependencyLoadError,
    updateFormState,
  ]);

  // Load entity data for edit mode
  useEffect(() => {
    if (!isEditMode || !id) {
      updateFormState({ loading: false });
      return;
    }

    let isMounted = true;

    async function loadEntity() {
      updateFormState({ loading: true, error: null });

      try {
        const data = await config.apiConfig.fetchOne(id as string);

        if (!isMounted) return;

        const formData = config.apiConfig.transformApiToForm
          ? config.apiConfig.transformApiToForm(data)
          : (data as unknown as TFormValues);

        form.reset(formData);
        updateFormState({ loading: false });
      } catch (err) {
        if (!isMounted) return;

        const errorMsg =
          err instanceof Error ? err.message : "An unknown error occurred";
        updateFormState({ error: errorMsg, loading: false });

        toast.error(`Error loading ${config.entityName.toLowerCase()}`, {
          description: errorMsg || config.messages.loadError,
        });
      }
    }

    loadEntity();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, form, config, updateFormState]);

  // Handle form submission
  const onSubmit = async (values: TFormValues) => {
    updateFormState({ saving: true, error: null });

    try {
      // Transform form data to API format if needed
      const apiData = config.apiConfig.transformFormToApi
        ? config.apiConfig.transformFormToApi(values)
        : (values as unknown as TApiInput);

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
      updateFormState({ error: errorMsg });

      toast.error(`Error saving ${config.entityName.toLowerCase()}`, {
        description: errorMsg || config.messages.saveError,
      });
    } finally {
      updateFormState({ saving: false });
    }
  };

  // Render a single form field based on its type
  const FormFieldComponent = useCallback(
    ({ field }: { field: (typeof config.fields)[number] }) => {
      const isDisabled =
        (field.disabled ? field.disabled(isEditMode) : false) ||
        formState.loadingDeps;

      const componentProps = { ...field.componentProps };
      let options: OptionType[] =
        (field.componentProps?.options as OptionType[]) ?? [];

      // Handle dependency-based options
      if (field.dependencyKey) {
        options = formState.dependencyData[field.dependencyKey] || [];
        componentProps.disabled = isDisabled || !!formState.depsError;

        if (formState.loadingDeps && !options.length) {
          componentProps.placeholder = "Loading options...";
        } else if (formState.depsError && !options.length) {
          componentProps.placeholder = "Error loading options";
        }
      }

      const fieldName = field.name as Path<TFormValues>;
      const calcStatus = formState.calculationState[fieldName];
      const showCalcIndicator = ["pending", "error"].includes(
        calcStatus || "idle",
      );

      return (
        <FormField
          control={control}
          name={field.name as Path<TFormValues>}
          render={({ field: formField }) => (
            <FormItem>
              {field.component !== "Checkbox" && (
                <FormLabel>{field.label}</FormLabel>
              )}
              <FormControl>
                <div className="relative flex items-center">
                  {field.component === "Textarea" && (
                    <Textarea
                      placeholder={field.placeholder}
                      {...formField}
                      disabled={isDisabled}
                      {...componentProps}
                      value={formField.value as string}
                    />
                  )}

                  {field.component === "Checkbox" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={formField.value as boolean}
                        onCheckedChange={formField.onChange}
                        disabled={isDisabled}
                        {...componentProps}
                      />
                      <span>{field.label}</span>
                    </div>
                  )}

                  {field.component === "Select" && (
                    <Select
                      onValueChange={formField.onChange}
                      defaultValue={formField.value as string}
                      value={formField.value as string}
                      disabled={isDisabled || !!formState.depsError}
                      {...componentProps}
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
                            {formState.loadingDeps
                              ? "Loading..."
                              : formState.depsError
                                ? "Error"
                                : "No options"}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}

                  {field.component === "ComboBox" && (
                    <ComboBox
                      {...formField}
                      {...componentProps}
                      disabled={isDisabled}
                      onChange={formField.onChange}
                      value={formField.value as string}
                      options={options}
                    />
                  )}

                  {(field.component === "Input" || !field.component) && (
                    <Input
                      {...formField}
                      {...componentProps}
                      type={
                        (componentProps?.type as HTMLInputTypeAttribute) ??
                        "text"
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        // Handle number input conversion
                        if (componentProps?.type === "number") {
                          formField.onChange(
                            value === "" ? NaN : parseFloat(value),
                          );
                        } else {
                          formField.onChange(value);
                        }
                      }}
                      placeholder={field.placeholder}
                      disabled={isDisabled}
                      value={formField.value as string}
                    />
                  )}

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
              </FormControl>
              {field.description && (
                <FormDescription>{field.description}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      );
    },
    [control, formState, isEditMode],
  );

  // Render form in sections or as a flat list
  const renderFields = useCallback(() => {
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
              return <FormFieldComponent key={field.name} field={field} />;
            })}
          </div>
        </div>
      ));
    }

    return config.fields.map((field) => (
      <FormFieldComponent key={field.name} field={field} />
    ));
  }, [config.fields, config.layout?.sections, FormFieldComponent]);

  // Get CSS class for grid layout
  const getGridClass = useCallback(() => {
    if (!config.layout?.columns || config.layout.columns === 1) {
      return "space-y-6";
    }
    return config.layout.columns === 2
      ? "grid grid-cols-1 md:grid-cols-2 gap-6"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  }, [config.layout?.columns]);

  // Render loading state
  if (formState.loading || formState.loadingDeps) {
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
            {Array(Math.min(config.fields.length, 5))
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

  // Render error state
  const loadError = formState.error || formState.depsError;
  if (loadError && !formState.saving && isEditMode && !form.formState.isDirty) {
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
          <AlertDescription>{formState.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const pageTitle = isEditMode
    ? `Edit ${config.entityName}`
    : `Add New ${config.entityName}`;

  const pageDescription = isEditMode
    ? `Update ${config.entityName.toLowerCase()} details.`
    : `Fill in details for the new ${config.entityName.toLowerCase()}.`;

  // Render form
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
              {formState.error && formState.saving && (
                <Alert variant="destructive" className="col-span-full">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Save Error</AlertTitle>
                  <AlertDescription>{formState.error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className={config.layout?.columns ? "col-span-full" : ""}>
                <Button
                  type="submit"
                  disabled={formState.saving || !!formState.depsError}
                >
                  {formState.saving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {formState.saving
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
