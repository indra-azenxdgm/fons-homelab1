export function sanitizeFreeText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replace(/[<>{}]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeEmail(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .toLowerCase();
}

export function normalizePhoneNumber(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const compact = value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .replace(/(?!^\+)[+]/g, "")
    .replace(/[^\d+]/g, "");

  if (!compact) {
    return "";
  }

  if (compact.startsWith("+62")) {
    return `62${compact.slice(3)}`;
  }

  if (compact.startsWith("62")) {
    return compact;
  }

  if (compact.startsWith("08")) {
    return `62${compact.slice(1)}`;
  }

  if (compact.startsWith("8")) {
    return `62${compact}`;
  }

  return compact.replace(/^\+/, "");
}

export function normalizeMapsUrl(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

export function isAllowedMapsUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    if (
      hostname === "maps.google.com" ||
      hostname === "maps.app.goo.gl" ||
      hostname === "goo.gl"
    ) {
      return true;
    }

    if (
      (hostname === "google.com" || hostname.endsWith(".google.com")) &&
      (pathname === "/maps" || pathname.startsWith("/maps/") || url.searchParams.has("q"))
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
