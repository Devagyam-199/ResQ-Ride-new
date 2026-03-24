import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PhoneStep = ({ phone, setPhone, onSubmit, loading, disabled }) => {
  return (
    <div className="space-y-4">
      <Input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+91 98765 43210"
        className="text-lg"
      />
      <Button
        onClick={onSubmit}
        disabled={loading || disabled}
        className="w-full h-12"
      >
        {loading ? "Sending..." : disabled ? "Loading SDK..." : "Send OTP"}
      </Button>
    </div>
  );
};

export default PhoneStep;

