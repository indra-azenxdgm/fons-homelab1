export const adminBookingFilterDefaults = {
  q: "",
  date: "",
  status: "",
  assignedSquadId: "",
  serviceTypeId: "",
} as const;

export const adminCalendarFilterDefaults = {
  q: "",
  status: "",
  assignedSquadId: "",
  serviceTypeId: "",
} as const;

export const adminSquadFilterDefaults = {
  q: "",
  status: "",
} as const;

export const adminCustomerFilterDefaults = {
  q: "",
  activity: "",
} as const;

export const adminUserRoleFilterDefaults = {
  q: "",
  role: "",
  status: "",
} as const;

export const adminFinanceIncomeFilterDefaults = {
  q: "",
  from: "",
  to: "",
  paymentMethod: "",
  bookingLink: "",
} as const;

export const adminFinanceExpenseFilterDefaults = {
  q: "",
  from: "",
  to: "",
} as const;
