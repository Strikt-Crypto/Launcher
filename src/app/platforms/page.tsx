"use client";

import { Suspense } from "react";
import { Platforms } from "@/views/Platforms";

export default function Page() {
  return (
    <Suspense fallback={<div className="page" />}>
      <Platforms />
    </Suspense>
  );
}
