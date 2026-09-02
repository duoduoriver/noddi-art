import { LoginForm } from '@/components/auth/login-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { m } from '@/locale/paraglide/messages';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl?: string;
  onSuccess?: () => void;
}

export function LoginDialog({
  open,
  onOpenChange,
  callbackUrl,
  onSuccess,
}: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100 p-0 border-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{m.auth_login_sign_in()}</DialogTitle>
        </DialogHeader>
        <LoginForm
          callbackUrl={callbackUrl}
          onSuccess={onSuccess}
          className="border-0 shadow-none"
        />
      </DialogContent>
    </Dialog>
  );
}
