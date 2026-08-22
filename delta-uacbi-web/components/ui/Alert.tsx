import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cx } from "./utils";

export type AlertVariant = "success" | "error" | "warning" | "info";

const variantClasses: Record<AlertVariant, string> = {
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  error: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  info: "border-sky-400/25 bg-sky-400/10 text-sky-300",
};

const variantIcons: Record<AlertVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">;

export function Alert({ variant = "info", title, icon, className, children, ...rest }: AlertProps) {
  const Icon = variantIcons[variant];

  return (
    <div
      className={cx(
        "flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm",
        variantClasses[variant],
        className
      )}
      {...rest}
    >
      <span className="mt-0.5 shrink-0">{icon ?? <Icon className="h-4 w-4" />}</span>
      <div>
        {title ? <p className="font-medium">{title}</p> : null}
        <div className={title ? "mt-0.5 text-sm/relaxed opacity-90" : undefined}>{children}</div>
      </div>
    </div>
  );
}
