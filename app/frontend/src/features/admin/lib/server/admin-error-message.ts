import { BackendApiError } from "@/lib/api-client";

export function getAdminDataErrorMessage(error: unknown, fallback: string) {
  if (error instanceof BackendApiError) {
    if (error.status >= 500) {
      return "The backend is available but returned a server error. Check the backend logs and try again.";
    }

    return error.message || fallback;
  }

  return fallback;
}
