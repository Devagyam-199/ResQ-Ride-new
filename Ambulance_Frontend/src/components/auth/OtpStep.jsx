import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const OtpStep = ({ phone, onComplete, onResend, loading, error }) => {
  const MAX_RESENDS = 2;
  const [resendTimer, setResendTimer] = useState(15);
  const [resendCount, setResendCount] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleResend = async () => {
    if (resendCount >= MAX_RESENDS) return;

    setResendTimer(15);
    try {
      await onResend();
      setResendCount((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const remaining = MAX_RESENDS - resendCount;
  const canResend = resendCount < MAX_RESENDS && resendTimer <= 0 && !loading;

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <InputOTP maxLength={6} onComplete={onComplete} disabled={loading}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {loading && (
        <p className="text-center text-sm text-muted-foreground">Verifying...</p>
      )}

      <Button
        variant="ghost"
        className="w-full"
        disabled={!canResend}
        onClick={handleResend}
      >
        {resendCount >= MAX_RESENDS
          ? "Resend limit reached"
          : resendTimer > 0
          ? `Resend OTP in ${resendTimer}s`
          : `Resend OTP (${remaining} left)`}
      </Button>

      {resendCount >= MAX_RESENDS && (
        <p className="text-center text-xs text-muted-foreground">
          Maximum resend attempts used. Please wait for OTP to expire or enter a new number.
        </p>
      )}
    </div>
  );
};

export default OtpStep;