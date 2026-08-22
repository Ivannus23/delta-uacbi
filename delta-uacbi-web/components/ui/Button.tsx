import Link from "next/link";
import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Loader2 } from "lucide-react";
import { cx } from "./utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border border-primary bg-primary text-primary-foreground hover:brightness-110",
  secondary: "border border-white/10 bg-white/5 text-foreground hover:bg-white/10",
  outline: "border border-white/15 bg-transparent text-foreground hover:bg-white/5",
  ghost: "border border-transparent text-muted-foreground hover:bg-white/10 hover:text-foreground",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-sm",
  icon: "h-9 w-9 p-0",
};

type BaseButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  sheen?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type NativeButtonProps = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> & {
    href?: undefined;
  };

type NativeAnchorProps = BaseButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps> & {
    href: string;
  };

export type ButtonProps = NativeButtonProps | NativeAnchorProps;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "secondary",
      size = "md",
      loading = false,
      sheen = true,
      iconLeft,
      iconRight,
      className,
      children,
      ...rest
    } = props;

    const classes = cx(baseClasses, variantClasses[variant], sizeClasses[size], sheen && "btn-sheen", className);

    if (typeof rest.href === "string") {
      const { href, ...anchorRest } = rest as NativeAnchorProps;
      return (
        <Link href={href} ref={ref as Ref<HTMLAnchorElement>} className={classes} {...anchorRest}>
          {iconLeft}
          {children}
          {iconRight}
        </Link>
      );
    }

    const { disabled, ...buttonRest } = rest as NativeButtonProps;
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        className={classes}
        disabled={disabled || loading}
        {...buttonRest}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : iconLeft}
        {children}
        {!loading ? iconRight : null}
      </button>
    );
  }
);
