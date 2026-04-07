import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type InputControlProps = React.InputHTMLAttributes<HTMLInputElement>;

export const InputControl = forwardRef<HTMLInputElement, InputControlProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-[1.1rem] border border-border bg-input px-4 text-[15px] text-foreground shadow-none transition outline-none placeholder:text-muted-foreground/80 focus:border-[color:var(--border-strong)] focus:bg-white focus:ring-3 focus:ring-primary/12",
          className,
        )}
        {...props}
      />
    );
  },
);

InputControl.displayName = "InputControl";
