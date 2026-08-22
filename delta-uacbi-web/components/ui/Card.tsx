import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

export type CardVariant = "surface" | "item";

const variantClasses: Record<CardVariant, string> = {
  surface: "card-next rounded-3xl p-6",
  item: "rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10",
};

type CardProps = {
  variant?: CardVariant;
  interactive?: boolean;
  href?: string;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">;

export function Card({ variant = "surface", interactive = false, href, className, children, ...rest }: CardProps) {
  const classes = cx(
    variantClasses[variant],
    (interactive || href) && "cursor-pointer transition hover:-translate-y-0.5",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
