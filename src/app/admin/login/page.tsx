import { AdminLoginForm, type AdminLoginLabels } from "@/components/admin/admin-login-form";
import { getAdminContext } from "@/lib/admin/locale";
import { firstParam } from "@/lib/utils/params";

export const metadata = {
  title: "Sign in · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage(props: PageProps<"/admin/login">) {
  const searchParams = await props.searchParams;
  const { dict } = await getAdminContext();

  const labels: AdminLoginLabels = {
    title: dict.admin.login.title,
    subtitle: dict.admin.login.subtitle,
    email: dict.admin.login.email,
    password: dict.admin.login.password,
    submit: dict.admin.login.submit,
    submitting: dict.admin.login.submitting,
    invalid: dict.admin.login.invalid,
    rateLimited: dict.admin.login.rateLimited,
    notConfigured: dict.admin.login.notConfigured,
  };

  // Only ever redirect back into /admin — never to an attacker-supplied URL.
  const raw = firstParam(searchParams.next);
  const next = raw.startsWith("/admin") && !raw.startsWith("/admin/login") ? raw : "/admin";

  return (
    <main className="grid flex-1 place-items-center p-6">
      <AdminLoginForm labels={labels} next={next} />
    </main>
  );
}
