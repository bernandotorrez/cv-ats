import { useRef, useCallback, useEffect } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { ShieldCheck } from "lucide-react";

interface HCaptchaWidgetProps {
  /** Called with the captcha token after successful verification */
  onVerify: (token: string) => void;
  /** Called when captcha is expired or reset */
  onExpire?: () => void;
  /** Disable the widget */
  disabled?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Reset captcha (pass a changing key to force reset) */
  resetKey?: number;
}

export function HCaptchaWidget({
  onVerify,
  onExpire,
  disabled = false,
  error,
  resetKey,
}: HCaptchaWidgetProps) {
  const captchaRef = useRef<HCaptcha>(null);

  const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

  // Reset captcha when resetKey changes
  useEffect(() => {
    if (resetKey && captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
  }, [resetKey]);

  const handleVerify = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify],
  );

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  if (!siteKey) {
    console.warn("VITE_HCAPTCHA_SITE_KEY tidak dikonfigurasi");
    return null;
  }

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center justify-center rounded-lg border p-3 ${
          error
            ? "border-destructive/50 bg-destructive/5"
            : "border-input bg-background"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <HCaptcha
          ref={captchaRef}
          sitekey={siteKey}
          onVerify={handleVerify}
          onExpire={handleExpire}
          languageOverride="id"
          theme="light"
          size="normal"
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <ShieldCheck className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
