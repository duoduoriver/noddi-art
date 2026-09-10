import { m } from '@/locale/paraglide/messages';
import { getFooterLinks } from '@/config/footer-config';
import { getSocialLinks } from '@/config/social-config';
import { isLinkActive } from '@/lib/urls';
import { cn } from '@/lib/utils';
import Container from '@/components/layout/container';
import { Link, useLocation } from '@tanstack/react-router';
import { websiteConfig } from '@/config/website';
export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  const pathname = useLocation().pathname;
  const footerLinks = getFooterLinks();
  const socialLinks = getSocialLinks();
  return (
    <footer
      className={cn(
        'footer-background relative overflow-hidden bg-black text-white',
        className
      )}
    >
      <picture className="absolute inset-0 block h-full w-full">
        <source srcSet="/home/footer.avif" type="image/avif" />
        <img
          src="/home/footer.webp"
          alt=""
          className="h-full w-full object-cover"
        />
      </picture>
      <Container className="relative z-10 px-4 lg:translate-x-6">
        <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-6">
          <div className="col-span-full flex flex-col items-start md:col-span-2">
            <div className="flex items-center space-x-2">
              <img
                src="/logo-dark.png"
                alt={`${websiteConfig.metadata?.name ?? 'Sunburst AI'} logo`}
                className="size-8 rounded-md"
                width={32}
                height={32}
                decoding="async"
              />
              <span className="text-xl font-semibold">
                {websiteConfig.metadata?.name}
              </span>
            </div>
            <p className="py-2 text-base text-white md:pr-12">
              {m.footer_tagline()}
            </p>
            {socialLinks.length > 0 ? (
              <nav
                aria-label={m.common_social_links()}
                className="flex items-center gap-4 pt-6"
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
                      className="inline-flex size-8 items-center justify-center rounded-full border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
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
              <span className="font-hand text-xl text-white">
                {section.title}
              </span>
              <ul className="mt-4 list-inside space-y-3">
                {section.items?.map(
                  (item) =>
                    item.href && (
                      <li key={item.title}>
                        {item.external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary focus-visible:text-primary data-[active=true]:font-semibold data-[active=true]:text-primary"
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
                            className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary focus-visible:text-primary data-[active=true]:font-semibold data-[active=true]:text-primary"
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

      <div className="relative z-10 py-8">
        <Container className="flex justify-center px-4 text-center">
          <span className="text-sm text-white">
            &copy; {new Date().getFullYear()} {websiteConfig.metadata?.name}.{' '}
            {m.footer_rights_reserved()}
          </span>
        </Container>
      </div>
    </footer>
  );
}
