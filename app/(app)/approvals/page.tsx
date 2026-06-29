"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// Assessment & Approval was merged into Loan Applications as the "Assessment
// queue" tab. Keep this route as a redirect so old links/bookmarks still work.
export default function ApprovalsRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/applications?tab=queue");
  }, [router]);
  return null;
}
