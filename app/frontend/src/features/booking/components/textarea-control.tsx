import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type TextareaControlProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextareaControl = forwardRef<
  HTMLTextAreaElement,
  TextareaControlProps
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-[1.1rem] bg-white/78 px-4 py-3.5 text-[15px] text-foreground shadow-[0_6px_18px_-16px_rgba(43,72,127,0.3)] ring-1 ring-black/6 transition outline-none placeholder:text-muted-foreground/80 focus:bg-white focus:ring-2 focus:ring-primary/18",
        className,
      )}
      {...props}
    />
  );
});

TextareaControl.displayName = "TextareaControl";
