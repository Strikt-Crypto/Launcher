"use client";

import { Suspense } from "react";
import { PlatformPage } from "@/views/PlatformPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="page" />}>
      <PlatformPage />
    </Suspense>
  );
}
