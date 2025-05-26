// src/pages/CartDetailPage.tsx (Create this new file)
import { DomainDetailPage } from "@/components/domain/DomainDetailPage";
import { cartDetailConfig } from "@/config/details/cartDetailConfig";
import type { ApiCart } from "@/types/api";

export function CartDetailPage() {
  // Specify the generic type
  return <DomainDetailPage<ApiCart> config={cartDetailConfig} keyParam="id" />;
}
