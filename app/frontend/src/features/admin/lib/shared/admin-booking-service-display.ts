type AdminBookingServiceDisplayInput = {
  serviceDisplayName?: string | null;
  serviceVariant?: string | null;
  serviceIssue?: string | null;
  serviceComplaint?: string | null;
  serviceType?: {
    name: string;
  } | null;
};

function cleanValue(value: string | null | undefined) {
  return value?.trim() || "";
}

export function getAdminBookingBaseServiceLabel(input: AdminBookingServiceDisplayInput) {
  return cleanValue(input.serviceDisplayName) || cleanValue(input.serviceType?.name) || "-";
}

export function getAdminBookingExtraServiceLabel(input: AdminBookingServiceDisplayInput) {
  const serviceVariant = cleanValue(input.serviceVariant);
  const serviceIssue = cleanValue(input.serviceIssue);
  const serviceComplaint = cleanValue(input.serviceComplaint);

  if (serviceVariant) {
    return serviceVariant;
  }

  if (serviceIssue && serviceIssue !== "Lainnya") {
    return serviceIssue;
  }

  if (serviceComplaint) {
    return serviceComplaint;
  }

  return serviceIssue;
}

export function getAdminBookingServiceDisplayLabel(input: AdminBookingServiceDisplayInput) {
  const baseLabel = getAdminBookingBaseServiceLabel(input);
  const extraLabel = getAdminBookingExtraServiceLabel(input);

  return extraLabel ? `${baseLabel} | ${extraLabel}` : baseLabel;
}
