import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import useMsg91 from "@/hooks/useMsg91";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import ambulanceimage from "@/assets/ambulance_authpage.png";

const STEPS = ["Details", "Documents", "Phone", "Verify", "Done"];

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {STEPS.map((label, i) => {
      const done   = i < current;
      const active = i === current;
      return (
        <div key={label} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
                ${done ? "bg-[#00B4D8] text-white" : active ? "bg-[#0077B6] text-white ring-2 ring-[#00B4D8]/50" : "bg-slate-700 text-slate-400"}`}
            >
              {done ? "✓" : i + 1}
            </div>
            <span
              className={`text-[10px] hidden sm:block transition-colors ${active ? "text-[#00B4D8]" : done ? "text-slate-400" : "text-slate-600"}`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-4 sm:w-10 h-0.5 sm:mb-4 transition-all duration-300 ${done ? "bg-[#00B4D8]" : "bg-slate-700"}`} />
          )}
        </div>
      );
    })}
  </div>
);

const FieldLabel = ({ children, required }) => (
  <label className="block text-slate-300 text-sm font-medium mb-1.5">
    {children}
    {required && <span className="text-[#00B4D8] ml-1">*</span>}
  </label>
);

const FieldInput = ({ error, ...props }) => (
  <div>
    <input
      {...props}
      className={`w-full bg-slate-800/60 border rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500
        text-sm outline-none transition-all duration-200 focus:ring-2
        ${error ? "border-red-500/70 focus:ring-red-500/30" : "border-slate-700 focus:border-[#0077B6] focus:ring-[#0077B6]/30"}`}
    />
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

const FileUploadBox = ({ label, hint, accept, file, onChange, error }) => (
  <div>
    <FieldLabel required>{label}</FieldLabel>
    <label
      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg
      py-6 px-4 cursor-pointer transition-all duration-200
      ${error ? "border-red-500/50 bg-red-900/10" : file ? "border-[#00B4D8]/60 bg-[#0077B6]/10" : "border-slate-700 hover:border-slate-500 bg-slate-800/40"}`}
    >
      <input type="file" accept={accept} className="hidden" onChange={onChange} />
      {file ? (
        <>
          <div className="w-8 h-8 rounded-full bg-[#0077B6]/30 flex items-center justify-center">
            <span className="text-[#00B4D8] text-base">✓</span>
          </div>
          <span className="text-[#00B4D8] text-xs text-center font-medium truncate max-w-full px-2">{file.name}</span>
          <span className="text-slate-500 text-xs">click to change</span>
        </>
      ) : (
        <>
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-slate-400 text-base">↑</span>
          </div>
          <span className="text-slate-400 text-xs text-center">{hint}</span>
        </>
      )}
    </label>
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

export default function DriverRegisterPage() {
  const navigate = useNavigate();
  const { sdkReady, sdkError, sendOtp, verifyOtp } = useMsg91();

  const [step,        setStep]        = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [globalError, setGlobalError] = useState("");

  const [form, setForm] = useState({
    name: "", vehicleNumber: "", vehicleType: "BLS", email: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const [photo,      setPhoto]      = useState(null);
  const [license,    setLicense]    = useState(null);
  const [fileErrors, setFileErrors] = useState({});

  const [phone,       setPhone]       = useState("+91");
  const [phoneError,  setPhoneError]  = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  const digits = phone.replace("+91", "");

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFormErrors((fe) => ({ ...fe, [key]: "" }));
  };

  const startTimer = () => {
    setResendTimer(15);
    const id = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const validateDetails = () => {
    const e = {};
    if (!form.name.trim())           e.name          = "Name is required";
    if (!form.vehicleNumber.trim())  e.vehicleNumber  = "Vehicle number is required";
    if (!form.vehicleType)           e.vehicleType    = "Vehicle type is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleDetailsNext = () => { if (validateDetails()) setStep(1); };

  const handleDocumentsNext = () => {
    const e = {};
    if (!photo)   e.photo   = "Driver photo is required";
    if (!license) e.license = "License document is required";
    setFileErrors(e);
    if (Object.keys(e).length === 0) setStep(2);
  };

  const handleSendOtp = async () => {
    if (!digits || digits.length < 10) { setPhoneError("Enter a valid 10-digit number"); return; }
    setPhoneError("");
    setLoading(true);
    setGlobalError("");
    try {
      await sendOtp(phone);
      startTimer();
      setStep(3);
    } catch {
      setGlobalError("Failed to send OTP. Check your number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCount >= 2 || resendTimer > 0) return;
    setLoading(true);
    try {
      await sendOtp(phone);
      setResendCount((c) => c + 1);
      startTimer();
    } catch {
      setGlobalError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSubmit = async (otp) => {
    setGlobalError("");
    setLoading(true);
    try {
      const data  = await verifyOtp(otp);
      const token = data?.message;
      if (!token) throw new Error("No token returned from OTP verification");

      const fd = new FormData();
      fd.append("accessToken", token);
      fd.append("name",          form.name.trim());
      fd.append("vehicleNumber", form.vehicleNumber.trim().toUpperCase());
      fd.append("vehicleType",   form.vehicleType);
      if (form.email.trim()) fd.append("email", form.email.trim());
      fd.append("photo",   photo);
      fd.append("license", license);

      await api.post("/api/v1/driver/register", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStep(4);
    } catch (err) {
      setGlobalError(
        err.response?.data?.error || err.message || "Verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-slate-300 flex items-center justify-center">
      <div className="absolute inset-0 w-full h-full">
        <img src={ambulanceimage} className="absolute inset-0 w-full h-full object-cover" alt="" />
      </div>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 py-8">
        <div className="flex items-center gap-4 w-full justify-center mb-6">
          <svg className="w-1/3 md:w-1/4" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ecgL" x1="0" y1="0" x2="190" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#0077b6" stopOpacity="0" />
                <stop offset="100%" stopColor="#0077b6" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path d="M10,100L50,100L65,65L75,135L85,100L125,100L140,25L155,175L170,100L210,100L225,80L235,120L245,100L290,100L305,45L325,155L340,100L380,100"
              fill="none" stroke="url(#ecgL)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <p className="text-xl sm:text-4xl md:text-5xl lg:text-6xl text-slate-100 font-light tracking-wide">ResQRide</p>
          <svg className="w-1/3 md:w-1/4" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ecgR" x1="210" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#0077b6" stopOpacity="1" />
                <stop offset="100%" stopColor="#0077b6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M10,100L50,100L65,65L75,135L85,100L125,100L140,25L155,175L170,100L210,100L225,80L235,120L245,100L290,100L305,45L325,155L340,100L380,100"
              fill="none" stroke="url(#ecgR)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>

        <Card className="w-full max-w-md bg-slate-950/75 backdrop-blur-md text-slate-200 border-slate-800">
          <CardHeader className="pb-0 pt-6 px-6">
            <p className="text-center lg:text-2xl md:text-xl text-base font-medium text-slate-100">
              {step === 4 ? "Registration Submitted" : "Join as Emergency Responder"}
            </p>
            {step < 4 && (
              <p className="text-center text-xs text-slate-500 mt-1">Step {step + 1} of {STEPS.length - 1}</p>
            )}
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-4">
            <div className="w-full flex justify-center items-center">
              <StepIndicator current={step} />
            </div>

            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <FieldLabel required>Full Name</FieldLabel>
                  <FieldInput type="text" placeholder="Rahul Sharma" value={form.name} onChange={setField("name")} error={formErrors.name} />
                </div>
                <div>
                  <FieldLabel required>Vehicle Number</FieldLabel>
                  <FieldInput type="text" placeholder="MH12AB1234" value={form.vehicleNumber} onChange={setField("vehicleNumber")} error={formErrors.vehicleNumber} className="uppercase" />
                </div>
                <div>
                  <FieldLabel required>Vehicle Type</FieldLabel>
                  <select
                    value={form.vehicleType}
                    onChange={setField("vehicleType")}
                    className={`w-full bg-slate-800/60 border rounded-lg px-3 py-2.5 text-slate-100
                      text-sm outline-none transition-all duration-200 focus:ring-2
                      ${formErrors.vehicleType ? "border-red-500/70 focus:ring-red-500/30" : "border-slate-700 focus:border-[#0077B6] focus:ring-[#0077B6]/30"}`}
                  >
                    <option value="BLS">BLS — Basic Life Support</option>
                    <option value="ALS">ALS — Advanced Life Support</option>
                    <option value="Mortuary">Mortuary</option>
                  </select>
                  {formErrors.vehicleType && <p className="text-red-400 text-xs mt-1">{formErrors.vehicleType}</p>}
                </div>
                <div>
                  <FieldLabel>Email (optional)</FieldLabel>
                  <FieldInput type="email" placeholder="rahul@example.com" value={form.email} onChange={setField("email")} error={formErrors.email} />
                </div>
                <Button onClick={handleDetailsNext} className="w-full h-11 bg-[#0077B6] hover:bg-[#00B4D8] text-slate-100 mt-2">
                  Continue →
                </Button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <FileUploadBox
                  label="Driver Photo" hint="JPG or PNG · max 5 MB" accept="image/jpeg,image/png,image/jpg"
                  file={photo}
                  onChange={(e) => { setPhoto(e.target.files[0] || null); setFileErrors((fe) => ({ ...fe, photo: "" })); }}
                  error={fileErrors.photo}
                />
                <FileUploadBox
                  label="Driver's License" hint="JPG, PNG or PDF · max 5 MB" accept="image/jpeg,image/png,image/jpg,application/pdf"
                  file={license}
                  onChange={(e) => { setLicense(e.target.files[0] || null); setFileErrors((fe) => ({ ...fe, license: "" })); }}
                  error={fileErrors.license}
                />
                <div className="flex gap-3 mt-2">
                  <Button variant="ghost" onClick={() => setStep(0)} className="flex-1 h-11 text-slate-400 hover:text-slate-900 border border-slate-700">← Back</Button>
                  <Button onClick={handleDocumentsNext} className="flex-1 h-11 bg-[#0077B6] hover:bg-[#00B4D8] text-slate-100">Continue →</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {sdkError && <p className="text-red-400 text-sm text-center">{sdkError}</p>}
                <div>
                  <FieldLabel required>Phone Number</FieldLabel>
                  <div className="flex items-center border-b-2 border-b-[#00B4D8] pb-1 gap-2">
                    <div className="flex items-center gap-1 pt-3 shrink-0 select-none">
                      <span className="text-[#0077b6]">🇮🇳</span>
                      <span className="text-slate-300 font-semibold">+91</span>
                    </div>
                    <input
                      type="tel" inputMode="numeric" value={digits} placeholder="98765 43210" maxLength={10}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone("+91" + d);
                        if (phoneError) setPhoneError("");
                      }}
                      className="flex-1 bg-transparent outline-none pt-3 text-slate-100 placeholder-slate-500 font-medium tracking-widest caret-blue-400"
                    />
                    {digits.length > 0 && (
                      <span className={`text-xs font-mono shrink-0 transition-colors ${digits.length === 10 ? "text-emerald-400" : "text-slate-500"}`}>
                        {digits.length}/10
                      </span>
                    )}
                  </div>
                  {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                </div>
                <div className="flex gap-3 mt-2">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-11 text-slate-400 hover:text-slate-900 border border-slate-700">← Back</Button>
                  <Button onClick={handleSendOtp} disabled={loading || !sdkReady || digits.length !== 10} className="flex-1 h-11 bg-[#0077B6] hover:bg-[#00B4D8] text-slate-100">
                    {loading ? "Sending..." : !sdkReady ? "Loading..." : "Send OTP"}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <p className="text-center text-sm text-slate-400">
                  Enter the 6-digit code sent to <span className="text-slate-200 font-medium">{phone}</span>
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} onComplete={handleVerifyAndSubmit} disabled={loading}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {loading && <p className="text-center text-sm text-slate-400 animate-pulse">Verifying and submitting…</p>}
                <Button variant="ghost" className="w-full" disabled={resendCount >= 2 || resendTimer > 0 || loading} onClick={handleResend}>
                  {resendCount >= 2 ? "Resend limit reached" : resendTimer > 0 ? `Resend in ${resendTimer}s` : `Resend OTP (${2 - resendCount} left)`}
                </Button>
                <Button variant="ghost" onClick={() => setStep(2)} className="w-full text-slate-500 hover:text-slate-300 text-xs">
                  ← Change phone number
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col items-center gap-5 py-2">
                <div className="w-16 h-16 rounded-full bg-[#0077B6]/20 border-2 border-[#00B4D8]/50 flex items-center justify-center">
                  <span className="text-3xl">✓</span>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-slate-100 font-medium text-base">Your application is under review</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We've received your registration. Our team will verify your documents and approve your account.
                  </p>
                </div>
                <div className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 space-y-1.5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Submitted details</p>
                  <p className="text-sm text-slate-300"><span className="text-slate-500">Name: </span>{form.name}</p>
                  <p className="text-sm text-slate-300"><span className="text-slate-500">Vehicle: </span>{form.vehicleNumber.toUpperCase()} · {form.vehicleType}</p>
                  <p className="text-sm text-slate-300"><span className="text-slate-500">Phone: </span>{phone}</p>
                </div>
                <Button onClick={() => navigate("/")} className="w-full h-11 bg-[#0077B6] hover:bg-[#00B4D8] text-slate-100">
                  Back to Login
                </Button>
              </div>
            )}

            {globalError && <p className="text-red-400 text-sm text-center mt-3">{globalError}</p>}

            {step < 4 && (
              <>
                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-slate-700" />
                  <span className="text-slate-500 mx-4 lg:text-base md:text-sm text-xs">or</span>
                  <div className="flex-1 border-t border-slate-700" />
                </div>
                <p className="text-center lg:text-base md:text-sm text-xs text-slate-400">
                  Already approved?{" "}
                  <Link to="/" className="text-[#0077B6] hover:text-[#00B4D8]">Log in here</Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}