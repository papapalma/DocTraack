import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  if (params?.from) {
    redirect(`/?auth=login&from=${encodeURIComponent(params.from)}`);
  }
  redirect("/?auth=login");
}
