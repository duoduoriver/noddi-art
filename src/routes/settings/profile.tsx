import { m } from '@/locale/paraglide/messages';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { UpdateAvatarCard } from '@/components/settings/profile/update-avatar-card';
import { UpdateNameCard } from '@/components/settings/profile/update-name-card';
import { createFileRoute, Link } from '@tanstack/react-router';
import { PasswordCardWrapper } from '@/components/settings/security/password-card-wrapper';
import { DeleteAccountCard } from '@/components/settings/security/delete-account-card';
import { authClient } from '@/auth/client';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';

export const Route = createFileRoute('/settings/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: session } = authClient.useSession();
  const breadcrumbs = [
    { label: m.settings_profile_title(), isCurrentPage: true },
  ];
  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      title={m.settings_profile_title()}
      description={m.settings_profile_description()}
    >
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <UpdateNameCard />
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">
              {m.settings_profile_email_title()}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {session?.user?.email ?? m.settings_profile_email_missing()}
            </p>
            <p className="mt-1 text-sm">
              {session?.user?.emailVerified
                ? m.settings_profile_email_verified()
                : m.settings_profile_email_unverified()}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <UpdateAvatarCard />
        </div>
        {websiteConfig.auth?.enableCredentialLogin ? (
          <section>
            <h2 className="mb-3 font-hand text-2xl">
              {m.settings_profile_security_title()}
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <PasswordCardWrapper />
            </div>
          </section>
        ) : null}
        {websiteConfig.auth?.enableDeleteAccount ? (
          <section>
            <h2 className="mb-3 font-hand text-2xl">
              {m.settings_security_delete_account_title()}
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">
              {m.settings_profile_delete_account_notice()}{' '}
              <Link className="underline" to={Routes.DashboardCredits}>
                {m.settings_profile_delete_account_billing_link()}
              </Link>
            </p>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <DeleteAccountCard />
            </div>
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
