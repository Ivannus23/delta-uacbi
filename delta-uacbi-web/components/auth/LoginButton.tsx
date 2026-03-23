"use client";

import { signIn } from "next-auth/react";

type LoginButtonProps = {
  callbackUrl: string;
  className?: string;
};

export function LoginButton({ callbackUrl, className }: LoginButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
      className={className}
    >
      Entrar con Google
    </button>
  );
}
