import { Logo } from '@/components/shared/logo';
import { SidebarMain } from '@/components/layout/sidebar-main';
import { SidebarUser } from '@/components/layout/sidebar-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { websiteConfig } from '@/config/website';
import { Link } from '@tanstack/react-router';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconHelp, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { Routes } from '@/lib/routes';
import { m } from '@/locale/paraglide/messages';
import type { SessionUser } from '@/auth/types';
import type * as React from 'react';

type DashboardSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: SessionUser;
};

export function DashboardSidebar({ user, ...props }: DashboardSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [helpOpen, setHelpOpen] = useState(false);
  const supportEmail = websiteConfig.mail?.supportEmail;
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link to={Routes.Root} onClick={closeMobileSidebar}>
                  <Logo className="size-5" />
                  <span className="truncate font-semibold text-base">
                    {websiteConfig.metadata?.name}
                  </span>
                </Link>
              }
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link to={Routes.Generate} onClick={closeMobileSidebar}>
                  <IconPlus />
                  <span>{m.noddi_sidebar_create()}</span>
                </Link>
              }
              tooltip={m.noddi_sidebar_create()}
              className="rounded-full bg-black text-white hover:bg-black/90 hover:text-white"
            />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMain user={user} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={m.noddi_sidebar_help()}
              onClick={() => setHelpOpen(true)}
            >
              <IconHelp />
              <span>{m.noddi_sidebar_help()}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarUser user={user} />
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{m.noddi_sidebar_help()}</DialogTitle>
              <DialogDescription>
                {supportEmail
                  ? m.noddi_sidebar_help_description_with_email({
                      supportEmail,
                    })
                  : m.noddi_sidebar_help_description()}
              </DialogDescription>
            </DialogHeader>
            {supportEmail ? (
              <a
                className="break-all text-sm underline"
                href={`mailto:${supportEmail}`}
              >
                {supportEmail}
              </a>
            ) : null}
            <div className="flex gap-3 text-sm">
              <Link className="underline" to={Routes.TermsOfService}>
                {m.noddi_sidebar_terms()}
              </Link>
              <Link className="underline" to={Routes.PrivacyPolicy}>
                {m.noddi_sidebar_privacy()}
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarFooter>
    </Sidebar>
  );
}
