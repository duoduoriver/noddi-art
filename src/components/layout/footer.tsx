import { m } from '@/locale/paraglide/messages';
import { getFooterLinks } from '@/config/footer-config';
import { getSocialLinks } from '@/config/social-config';
import { isLinkActive } from '@/lib/urls';
import { cn } from '@/lib/utils';
import Container from '@/components/layout/container';
import { Link, useLocation } from '@tanstack/react-router';
import { websiteConfig } from '@/config/website';
import { Logo } from '@/components/shared/logo';
export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  const pathname = useLocation().pathname;
  const footerLinks = getFooterLinks();
  const socialLinks = getSocialLinks();
  return (
    <footer
      className={cn(
        'border-t border-[#e6e5e9] bg-white text-[#111111]',
        className
      )}
    >
      <Container className="px-5 lg:px-10">
        <div className="grid grid-cols-2 gap-8 py-14 md:grid-cols-6 md:py-16">
          <div className="col-span-full flex flex-col items-start md:col-span-2">
            <div className="flex items-center space-x-2">
              <Logo className="size-8" />
              <span className="text-lg font-extrabold tracking-[-0.02em]">
                {websiteConfig.metadata?.name}
              </span>
            </div>
            <p className="max-w-xs py-3 text-sm leading-6 text-[#666] md:pr-8">
              {m.footer_tagline()}
            </p>
            {socialLinks.length > 0 ? (
              <nav
                aria-label={m.common_social_links()}
                className="flex items-center gap-2 pt-4"
              >
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.title}
                      href={link.href ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.title}
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-[#d8d7dd] bg-[#fbfbf8] transition-all duration-200 hover:-translate-y-0.5 hover:border-black hover:bg-[#f1ebff]"
                    >
                      {Icon ? <Icon className="size-4" /> : null}
                    </a>
                  );
                })}
              </nav>
            ) : null}
          </div>

          {footerLinks?.map((section) => (
            <div
              key={section.title}
              className="col-span-1 md:col-span-1 flex flex-col items-start"
            >
              <span className="text-sm font-extrabold uppercase tracking-[0.08em] text-[#111111]">
                {section.title}
              </span>
              <ul className="mt-4 list-inside space-y-2.5">
                {section.items?.map(
                  (item) =>
                    item.href && (
                      <li key={item.title}>
                        {item.external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#666] transition-colors duration-150 hover:text-[#6548d8] focus-visible:text-[#6548d8] data-[active=true]:font-bold data-[active=true]:text-[#111111]"
                          >
                            {item.title}
                          </a>
                        ) : (
                          <Link
                            to={item.href}
                            data-active={
                              item.href.includes('#')
                                ? undefined
                                : isLinkActive(item.href, pathname)
                                  ? 'true'
                                  : undefined
                            }
                            className="text-sm text-[#666] transition-colors duration-150 hover:text-[#6548d8] focus-visible:text-[#6548d8] data-[active=true]:font-bold data-[active=true]:text-[#111111]"
                          >
                            {item.title}
                          </Link>
                        )}
                      </li>
                    )
                )}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="border-t border-[#ecebf0] py-6">
        <Container className="flex flex-col gap-2 px-5 text-center text-xs text-[#777] sm:flex-row sm:items-center sm:justify-between sm:text-left lg:px-10">
          <span>
            &copy; {new Date().getFullYear()} {websiteConfig.metadata?.name}.{' '}
            {m.footer_rights_reserved()}
          </span>
          <span>AI app icons for builders.</span>
        </Container>
      </div>
    </footer>
  );
}
