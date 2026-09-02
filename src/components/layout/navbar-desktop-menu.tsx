import { getNavbarLinks } from '@/config/navbar-config';
import { isLinkActive } from '@/lib/urls';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { IconArrowUpRight } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

interface NavbarDesktopMenuProps {
  pathname: string;
}

export function NavbarDesktopMenu({ pathname }: NavbarDesktopMenuProps) {
  const menuLinks = getNavbarLinks();
  const [menuValue, setMenuValue] = useState<string | null>(null);

  useEffect(() => {
    setMenuValue(null);
  }, [pathname]);

  return (
    <NavigationMenu
      value={menuValue}
      onValueChange={setMenuValue}
      className="flex-1 justify-center"
    >
      <NavigationMenuList aria-orientation={undefined}>
        {menuLinks?.map((item) =>
          item.items ? (
            <NavigationMenuItem key={item.title} value={item.title}>
              <NavigationMenuTrigger
                className={cn(
                  'bg-transparent',
                  item.items.some((sub) => isLinkActive(sub.href, pathname)) &&
                    'font-semibold text-foreground'
                )}
              >
                {item.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-100 gap-3 p-3 md:w-125 md:grid-cols-2 lg:w-150">
                  {item.items.map((sub) => (
                    <li key={sub.title}>
                      <NavigationMenuLink
                        closeOnClick
                        className={cn(
                          'group flex select-none flex-row items-center gap-4 rounded-md',
                          'p-2 leading-none no-underline outline-hidden transition-colors',
                          'hover:bg-accent hover:text-accent-foreground',
                          'focus:bg-accent focus:text-accent-foreground',
                          isLinkActive(sub.href, pathname) &&
                            'bg-accent text-accent-foreground'
                        )}
                        render={
                          <Link
                            to={sub.href ?? '#'}
                            target={sub.external ? '_blank' : undefined}
                            rel={
                              sub.external ? 'noopener noreferrer' : undefined
                            }
                          />
                        }
                      >
                        {sub.icon ? (
                          <sub.icon className="size-4 shrink-0" />
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{sub.title}</div>
                          {sub.description ? (
                            <p className="text-xs text-muted-foreground">
                              {sub.description}
                            </p>
                          ) : null}
                        </div>
                        {sub.external ? (
                          <IconArrowUpRight className="size-4 shrink-0" />
                        ) : null}
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.title}>
              <NavigationMenuLink
                render={<Link to={item.href ?? '#'} />}
                className={cn(
                  navigationMenuTriggerStyle(),
                  'bg-transparent',
                  isLinkActive(item.href, pathname) &&
                    'font-semibold text-primary'
                )}
              >
                {item.title}
              </NavigationMenuLink>
            </NavigationMenuItem>
          )
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
