import { useState }    from "react"
import useMsg91        from "@/hooks/useMsg91"
import useAuth         from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import PhoneStep       from "./PhoneStep"
import OtpStep         from "./OtpStep"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const AuthCard = () => {
  const [step,    setStep]    = useState("phone")
  const [phone,   setPhone]   = useState("+91")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  const { sdkReady, sdkError, sendOtp, verifyOtp } = useMsg91()
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()

  const handleSendOtp = async () => {
    setError("")
    setLoading(true)
    try {
      await sendOtp(phone)
      setStep("otp")
    } catch (error) {
      setError("Failed to send OTP. Check your number and try again.")
      console.error("sendOtp error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (otp) => {
    setError("")
    setLoading(true)
    try {
      const data = await verifyOtp(otp)

      const accessToken = data?.message
      if (!accessToken) throw new Error("No token in MSG91 response")

      const user = await loginWithToken(accessToken)

      if      (user.role === "Admin")  navigate("/admin")
      else if (user.role === "Driver") navigate("/driver")
      else                             navigate("/booking")

    } catch (error) {
      setError(error.response?.data?.error || "Verification failed. Try again.")
      console.error("verifyOtp error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-2xl text-center">ResQRide</CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          {step === "phone" ? "Enter your mobile number" : `OTP sent to ${phone}`}
        </p>
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
    </Card>
  )
}

export default AuthCard