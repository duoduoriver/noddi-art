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
      <DialogContent className="max-h-[min(90dvh,680px)] overflow-y-auto rounded-[24px] border-2 border-[#111111] bg-white p-0 shadow-[4px_4px_0_#9b7bff] sm:max-w-[440px] [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:size-9 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:border [&_[data-slot=dialog-close]]:border-[#dedde3] [&_[data-slot=dialog-close]]:bg-[#f6f5f2]">
        <DialogHeader className="sr-only">
          <DialogTitle>{m.auth_login_sign_in()}</DialogTitle>
        </DialogHeader>
        <LoginForm
          callbackUrl={callbackUrl}
          onSuccess={onSuccess}
          className="border-0 shadow-none"
          compact
        />
      </DialogContent>
    </Dialog>
  );
}
