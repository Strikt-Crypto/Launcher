"use client";

import { Suspense } from "react";
import { ContactFormPage } from "@/views/RecordForms";

export default function Page() {
  return (
    <Suspense fallback={<div className="page" />}>
      <ContactFormPage mode="edit" />
    </Suspense>
  );
}
