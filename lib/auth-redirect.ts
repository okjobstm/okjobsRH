export function getSafeAdminReturnTo(value: FormDataEntryValue | string | null | undefined): string {
  if (typeof value !== "string") return "/admin";

  const candidate = value.trim();
  if (
    !candidate.startsWith("/admin") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return "/admin";
  }

  return candidate;
}
