import type { Prisma } from "@prisma/client";

import type { AdminSessionUser } from "@/features/admin/lib/auth";
import { db } from "@/lib/prisma";

export const OPERATIONAL_DATA_WIPE_CONFIRMATION_PHRASE = "WIPE OPERATIONAL DATA";

export type OperationalDataWipeScope = {
  bookings: number;
  customers: number;
  incomeRecords: number;
  expenseRecords: number;
  adminNotifications: number;
  submissionAttemptLogs?: number;
};

export type OperationalDataWipeResult = {
  success: boolean;
  dryRun: boolean;
  scope: OperationalDataWipeScope;
  deleted?: OperationalDataWipeScope;
  message: string;
};

type OperationalDataWipeInput = {
  confirmationText: string;
  dryRun: boolean;
  includeSubmissionLogs?: boolean;
  adminUser: Pick<AdminSessionUser, "id" | "email" | "role">;
};

async function buildOperationalDataScope(
  tx: Prisma.TransactionClient,
  includeSubmissionLogs: boolean,
): Promise<OperationalDataWipeScope> {
  const [
    bookings,
    customers,
    incomeRecords,
    expenseRecords,
    adminNotifications,
    submissionAttemptLogs,
  ] = await Promise.all([
    tx.booking.count(),
    tx.customer.count(),
    tx.incomeRecord.count(),
    tx.expenseRecord.count(),
    tx.adminNotification.count(),
    includeSubmissionLogs ? tx.submissionAttemptLog.count() : Promise.resolve(undefined),
  ]);

  return {
    bookings,
    customers,
    incomeRecords,
    expenseRecords,
    adminNotifications,
    ...(includeSubmissionLogs ? { submissionAttemptLogs } : {}),
  };
}

function normalizeConfirmationText(value: string) {
  return value.trim();
}

function assertSuperAdmin(adminUser: Pick<AdminSessionUser, "role">) {
  if (adminUser.role !== "SUPER_ADMIN") {
    throw new Error("SUPER_ADMIN_REQUIRED");
  }
}

function assertConfirmationText(input: {
  dryRun: boolean;
  confirmationText: string;
}) {
  if (input.dryRun) {
    return;
  }

  if (normalizeConfirmationText(input.confirmationText) !== OPERATIONAL_DATA_WIPE_CONFIRMATION_PHRASE) {
    throw new Error("OPERATIONAL_DATA_WIPE_CONFIRMATION_INVALID");
  }
}

export async function wipeOperationalData(
  input: OperationalDataWipeInput,
): Promise<OperationalDataWipeResult> {
  assertSuperAdmin(input.adminUser);
  assertConfirmationText(input);

  const includeSubmissionLogs = input.includeSubmissionLogs === true;

  return db.$transaction(async (tx) => {
    const scope = await buildOperationalDataScope(tx, includeSubmissionLogs);

    if (input.dryRun) {
      return {
        success: true,
        dryRun: true,
        scope,
        message: "Dry run completed. No operational data was deleted.",
      };
    }

    const deletedIncomeRecords = await tx.incomeRecord.deleteMany({});
    const deletedExpenseRecords = await tx.expenseRecord.deleteMany({});
    // Safe today because AdminNotification is currently used only for booking-operational inbox items.
    // If global/system notices are ever stored in the same table, narrow this wipe scope first.
    const deletedAdminNotifications = await tx.adminNotification.deleteMany({});
    const deletedSubmissionAttemptLogs = includeSubmissionLogs
      ? await tx.submissionAttemptLog.deleteMany({})
      : null;
    const deletedBookings = await tx.booking.deleteMany({});
    const deletedCustomers = await tx.customer.deleteMany({});

    const deleted: OperationalDataWipeScope = {
      bookings: deletedBookings.count,
      customers: deletedCustomers.count,
      incomeRecords: deletedIncomeRecords.count,
      expenseRecords: deletedExpenseRecords.count,
      adminNotifications: deletedAdminNotifications.count,
      ...(includeSubmissionLogs
        ? { submissionAttemptLogs: deletedSubmissionAttemptLogs?.count ?? 0 }
        : {}),
    };

    await tx.adminAuthLog.create({
      data: {
        adminUserId: input.adminUser.id,
        event: "operational_data_wipe_executed",
        outcome: "succeeded",
        reason: "operational_data_deleted",
        identifier: input.adminUser.email,
        metadata: {
          includeSubmissionLogs,
          scope,
          deleted,
          preservedEntities: [
            "AdminUser",
            "AdminSession",
            "AdminAuthLog",
            "Squad",
            "ServiceType",
            "CompanyProfile",
            "AdminNotificationRuleConfig",
          ],
        },
      },
    });

    return {
      success: true,
      dryRun: false,
      scope,
      deleted,
      message: "Operational data wipe completed successfully.",
    };
  });
}
