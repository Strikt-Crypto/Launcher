"use client";

import { Suspense } from "react";
import { Providers } from "@/views/Providers";

export default function Page() {
  return (
    <Suspense fallback={<div className="page" />}>
      <Providers />
    </Suspense>
  );
}
