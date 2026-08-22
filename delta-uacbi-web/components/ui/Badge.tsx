import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

export type BadgeVariant = "neutral" | "avisos" | "proyectos" | "concursos" | "bolsa" | "tickets";
export type BadgeSize = "sm" | "md";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-white/10 text-muted-foreground",
  avisos: "border-avisos/30 text-avisos bg-avisos/10",
  proyectos: "border-proyectos/30 text-proyectos bg-proyectos/10",
  concursos: "border-concursos/30 text-concursos bg-concursos/10",
  bolsa: "border-bolsa/30 text-bolsa bg-bolsa/10",
  tickets: "border-tickets/30 text-tickets bg-tickets/10",
};

const dotClasses: Record<BadgeVariant, string> = {
  neutral: "bg-muted-foreground",
  avisos: "bg-avisos",
  proyectos: "bg-proyectos",
  concursos: "bg-concursos",
  bolsa: "bg-bolsa",
  tickets: "bg-tickets",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-1 text-[11px]",
  md: "px-3 py-1 text-xs",
};

type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children">;

export function Badge({ variant = "neutral", size = "md", dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {dot ? <span className={cx("h-1.5 w-1.5 rounded-full", dotClasses[variant])} /> : null}
      {children}
    </span>
  );
}
