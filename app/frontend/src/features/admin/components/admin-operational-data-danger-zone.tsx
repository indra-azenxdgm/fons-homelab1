"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle, RefreshCcw, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { pushAppToast } from "@/components/app-toast-viewport";
import { Button } from "@/components/ui/button";
import {
  BackendApiError,
  postAdminOperationalDataWipeBrowser,
} from "@/features/admin/api/operational-data-browser-api";
import {
  OPERATIONAL_DATA_WIPE_CONFIRMATION_PHRASE,
  type AdminOperationalDataWipeResponse,
  type AdminOperationalDataWipeScope,
} from "@/features/admin/lib/shared/admin-operational-data-types";

type AdminOperationalDataDangerZoneProps = {
  initialPreview: AdminOperationalDataWipeResponse;
};

const deletableEntities = [
  "Bookings and squad assignments",
  "Booking activity logs and delivery logs",
  "Admin inbox notifications",
  "Income and expense records",
  "Customers linked to operational history",
  "Optional submission attempt logs",
] as const;

const preservedEntities = [
  "Admin users, roles, sessions, and auth logs",
  "Squads and service types",
  "Company profile and notification rule settings",
  "Admin notification preferences",
  "Company logo uploads under public/uploads/company-profile",
] as const;

const numberFormatter = new Intl.NumberFormat("en-US");

function formatCount(value: number | undefined) {
  return numberFormatter.format(value ?? 0);
}

function getScopeRows(scope: AdminOperationalDataWipeScope) {
  return [
    { label: "Bookings", value: scope.bookings },
    { label: "Customers", value: scope.customers },
    { label: "Income records", value: scope.incomeRecords },
    { label: "Expense records", value: scope.expenseRecords },
    { label: "Admin notifications", value: scope.adminNotifications },
    ...(typeof scope.submissionAttemptLogs === "number"
      ? [{ label: "Submission attempt logs", value: scope.submissionAttemptLogs }]
      : []),
  ];
}

function createEmptyScope(includeSubmissionLogs: boolean): AdminOperationalDataWipeScope {
  return {
    bookings: 0,
    customers: 0,
    incomeRecords: 0,
    expenseRecords: 0,
    adminNotifications: 0,
    ...(includeSubmissionLogs ? { submissionAttemptLogs: 0 } : {}),
  };
}

function getDangerZoneErrorMessage(error: BackendApiError) {
  if (error.code === "operational_data_wipe_confirmation_invalid") {
    return `Type ${OPERATIONAL_DATA_WIPE_CONFIRMATION_PHRASE} exactly before executing the wipe.`;
  }

  if (error.code === "super_admin_required" || error.code === "forbidden_admin") {
    return "Only Super Admin can use this action.";
  }

  return error.message || "Unable to complete the operational data wipe request.";
}

