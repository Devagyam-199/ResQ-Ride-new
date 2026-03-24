import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const OtpStep = ({ phone, onComplete, onResend, loading, error }) => {
  const [resendTimer, setResendTimer] = useState(15);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleResend = () => {
    setResendTimer(30);
    onResend();
  };

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
        <p className="text-center text-sm text-muted-foreground">
          Verifying...
        </p>
      )}

      <Button
        variant="ghost"
        className="w-full"
        disabled={resendTimer > 0 || loading}
        onClick={handleResend}
      >
        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
      </Button>
    </div>
  );
};

export default OtpStep
