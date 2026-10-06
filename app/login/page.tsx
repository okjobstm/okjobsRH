import { AuthForm } from "@/components/auth/auth-form";
import { getSafeAdminReturnTo } from "@/lib/auth-redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const { error, returnTo } = await searchParams;
  return <AuthForm externalError={error} mode="login" returnTo={getSafeAdminReturnTo(returnTo)} />;
}
