import { m } from '@/locale/paraglide/messages';
import { useState } from 'react';
import { DividerWithText } from '@/components/auth/divider-with-text';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { authClient } from '@/auth/client';
import { DEFAULT_LOGIN_REDIRECT, Routes } from '@/lib/routes';
import { getPathWithLocale } from '@/lib/urls';
import {
  IconBrandGithubFilled,
  IconBrandGoogleFilled,
  IconLoader2,
} from '@tabler/icons-react';
interface SocialLoginButtonProps {
  callbackUrl?: string;
  showDivider?: boolean;
  compact?: boolean;
}
export function SocialLoginButton({
  callbackUrl: propCallbackUrl,
  showDivider = true,
  compact = false,
}: SocialLoginButtonProps) {
  const paramCallbackUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('callbackUrl')
      : null;
  const defaultCallbackUrl = getPathWithLocale(DEFAULT_LOGIN_REDIRECT);
  const callbackUrl =
    propCallbackUrl ??
    (paramCallbackUrl ? paramCallbackUrl : defaultCallbackUrl);
  const [isLoading, setIsLoading] = useState<'google' | 'github' | null>(null);
  const googleEnabled = websiteConfig.auth?.enableGoogleLogin;
  const githubEnabled = websiteConfig.auth?.enableGitHubLogin;
  if (!googleEnabled && !githubEnabled) return null;

  const onClick = async (provider: 'google' | 'github') => {
    await authClient.signIn.social(
      {
        provider,
        callbackURL: callbackUrl,
        errorCallbackURL: getPathWithLocale(Routes.AuthError),
      },
      {
        onRequest: () => setIsLoading(provider),
        onResponse: () => setIsLoading(null),
        onSuccess: () => setIsLoading(null),
        onError: () => setIsLoading(null),
      }
    );
  };
  return (
    <div
      className={
        compact ? 'flex w-full flex-col gap-3' : 'flex w-full flex-col gap-4'
      }
    >
      {showDivider && <DividerWithText text={m.auth_social_or()} />}
      {googleEnabled ? (
        <Button
          size={compact ? 'default' : 'lg'}
          className={compact ? 'h-11 w-full rounded-xl' : 'w-full'}
          variant="outline"
          onClick={() => onClick('google')}
          disabled={isLoading === 'google'}
        >
          {isLoading === 'google' ? (
            <IconLoader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <IconBrandGoogleFilled className="mr-2 size-4" />
          )}
          <span>{m.auth_social_sign_in_with_google()}</span>
        </Button>
      ) : null}
      {githubEnabled ? (
        <Button
          size={compact ? 'default' : 'lg'}
          className={compact ? 'h-11 w-full rounded-xl' : 'w-full'}
          variant="outline"
          onClick={() => onClick('github')}
          disabled={isLoading === 'github'}
        >
          {isLoading === 'github' ? (
            <IconLoader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <IconBrandGithubFilled className="mr-2 size-4" />
          )}
          <span>Continue with GitHub</span>
        </Button>
      ) : null}
    </div>
  );
}
