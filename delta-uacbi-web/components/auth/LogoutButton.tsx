"use client";

import { signOut } from "next-auth/react";

type LogoutButtonProps = {
  callbackUrl?: string;
  className?: string;
};

export function LogoutButton({
  callbackUrl = "/",
  className,
}: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl })}
      className={className}
    >
      Cerrar sesion
    </button>
  );
}
