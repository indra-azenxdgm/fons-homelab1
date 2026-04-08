export const OPERATIONAL_DATA_WIPE_CONFIRMATION_PHRASE = "WIPE OPERATIONAL DATA";

export type AdminOperationalDataWipeScope = {
  bookings: number;
  customers: number;
  incomeRecords: number;
  expenseRecords: number;
  adminNotifications: number;
  submissionAttemptLogs?: number;
};

export type AdminOperationalDataWipeResponse = {
  success: boolean;
  dryRun: boolean;
  scope: AdminOperationalDataWipeScope;
  deleted?: AdminOperationalDataWipeScope;
  message: string;
};
