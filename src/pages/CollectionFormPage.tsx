// src/pages/CollectionFormPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  fetchCollectionById,
  createCollection,
  updateCollection,
} from "@/services/api";
import type { ApiCollectionDetail, ApiCollectionInput } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

// --- Zod Schema ---
const collectionFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional().default(""),
  // Basic image validation for now, more complex usually needed
  image: z
    .object({
      url: z.string().url({ message: "Please enter a valid image URL." }),
      alt: z.string().min(1, { message: "Please provide image alt text." }),
    })
    .optional()
    .default({ url: "", alt: "" }), // Default empty image object
});

type CollectionFormValues = z.infer<typeof collectionFormSchema>;

export function CollectionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== undefined && id !== "new";

  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      image: { url: "", alt: "" }, // Ensure image object is initialized
    },
    mode: "onChange",
  });

  // Fetch existing data if in edit mode
  useEffect(() => {
    if (!isEditMode || !id) {
      setLoading(false);
      return;
    }

    async function loadCollection() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCollectionById(id as string);
        form.reset({
          name: data.name,
          description: data.description || "",
          image: data.image || { url: "", alt: "" }, // Handle potential null image
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        toast.error("Error loading collection", {
          description:
            err instanceof Error ? err.message : "An unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    }
    loadCollection();
  }, [id, isEditMode, form]);

  // Handle form submission
  const onSubmit = async (values: CollectionFormValues) => {
    setSaving(true);
    setError(null);

    const apiData: ApiCollectionInput = {
      name: values.name,
      description: values.description,
      // Ensure image is structured correctly, handle case where it might be optional
      image: values.image?.url ? values.image : { url: "", alt: "" }, // Or adjust based on backend requirements
    };

    // Basic check if image URL is provided, adjust logic as needed
    if (!apiData.image.url) {
      form.setError("image.url", { message: "Image URL is required." });
      setSaving(false);
      return;
    }

    try {
      let result: ApiCollectionDetail;
      if (isEditMode && id) {
        result = await updateCollection(id, apiData);
        toast.success("Collection Updated", {
          description: `Collection "${result.name}" has been successfully updated.`,
        });
      } else {
        result = await createCollection(apiData);
        toast.success("Collection Created", {
          description: `Collection "${result.name}" has been successfully created.`,
        });
      }
      navigate("/collections"); // Navigate back to list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      toast.error("Error saving collection", {
        description:
          err instanceof Error ? err.message : "Could not save collection.",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-8 w-36 mb-6" /> {/* Back button */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-36" /> {/* Save button */}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Error State ---
  if (error && !loading && isEditMode) {
    return (
      <div className="container mx-auto py-10">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link to="/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Collection</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Render Form ---
  return (
    <div className="container mx-auto py-10">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link to="/collections">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collections
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit Collection" : "Add New Collection"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the details for this collection."
              : "Fill in the details for the new collection."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Summer Sale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Details about the collection..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image URL */}
              <FormField
                control={form.control}
                name="image.url" // Access nested field
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the full URL for the collection image.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Image Alt Text */}
              <FormField
                control={form.control}
                name="image.alt" // Access nested field
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Alt Text</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe the image" {...field} />
                    </FormControl>
                    <FormDescription>
                      Important for accessibility.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display general save error */}
              {error && !saving && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Save Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving
                  ? "Saving..."
                  : isEditMode
                    ? "Update Collection"
                    : "Create Collection"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
