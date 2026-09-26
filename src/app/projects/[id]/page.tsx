"use client";

import { Suspense } from "react";
import { ProjectPage } from "@/views/ProjectPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="page">Opening the worksheet…</div>}>
      <ProjectPage />
    </Suspense>
  );
}
