"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import logger from "@/lib/logger";

// The AdminSession row is deliberately left behind: it records that this person
// has signed in at least once, which is what the reviewer picker reads. Deleting
// it on logout would empty the picker of everyone not currently connected.
export async function logoutAction(): Promise<void> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();

  if (user?.email) {
    logger.info({ email: user.email.toLowerCase() }, "User logout");
  }

  redirect("/login");
}
