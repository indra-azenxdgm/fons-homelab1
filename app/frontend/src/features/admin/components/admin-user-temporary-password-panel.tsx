"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

type AdminUserTemporaryPasswordPanelProps = {
  password: string;
  title: string;
  description: string;
};

export function AdminUserTemporaryPasswordPanel({
  password,
  title,
  description,
}: AdminUserTemporaryPasswordPanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-[1rem] border border-primary/18 bg-primary/6 px-4 py-3">
      <p className="admin-card-title">{title}</p>
      <p className="admin-meta-text mt-1">{description}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <code className="rounded-[0.9rem] border border-border/80 bg-white px-3 py-2 text-[12px] font-semibold leading-5 tracking-[0.04em] text-foreground">
          {password}
        </code>
        <Button type="button" variant="outline" className="admin-button-text h-8 rounded-full px-3" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="size-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy password
            </>
          )}
        </Button>
      </div>
      <p className="admin-meta-text mt-3">
        This temporary password is shown only once. Share it securely and ask the user to change it immediately after sign-in.
      </p>
    </div>
  );
}
