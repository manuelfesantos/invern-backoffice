import { DomainDetailPage } from "@/components/domain/DomainDetailPage";
import { userDetailConfig } from "@/config/details/userDetailConfig";
import type { ApiBaseUser } from "@/types/api";

export function UserDetailPage() {
  // Specify the generic type for better type checking
  return (
    <DomainDetailPage<ApiBaseUser> config={userDetailConfig} keyParam="id" />
  );
}
