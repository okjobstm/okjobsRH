import { AuthForm } from "@/components/auth/auth-form";
import { getSafeAdminReturnTo } from "@/lib/auth-redirect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return <AuthForm mode="signup" returnTo={getSafeAdminReturnTo(returnTo)} />;
}
