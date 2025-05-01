// src/pages/ProductFormPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  fetchProductById,
  createProduct,
  updateProduct,
  fetchCollections,
} from "@/services/api";
import type {
  ApiProductDetail,
  ApiProductInput,
  ApiCollection,
} from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Use Label directly or FormLabel from Form component
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // For collection dropdown
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"; // Shadcn Form
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// --- Zod Schema for Validation ---
const productFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional().default(""), // Provide default
  priceInCents: z.coerce
    .number()
    .int()
    .positive({ message: "Price must be positive." }),
  stock: z.coerce
    .number()
    .int()
    .min(0, { message: "Stock cannot be negative." }),
  weight: z.coerce
    .number()
    .int()
    .positive({ message: "Weight must be positive." }),
  collectionId: z.string().min(1, { message: "Please select a collection." }), // Ensure selection
  // TODO: Add image validation if needed - complex, often handled separately
  images: z
    .array(z.object({ url: z.string().url(), alt: z.string() }))
    .optional()
    .default([]),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== undefined && id !== "new"; // Check if editing or creating

  const [loading, setLoading] = useState<boolean>(isEditMode); // Only load data if editing
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<ApiCollection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState<boolean>(true);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      // Initialize default values
      name: "",
      description: "",
      priceInCents: 0,
      stock: 0,
      weight: 0,
      collectionId: "",
      images: [], // Default image array
    },
    mode: "onChange", // Validate on change
  });

  // Fetch collections for the dropdown
  useEffect(() => {
    async function loadCollections() {
      try {
        setLoadingCollections(true);
        const data = await fetchCollections();
        setCollections(data);
      } catch (err) {
        console.error("Failed to load collections for dropdown:", err);
        // Handle error (e.g., show a message)
        toast.error("Error Loading Collections", {
          description: "Could not load collections for selection.",
        });
      } finally {
        setLoadingCollections(false);
      }
    }
    loadCollections();
  }, [toast]);

  // Fetch existing product data if in edit mode
  useEffect(() => {
    if (!isEditMode || !id) {
      // Check id specifically for type safety
      setLoading(false); // Not loading if creating
      return;
    }

    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProductById(id as string);
        // Reset form with fetched data
        form.reset({
          name: data.name,
          description: data.description || "", // Handle potential null description
          priceInCents: data.priceInCents, // Base price
          stock: data.stock,
          weight: data.weight,
          collectionId: data.collection.id, // Use ID from fetched data
          images: data.images || [], // Handle potential null images
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        toast.error("Error Loading Product", {
          description:
            err instanceof Error ? err.message : "Could not load product.",
        });
        // Optionally navigate back on load error
        // navigate('/products');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id, isEditMode, form, toast]); // form and toast added to deps

  // Handle form submission
  const onSubmit = async (values: ProductFormValues) => {
    setSaving(true);
    setError(null);

    // Ensure numeric values are numbers, not strings if using coerce
    const apiData: ApiProductInput = {
      ...values,
      priceInCents: Number(values.priceInCents),
      stock: Number(values.stock),
      weight: Number(values.weight),
      // Ensure images are structured correctly if manipulation is needed
      images: values.images || [],
    };

    try {
      let result: ApiProductDetail;
      if (isEditMode && id) {
        result = await updateProduct(id, apiData);
        toast.success("Product Updated", {
          description: `Product "${result.name}" has been successfully updated.`,
        });
      } else {
        result = await createProduct(apiData);
        toast.success("Product Created", {
          description: `Product "${result.name}" has been successfully created.`,
        });
      }
      navigate("/products"); // Navigate back to list on success
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      toast.error("Error Saving Product", {
        description:
          err instanceof Error ? err.message : "Could not save product.",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Render Loading State ---
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-8 w-32 mb-6" /> {/* Back button */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" /> {/* Title */}
            <Skeleton className="h-4 w-60" /> {/* Description */}
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" /> {/* Save button */}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Render Error State ---
  if (error && !loading && isEditMode) {
    // Show specific error for edit mode load fail
    return (
      <div className="container mx-auto py-10">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link to="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Product</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Render Form ---
  return (
    <div className="container mx-auto py-10">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link to="/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit Product" : "Add New Product"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the details for this product."
              : "Fill in the details for the new product."}
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
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Awesome Gadget" {...field} />
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
                        placeholder="Detailed description..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Collection Dropdown */}
              <FormField
                control={form.control}
                name="collectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger disabled={loadingCollections}>
                          <SelectValue
                            placeholder={
                              loadingCollections
                                ? "Loading..."
                                : "Select a collection"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {
                          !loadingCollections && collections.length > 0 ? (
                            collections.map((col) => (
                              <SelectItem key={col.id} value={col.id}>
                                {col.name}
                              </SelectItem>
                            ))
                          ) : !loadingCollections ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No collections found.
                            </div>
                          ) : null // Show nothing while loading placeholder is active
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price, Stock, Weight in Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Price */}
                <FormField
                  control={form.control}
                  name="priceInCents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (in Cents)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 1999"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Stock */}
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 100"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Weight */}
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (in Grams)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* TODO: Add Image Upload/Management Component Here */}
              {/* This is complex and depends on your storage solution */}
              <div className="p-4 border rounded bg-muted/40">
                <Label>Images</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Image management not implemented yet.
                </p>
                {/* Display current images if any */}
                {form.getValues("images")?.map((img, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 mt-2 text-xs"
                  >
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="h-8 w-8 object-contain rounded border"
                    />
                    <span>
                      {img.url} ({img.alt})
                    </span>
                  </div>
                ))}
              </div>

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
                    ? "Update Product"
                    : "Create Product"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
