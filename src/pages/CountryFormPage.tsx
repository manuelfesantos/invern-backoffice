// src/pages/CountryFormPage.tsx
import { DomainForm } from "@/components/domain/DomainFormPage.tsx";
import { countryFormConfig } from "@/config/forms/country.config";

export function CountryFormPage() {
  return <DomainForm config={countryFormConfig} keyParam="code" />;
}
