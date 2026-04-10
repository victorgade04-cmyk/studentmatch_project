"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * Drop-in replacement for Next.js Link that automatically appends
 * ?preview=admin when the admin is in preview mode.
 */
export default function PreviewLink({
  href,
  ...props
}: ComponentProps<typeof Link>) {
  const params = useSearchParams();
  const isPreview = params.get("preview") === "admin";

  const effectiveHref =
    isPreview && typeof href === "string"
      ? `${href}${href.includes("?") ? "&" : "?"}preview=admin`
      : href;

  return <Link href={effectiveHref} {...props} />;
}
