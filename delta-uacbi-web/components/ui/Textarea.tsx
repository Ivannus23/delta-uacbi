import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cx } from "./utils";

export type TextareaProps = {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, wrapperClassName, className, id, ...props },
  ref
) {
  const textareaId = id ?? props.name;

  return (
    <div className={cx("grid gap-2", wrapperClassName)}>
      {label ? (
        <label htmlFor={textareaId} className="block text-sm text-muted-foreground">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        className={cx(
          "w-full rounded-2xl border bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/30 disabled:opacity-50",
          error ? "border-rose-400/60" : "border-white/10",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-rose-300">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});
