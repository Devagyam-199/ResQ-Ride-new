import { useState } from "react";
import useMsg91 from "@/hooks/useMsg91";
import useAuth from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import PhoneStep from "./PhoneStep";
import OtpStep from "./OtpStep";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

const AuthCard = () => {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("+91");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { sdkReady, sdkError, sendOtp, verifyOtp } = useMsg91();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("otp");
    } catch (error) {
      setError("Failed to send OTP. Check your number and try again.");
      console.error("sendOtp error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp) => {
    setError("");
    setLoading(true);
    try {
      const data = await verifyOtp(otp);

      const accessToken = data?.message;
      if (!accessToken) throw new Error("No token in MSG91 response");

      const user = await loginWithToken(accessToken);

      if (user.role === "Admin") navigate("/admin");
      else if (user.role === "Driver") navigate("/driver");
      else navigate("/booking");
    } catch (error) {
      setError(
        error.response?.data?.error || "Verification failed. Try again.",
      );
      console.error("verifyOtp error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full bg-slate-950/70 backdrop-blur-md max-w-md mx-auto text-lg text-slate-200 mt-10">
      <CardHeader
        className={`lg:text-2xl md:text-xl text-base flex justify-center items-center`}
      >
        Welcome to ResQRide
      </CardHeader>
      <CardContent>
        {sdkError && (
          <p className="text-red-500 text-sm text-center mb-4">{sdkError}</p>
        )}
        {step === "phone" ? (
          <PhoneStep
            phone={phone}
            setPhone={setPhone}
            onSubmit={handleSendOtp}
            loading={loading}
            disabled={!sdkReady}
          />
        ) : (
          <OtpStep
            phone={phone}
            onComplete={handleVerifyOtp}
            onResend={handleSendOtp}
            loading={loading}
            error={error}
          />
        )}
      </CardContent>
      <div className="flex select-none items-center text-xs md:text-sm lg:text-base justify-center w-5/6 mx-auto my-1">
        <div className="flex-1 border-t ml-2 mt-1 w-2/3 border-gray-600"></div>
        <span className="text-gray-400 mx-5 text-md">or</span>
        <div className="flex-1 border-t mr-2 mt-1 w-2/3 border-gray-600"></div>
      </div>
      <CardFooter
        className={`text-white flex justify-center w-full lg:text-base md:text-sm text-xs`}
      >
        <p>
          <Link to={"/driver/register"} className="text-[#0077B6] hover:text-[#00B4D8]">
            Join
          </Link>{" "}
          our network of emergency responders.
        </p>
      </CardFooter>
    </Card>
  );
};

export default AuthCard;
