import { redirect } from "next/navigation";

export default async function AdminSemanaPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  redirect(`/semana-cultural/${orgSlug}/admin/dashboard`);
}
