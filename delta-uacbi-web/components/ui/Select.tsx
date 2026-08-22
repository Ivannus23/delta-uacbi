import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "./utils";

export type SelectProps = {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, wrapperClassName, className, id, children, ...props },
  ref
) {
  const selectId = id ?? props.name;

  return (
    <div className={cx("grid gap-2", wrapperClassName)}>
      {label ? (
        <label htmlFor={selectId} className="block text-sm text-muted-foreground">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cx(
            "w-full appearance-none rounded-2xl border bg-white/5 px-4 py-3 pr-10 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 disabled:opacity-50",
            error ? "border-rose-400/60" : "border-white/10",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {error ? (
        <p className="text-xs text-rose-300">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});
