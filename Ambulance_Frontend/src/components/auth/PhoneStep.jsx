import { useState } from "react";
import { Button } from "@/components/ui/button";

const PhoneStep = ({ phone, setPhone, onSubmit, loading, disabled }) => {
  const [errors, setErrors] = useState("");

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone("+91" + digits);
    if (errors) setErrors("");
  };

  const handleSubmit = () => {
    const digits = phone.replace("+91", "");
    if (!digits || digits.length < 10) {
      setErrors("Please enter a valid 10-digit phone number");
      return;
    }
    setErrors("");
    onSubmit();
  };

  const displayDigits = phone.replace("+91", "");

  return (
    <>
      <div className="space-y-4 lg:text-base md:text-sm text-xs ">
        <label className="text-slate-200 font-medium ">Phone Number:</label>

        {/* Input row */}
        <div className="flex items-center border-b-2 border-b-[#00B4D8] pb-1 gap-2">
          {/* Non-editable country pill */}
          <div className="flex items-center gap-1.5 pt-3 shrink-0 select-none">
            <div className="flex items-center gap-1 rounded px-2 py-0.5">
              <span className="leading-none text-[#0077b6]">🇮🇳</span>
              <span className="text-slate-300 font-semibold">+91</span>
            </div>
          </div>

          {/* Editable digits only */}
          <input
            type="tel"
            inputMode="numeric"
            value={displayDigits}
            onChange={handlePhoneChange}
            placeholder="98765 43210"
            maxLength={10}
            className="
            flex-1 bg-transparent outline-none items-center pt-3
            text-slate-100 placeholder-slate-500 font-medium tracking-widest
            caret-blue-400
            
          "
          />

          {/* Character counter */}
          {displayDigits.length > 0 && (
            <span
              className={`text-xs font-mono shrink-0 transition-colors ${
                displayDigits.length === 10
                  ? "text-emerald-400"
                  : "text-slate-500"
              }`}
            >
              {displayDigits.length}/10
            </span>
          )}
        </div>

        {errors && <p className="text-red-500 text-sm">{errors}</p>}

        <Button
          onClick={handleSubmit}
          disabled={loading || disabled || displayDigits.length !== 10}
          variant="default"
          className={"lg:h-12 h-10"}
        >
          {loading ? "Sending..." : disabled ? "Loading SDK..." : "Send OTP"}
        </Button>
      </div>
    </>
  );
};

export default PhoneStep;
