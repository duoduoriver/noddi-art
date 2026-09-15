import { getAuthErrorMessage } from '@/lib/locale';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { m } from '@/locale/paraglide/messages';
import { Link } from '@tanstack/react-router';
import { AuthCard } from '@/components/auth/auth-card';
import { FormError } from '@/components/shared/form-error';
import { FormSuccess } from '@/components/shared/form-success';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { websiteConfig } from '@/config/website';
import { authClient } from '@/auth/client';
import { emitAuthSessionChanged } from '@/auth/session-events';
import { cn } from '@/lib/utils';
import { publicEnv } from '@/env/public';
import { DEFAULT_LOGIN_REDIRECT, Routes } from '@/lib/routes';
import { getPathWithLocale } from '@/lib/urls';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { SocialLoginButton } from './social-login-button';
interface LoginFormProps {
  className?: string;
  callbackUrl?: string;
  onSuccess?: () => void;
  compact?: boolean;
}
const isLocalE2EMode =
  import.meta.env.DEV === true && import.meta.env.MODE === 'e2e';

export function LoginForm({
  className,
  callbackUrl: propCallbackUrl,
  onSuccess,
  compact = false,
}: LoginFormProps) {
  const paramCallbackUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('callbackUrl')
      : null;
  const defaultCallbackUrl = getPathWithLocale(DEFAULT_LOGIN_REDIRECT);
  const callbackUrl =
    propCallbackUrl ??
    (paramCallbackUrl ? paramCallbackUrl : defaultCallbackUrl);
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(
    isLocalE2EMode ? 'e2e-bypass' : undefined
  );
  const turnstileRef = useRef<TurnstileInstance>(null);
  const turnstileSiteKey = publicEnv.VITE_TURNSTILE_SITE_KEY;
  const credentialLoginEnabled =
    websiteConfig.auth?.enableCredentialLogin ?? false;
  const LoginSchema = z.object({
    email: z.email({ message: m.auth_login_email_required() }),
    password: z.string().min(1, { message: m.auth_login_password_required() }),
  });
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });
  const pendingLoginRef = useRef<z.infer<typeof LoginSchema> | null>(null);
  const urlError =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('error')
      : null;

  const resetTurnstileSoon = () => {
    if (isLocalE2EMode) return;
    window.setTimeout(() => turnstileRef.current?.reset(), 0);
  };
  const signInWithToken = async (
    values: z.infer<typeof LoginSchema>,
    token: string
  ) => {
    try {
      await authClient.signIn.email(
        {
          email: values.email,
          password: values.password,
          callbackURL: callbackUrl,
        },
        {
          headers: { 'x-captcha-response': token },
          onRequest: () => {
            setIsPending(true);
            setError('');
            setSuccess('');
          },
          onSuccess: () => {
            pendingLoginRef.current = null;
            setIsPending(false);
            emitAuthSessionChanged({ authenticated: true });
            onSuccess?.();
          },
          onError: (ctx) => {
            pendingLoginRef.current = null;
            setIsPending(false);
            setTurnstileToken(undefined);
            setError(getAuthErrorMessage(ctx.error));
            resetTurnstileSoon();
          },
        }
      );
    } catch (caught) {
      pendingLoginRef.current = null;
      setIsPending(false);
      setTurnstileToken(undefined);
      setError(
        getAuthErrorMessage({
          message:
            caught instanceof Error
              ? caught.message
              : 'Sign in failed. Please try again.',
        })
      );
      resetTurnstileSoon();
    }
  };

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    const token = turnstileToken ?? turnstileRef.current?.getResponse();
    if (token) {
      await signInWithToken(values, token);
      return;
    }

    if (!turnstileSiteKey) {
      setError('Bot verification is not configured.');
      return;
    }

    const turnstile = turnstileRef.current;
    if (!turnstile) {
      setError('Security verification is still loading. Please try again.');
      return;
    }

    pendingLoginRef.current = values;
    setError('');
    setSuccess('');
    setIsPending(true);

    try {
      turnstile.execute();
    } catch {
      pendingLoginRef.current = null;
      setIsPending(false);
      setError('Could not start security verification. Please try again.');
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  return (
    <AuthCard
      headerLabel={m.auth_login_welcome_back()}
      description={m.auth_login_description()}
      bottomButtonLabel={m.auth_login_sign_up_hint()}
      bottomButtonHref={Routes.Register}
      className={cn('', className)}
      compact={compact}
    >
      {credentialLoginEnabled && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={cn('space-y-6', compact && 'space-y-4')}
          >
            <div className={cn('space-y-4', compact && 'space-y-3.5')}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className={cn(compact && 'gap-1.5')}>
                    <FormLabel
                      className={cn(compact && 'text-sm font-semibold')}
                    >
                      {m.auth_login_email()}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder={m.auth_login_placeholder_email()}
                        type="email"
                        className={cn(
                          compact && 'h-11 rounded-xl px-3.5 text-sm'
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className={cn(compact && 'gap-1.5')}>
                    <div className="flex justify-between items-center">
                      <FormLabel
                        className={cn(compact && 'text-sm font-semibold')}
                      >
                        {m.auth_login_password()}
                      </FormLabel>
                      <Link
                        to={Routes.ForgotPassword}
                        className={cn(
                          'font-normal text-muted-foreground hover:text-primary hover:underline hover:underline-offset-4',
                          compact ? 'text-sm' : 'text-xs'
                        )}
                      >
                        {m.auth_login_forgot_password()}
                      </Link>
                    </div>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder={m.auth_login_placeholder_password()}
                          type={showPassword ? 'text' : 'password'}
                          className={cn(
                            'pr-10',
                            compact && 'h-11 rounded-xl px-3.5 pr-11 text-sm'
                          )}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'absolute right-0 top-0 h-full border-0 bg-transparent px-3 hover:bg-transparent hover:opacity-70 dark:hover:bg-transparent',
                          compact && 'right-1 px-2.5'
                        )}
                        onClick={togglePasswordVisibility}
                        disabled={isPending}
                      >
                        {showPassword ? (
                          <IconEyeOff className="size-4 text-muted-foreground" />
                        ) : (
                          <IconEye className="size-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showPassword
                            ? m.auth_login_hide_password()
                            : m.auth_login_show_password()}
                        </span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {isLocalE2EMode ? null : turnstileSiteKey ? (
              <div className={cn(compact && 'overflow-hidden rounded-xl')}>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    const pendingLogin = pendingLoginRef.current;
                    if (pendingLogin) {
                      void signInWithToken(pendingLogin, token);
                    }
                  }}
                  onExpire={() => setTurnstileToken(undefined)}
                  onError={() => {
                    pendingLoginRef.current = null;
                    setIsPending(false);
                    setTurnstileToken(undefined);
                    setError('Bot verification failed. Please try again.');
                  }}
                  onTimeout={() => {
                    pendingLoginRef.current = null;
                    setIsPending(false);
                    setTurnstileToken(undefined);
                    turnstileRef.current?.reset();
                    setError(
                      'Security verification timed out. Please try again.'
                    );
                  }}
                  onUnsupported={() => {
                    pendingLoginRef.current = null;
                    setIsPending(false);
                    setTurnstileToken(undefined);
                    setError(
                      'This browser cannot complete security verification.'
                    );
                  }}
                  options={{
                    action: 'login',
                    size: 'flexible',
                    appearance: 'interaction-only',
                    execution: 'execute',
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-red-600">
                Bot verification is not configured.
              </p>
            )}
            <FormError message={error || urlError || undefined} />
            <FormSuccess message={success} />
            <Button
              disabled={isPending}
              size={compact ? 'default' : 'lg'}
              type="submit"
              className={cn(
                'flex w-full items-center justify-center gap-2',
                compact && 'h-11 rounded-xl'
              )}
            >
              {isPending && <IconLoader2 className="size-4 animate-spin" />}
              <span>{m.auth_login_sign_in()}</span>
            </Button>
          </form>
        </Form>
      )}
      <div className={compact ? 'mt-3' : 'mt-4'}>
        <SocialLoginButton
          callbackUrl={callbackUrl}
          showDivider={credentialLoginEnabled}
          compact={compact}
        />
      </div>
    </AuthCard>
  );
}
