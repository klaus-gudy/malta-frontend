"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// Collections was merged into Loan Accounts — the account detail page has a
// "Receive payment" button that links to /collections/:id/pay. Keep this route
// as a redirect so old links/bookmarks still work.
export default function CollectionsRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/accounts");
  }, [router]);
  return null;
}
