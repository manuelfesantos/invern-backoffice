// src/components/layout/PageWrapper.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, PlusCircle } from "lucide-react";

interface PageWrapperProps {
  title: string;
  isLoading?: boolean; // Optional, if the wrapper itself needs to show loading
  error?: string | null; // For top-level fetch errors before content renders
  addHref?: string; // URL for the "Add New" button
  addLabel?: string; // Text for the "Add New" button
  children: React.ReactNode;
}

export function PageWrapper({
  title,
  isLoading = false, // Default to false
  error,
  addHref,
  addLabel = "Add New", // Default label
  children,
}: PageWrapperProps) {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        {addHref && (
          <Button onClick={() => navigate(addHref)}>
            <PlusCircle className="mr-2 h-4 w-4" /> {addLabel}
          </Button>
        )}
      </div>

      {/* Display top-level error if provided and not loading */}
      {error && !isLoading && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Render main content */}
      {/* We assume children will handle their own loading/error states internally if needed */}
      {children}
    </div>
  );
}
