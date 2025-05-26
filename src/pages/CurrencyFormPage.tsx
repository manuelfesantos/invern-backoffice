// src/pages/CountryFormPage.tsx
import { DomainForm } from "@/components/domain/DomainFormPage.tsx";
import { currencyFormConfig } from "@/config/forms/currency.config";

export function CurrencyFormPage() {
  return <DomainForm config={currencyFormConfig} keyParam="code" />;
}