export function AdminOperationalDataDangerZone({
  initialPreview,
}: AdminOperationalDataDangerZoneProps) {
  const [includeSubmissionLogs, setIncludeSubmissionLogs] = useState(
    initialPreview.scope.submissionAttemptLogs != null,
  );
  const [preview, setPreview] = useState(initialPreview);
  const [executeResult, setExecuteResult] = useState<AdminOperationalDataWipeResponse | null>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewPending, startPreviewTransition] = useTransition();
  const [isExecutePending, startExecuteTransition] = useTransition();

  const canExecute = confirmationText.trim() === OPERATIONAL_DATA_WIPE_CONFIRMATION_PHRASE;
  const scopeRows = useMemo(() => getScopeRows(preview.scope), [preview.scope]);
  const deletedRows = useMemo(
    () => (executeResult?.deleted ? getScopeRows(executeResult.deleted) : []),
    [executeResult],
  );

  function runPreview(nextIncludeSubmissionLogs: boolean) {
    startPreviewTransition(() => {
      void (async () => {
        try {
          const result = await postAdminOperationalDataWipeBrowser({
            confirmationText: "",
            dryRun: true,
            includeSubmissionLogs: nextIncludeSubmissionLogs,
          });

          setPreview(result);
          setPreviewError(null);
        } catch (error) {
          const message = error instanceof BackendApiError
            ? getDangerZoneErrorMessage(error)
            : "Unable to preview the operational data scope right now.";
          setPreviewError(message);
        }
      })();
    });
  }

  function handleExecute() {
    startExecuteTransition(() => {
      void (async () => {
        try {
          const result = await postAdminOperationalDataWipeBrowser({
            confirmationText,
            dryRun: false,
            includeSubmissionLogs,
          });

          setExecuteResult(result);
          setPreview({
            success: true,
            dryRun: true,
            scope: createEmptyScope(includeSubmissionLogs),
            message: "Dry run completed. No operational data was deleted.",
          });
          setPreviewError(null);
          setExecuteError(null);
          setIsDialogOpen(false);
          setConfirmationText("");
          pushAppToast({
            title: "Operational data wiped",
            description: "Operational records were removed. Core configuration, admin access, and company profile data were preserved.",
          });
        } catch (error) {
          const message = error instanceof BackendApiError
            ? getDangerZoneErrorMessage(error)
            : "Unable to execute the operational data wipe.";
          setExecuteError(message);
          pushAppToast({
            title: "Wipe failed",
            description: message,
          });
        }
      })();
    });
  }

  return (
    <section className="space-y-4">
      <section className="rounded-[1.5rem] border border-destructive/25 bg-[linear-gradient(180deg,rgba(255,248,247,0.96)_0%,rgba(255,255,255,0.98)_100%)] p-5 shadow-[0_18px_38px_-34px_rgba(185,28,28,0.4)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full border border-destructive/20 bg-destructive/10 p-2 text-destructive">
            <AlertTriangle className="size-4" />
          </div>
          <div className="space-y-1.5">
            <p className="admin-section-title text-destructive">Danger Zone</p>
            <p className="text-[13px] leading-5 text-muted-foreground">
              Wipe all operational data while preserving core configuration, admin access, squads, service types,
              company profile settings, and company-profile logo uploads.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <section className="panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="admin-card-title">Wipe scope</p>
              <p className="admin-form-helper mt-1">
                This action clears operational records only. It does not reset the app into a factory-default state.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full px-3"
              disabled={isPreviewPending}
              onClick={() => runPreview(includeSubmissionLogs)}
            >
              <RefreshCcw className="mr-1.5 size-3.5" />
              Refresh preview
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <section className="rounded-[1.2rem] border border-border/70 bg-white/88 p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-destructive">Will delete</p>
              <ul className="mt-3 space-y-2 text-[13px] leading-5 text-foreground/88">
                {deletableEntities.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[0.35rem] size-1.5 rounded-full bg-destructive/70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[1.2rem] border border-emerald-200/70 bg-emerald-50/65 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-700" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Will preserve</p>
              </div>
              <ul className="mt-3 space-y-2 text-[13px] leading-5 text-foreground/88">
                {preservedEntities.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[0.35rem] size-1.5 rounded-full bg-emerald-600/75" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-4 rounded-[1.2rem] border border-border/70 bg-muted/15 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={includeSubmissionLogs}
                onChange={(event) => {
                  const nextValue = event.target.checked;
                  setIncludeSubmissionLogs(nextValue);
                  runPreview(nextValue);
                }}
                className="mt-1 size-4 rounded border-border text-destructive focus:ring-destructive/30"
              />
              <span>
                <span className="block text-[13px] font-medium text-foreground">
                  Include submission attempt logs
                </span>
                <span className="mt-1 block text-[12px] leading-5 text-muted-foreground">
                  Optional anti-abuse booking submission telemetry from `SubmissionAttemptLog`.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-4 rounded-[1.2rem] border border-border/70 bg-white/92 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Dry-run preview</p>
                <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                  Counts are pulled from the live database without deleting anything.
                </p>
              </div>
              {isPreviewPending ? <span className="admin-form-helper">Refreshing...</span> : null}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {scopeRows.map((item) => (
                <div key={item.label} className="rounded-[1rem] border border-border/60 bg-background px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-[1.3rem] font-semibold leading-none tracking-[-0.04em] text-foreground">
                    {formatCount(item.value)}
                  </p>
                </div>
              ))}
            </div>

            {previewError ? (
              <p className="mt-3 text-[12px] text-destructive">{previewError}</p>
            ) : (
              <p className="mt-3 text-[12px] text-muted-foreground">
                {preview.message} Preview counts can change if another admin is actively creating or updating records.
              </p>
            )}
          </div>
        </section>

        <section className="panel p-5">
          <p className="admin-card-title">Execution guardrails</p>
          <p className="admin-form-helper mt-1">
            Execution requires the exact confirmation phrase and a final modal confirmation.
          </p>

          <div className="mt-4 rounded-[1.2rem] border border-border/70 bg-muted/15 p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Confirmation phrase
            </p>
            <p className="mt-2 rounded-[0.9rem] border border-border/70 bg-background px-3 py-2 font-mono text-[13px] font-semibold text-foreground">
              {OPERATIONAL_DATA_WIPE_CONFIRMATION_PHRASE}
            </p>

            <label className="mt-4 block space-y-1.5">
              <span className="admin-form-label">Type the phrase to unlock execution</span>
              <input
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                placeholder={OPERATIONAL_DATA_WIPE_CONFIRMATION_PHRASE}
                className="w-full rounded-[1rem] border border-border/70 bg-white px-3.5 py-2.5 text-[13px] text-foreground outline-none transition focus:border-destructive/35 focus:ring-2 focus:ring-destructive/10"
              />
            </label>

            {executeError ? <p className="mt-3 text-[12px] text-destructive">{executeError}</p> : null}
          </div>

          <div className="mt-4 rounded-[1.2rem] border border-destructive/20 bg-destructive/[0.05] p-4">
            <p className="text-[13px] font-semibold text-foreground">Final execution</p>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
              This permanently removes operational rows and cannot be undone from the UI.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="destructive"
                className="rounded-full px-4"
                disabled={!canExecute || isExecutePending || Boolean(previewError)}
                onClick={() => setIsDialogOpen(true)}
              >
                <Trash2 className="mr-1.5 size-4" />
                Execute wipe
              </Button>
              <span className="text-[12px] text-muted-foreground">
                {canExecute
                  ? "Confirmation phrase accepted."
                  : "Execution stays locked until the phrase matches exactly."}
              </span>
            </div>
          </div>

          {executeResult?.deleted ? (
            <section className="mt-4 rounded-[1.2rem] border border-emerald-200/70 bg-emerald-50/70 p-4">
              <p className="text-[13px] font-semibold text-emerald-800">Last execution result</p>
              <p className="mt-1 text-[12px] leading-5 text-emerald-900/75">{executeResult.message}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {deletedRows.map((item) => (
                  <div key={item.label} className="rounded-[1rem] border border-emerald-200/80 bg-white/80 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-emerald-700">{item.label}</p>
                    <p className="mt-1 text-[1.2rem] font-semibold leading-none tracking-[-0.04em] text-foreground">
                      {formatCount(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </section>

      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[70] bg-slate-950/28 transition data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-[80] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem] border border-border/80 bg-white p-5 shadow-[0_22px_42px_-28px_rgba(15,23,42,0.28)] outline-none transition data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Dialog.Title className="text-[1rem] font-semibold leading-5 text-foreground">
              Wipe operational data?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-[13px] leading-5 text-muted-foreground">
              This will permanently remove bookings, customers, finance records, and admin notifications while keeping
              core configuration and admin access intact.
            </Dialog.Description>

            <div className="mt-4 rounded-[1rem] border border-border/70 bg-muted/15 p-3">
              <p className="text-[12px] font-semibold text-foreground">Current preview</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {scopeRows.map((item) => (
                  <div key={item.label} className="rounded-[0.9rem] border border-border/60 bg-background px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-[1rem] font-semibold leading-none text-foreground">{formatCount(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full px-3"
                    disabled={isExecutePending}
                  />
                }
              >
                Cancel
              </Dialog.Close>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-full px-3"
                disabled={!canExecute || isExecutePending}
                onClick={handleExecute}
              >
                {isExecutePending ? "Executing..." : "Confirm wipe"}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
