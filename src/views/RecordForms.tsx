"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ContactEditor } from "../components/ContactEditor";
import { PackageEditor, ServiceEditor } from "../components/editors";
import { Empty } from "../components/ui";
import { useStore } from "../store";

export function ServiceFormPage({ mode }: { mode: "new" | "edit" }) {
  const { id } = useParams();
  const router = useRouter();
  const store = useStore();
  const initial = mode === "edit" ? store.services.find((item) => item.id === id) || null : null;
  if (mode === "edit" && !initial) {
    return <div className="page"><Empty title="Service missing" text="It was removed from the catalog." action={<Link href="/catalog/services" className="btn">Services</Link>} /></div>;
  }
  return (
    <ServiceEditor
      page
      open
      initial={initial}
      onClose={() => router.push(mode === "edit" && initial ? `/catalog/${initial.id}` : "/catalog/services")}
    />
  );
}

export function PackageFormPage({ mode }: { mode: "new" | "edit" }) {
  const { id } = useParams();
  const router = useRouter();
  const store = useStore();
  const initial = mode === "edit" ? store.packages.find((item) => item.id === id) || null : null;
  if (mode === "edit" && !initial) {
    return <div className="page"><Empty title="Package missing" text="It was removed from the offers." action={<Link href="/packages" className="btn">Packages</Link>} /></div>;
  }
  return (
    <PackageEditor
      page
      open
      initial={initial}
      onClose={() => router.push(mode === "edit" && initial ? `/packages/${initial.id}` : "/packages")}
    />
  );
}

export function ContactFormPage({ mode }: { mode: "new" | "edit" }) {
  const { id } = useParams();
  const router = useRouter();
  const params = useSearchParams();
  const store = useStore();
  const attach = params.get("attach");
  const initial = mode === "edit" ? store.contacts.find((item) => item.id === id) || null : null;
  if (mode === "edit" && !initial) {
    return <div className="page"><Empty title="Contact missing" text="They were removed from the book." action={<Link href="/contacts" className="btn">Contacts</Link>} /></div>;
  }
  const back = attach ? `/projects/${attach}?tab=contacts` : mode === "edit" && initial ? `/contacts/${initial.id}` : "/contacts";
  return (
    <ContactEditor
      page
      open
      initial={initial}
      onClose={() => router.push(back)}
      onSaved={(contact) => {
        if (attach) store.attachContact(attach, contact.id);
      }}
    />
  );
}
