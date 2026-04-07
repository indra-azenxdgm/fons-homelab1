import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: FormFieldProps) {
  return (
    <div className="block space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-normal leading-5 text-foreground/92"
        >
          {label}
          {required ? (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {hint ? (
          <span className="text-[11px] leading-4 text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
      <p
        className={cn(
          "min-h-5 text-[11px] leading-4",
          error ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {error || "\u00A0"}
      </p>
    </div>
  );
}
