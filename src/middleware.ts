// v5 — usa el 'auth' que exportas desde src/lib/auth
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"], // protege /admin
};
