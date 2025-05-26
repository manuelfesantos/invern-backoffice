import { useState, useEffect, Fragment } from "react";
import { useParams, Link } from "react-router-dom";
import { DomainDetailConfig, DetailFieldConfig } from "@/types/detail-config";
import { DomainEntity } from "@/types/form-config"; // Re-use DomainEntity if suitable
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn, getValueByPath } from "@/lib/utils"; // Import helpers

interface DomainDetailPageProps<TApiOutput extends DomainEntity> {
  config: DomainDetailConfig<TApiOutput>;
  keyParam?: string; // URL parameter name for the ID (defaults to 'id')
}

export function DomainDetailPage<TApiOutput extends DomainEntity>({
  config,
  keyParam = "id",
}: DomainDetailPageProps<TApiOutput>) {
  const params = useParams<Record<string, string>>();
  const id = params[keyParam];

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TApiOutput | null>(null);

  useEffect(() => {
    if (!id) {
      setError(`Missing key parameter '${keyParam}' in URL.`);
      setLoading(false);
      return;
    }

    async function loadEntity() {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const fetchedData = await config.apiConfig.fetchOne(id as string);
        setData(fetchedData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          const errorMsg =
            err.message ||
            config.messages.loadError ||
            "An unknown error occurred";
          setError(errorMsg);
          // Check for 404 specifically if needed (depends on api.ts throwing specific errors)
          if (
            "status" in err &&
            err.status === 404 &&
            config.messages.notFound
          ) {
            setError(config.messages.notFound);
          }
          toast.error(`Error loading ${config.entityName.toLowerCase()}`, {
            description: errorMsg,
          });
        }
      } finally {
        setLoading(false);
      }
    }

    loadEntity();
  }, [id, config, keyParam]); // Depend on id, config, and keyParam

  const renderField = (
    fieldConfig: DetailFieldConfig<TApiOutput>,
    entity: TApiOutput,
  ) => {
    console.log("Field config renderIf:", fieldConfig.renderIf);
    if (fieldConfig.renderIf && !fieldConfig.renderIf(entity)) {
      return null;
    }

    const rawValue = getValueByPath(entity, fieldConfig.key);
    const displayValue = fieldConfig.format
      ? fieldConfig.format(rawValue, entity)
      : (rawValue ?? <span className="text-muted-foreground italic">N/A</span>); // Default handling

    return (
      // Using divs for easier grid layout, but dl/dt/dd is semantically better if single column
      <Fragment key={fieldConfig.key}>
        <div
          className={cn(
            "text-sm font-medium text-muted-foreground",
            fieldConfig.labelClassName,
          )}
        >
          {fieldConfig.label}
        </div>
        <div className={cn("text-sm", fieldConfig.className)}>
          {displayValue}
        </div>
      </Fragment>
    );
  };

  const renderContent = () => {
    if (!data) return null; // Should be handled by loading/error states

    const allFieldsMap = new Map(config.fields.map((f) => [f.key, f]));

    // Render based on layout config
    if (config.layout?.sections) {
      return config.layout.sections.map((section, index) => {
        if (section.renderIf && !section.renderIf(data)) {
          return null; // Skip rendering this section
        }
        return (
          <div key={index} className={cn("mb-8", section.className)}>
            {section.title && (
              <h3 className="text-lg font-semibold mb-1">{section.title}</h3>
            )}
            {section.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {section.description}
              </p>
            )}
            <div
              className={cn(
                "grid gap-x-4 gap-y-2",
                config?.layout?.columns === 2
                  ? "grid-cols-[max-content_1fr] md:grid-cols-[max-content_1fr_max-content_1fr]"
                  : "grid-cols-[max-content_1fr]", // Adjust grid template
              )}
            >
              {section.fields.map((fieldKey) => {
                const fieldConfig = allFieldsMap.get(fieldKey as string);
                return fieldConfig ? renderField(fieldConfig, data) : null;
              })}
            </div>
          </div>
        );
      });
    }

    // Default: Render all fields in defined columns
    return (
      <div
        className={cn(
          "grid gap-x-4 gap-y-2",
          config.layout?.columns === 2
            ? "grid-cols-[max-content_1fr] md:grid-cols-[max-content_1fr_max-content_1fr]"
            : "grid-cols-[max-content_1fr]",
          config.layout?.mainClassName,
        )}
      >
        {config.fields.map((fieldConfig) => renderField(fieldConfig, data))}
      </div>
    );
  };

  // --- Loading State ---
  if (loading) {
    const fieldCount = config.fields.length;
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-8 w-40 mb-6" /> {/* Back button */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-9 w-20" /> {/* Edit button */}
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {Array.from({ length: Math.max(fieldCount, 4) }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
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

  // --- Render Details ---
  if (!data) {
    // Should not happen if loading/error states are handled, but acts as a fallback
    return (
      <div className="container mx-auto py-10 text-center text-muted-foreground">
        Could not load {config.entityName.toLowerCase()} data.
      </div>
    );
  }

  const entityId = data[config.keyField] as string | number; // Get the actual ID

  return (
    <div className="container mx-auto py-10">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link to={config.routes.list}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
          {config.entityNamePlural}
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>{config.entityName} Details</CardTitle>
            <CardDescription>
              ID: <span className="font-mono text-xs">{entityId}</span>
            </CardDescription>
          </div>
          {config.routes.edit && (
            <Button variant="outline" size="sm" asChild>
              <Link to={config.routes.edit(String(entityId))}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
          )}
          {/* Add placeholder for config.customActions if needed */}
        </CardHeader>
        <CardContent className="pt-6">{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
