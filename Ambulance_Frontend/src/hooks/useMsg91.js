import { useEffect, useState } from "react";

const useMsg91 = () => {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(null);
  useEffect(() => {
    console.log("Widget ID:", import.meta.env.VITE_MSG91_WIDGETID);
    console.log(
      "Token auth:",
      import.meta.env.VITE_MSG91_TOKEN ? "SET" : "MISSING",
    );
  }, []);

  useEffect(() => {
    if (window.__msg91Loaded) {
      setSdkReady(true);
      return;
    }

    window.configuration = {
      widgetId: import.meta.env.VITE_MSG91_WIDGETID,
      tokenAuth: import.meta.env.VITE_MSG91_TOKEN,
      exposeMethods: true,
      success: (data) => console.log("MSG91 global success:"),
      failure: (err) => console.log("MSG91 global failure:", err),
    };

    const script = document.createElement("script");
    script.src = "https://verify.msg91.com/otp-provider.js";
    script.async = true;

    script.onload = () => {
      if (typeof window.initSendOTP === "function") {
        window.initSendOTP(window.configuration);
        window.__msg91Loaded = true;
        setSdkReady(true);
        console.log("MSG91 SDK loaded and ready");
      } else {
        setSdkError("MSG91 SDK loaded but initSendOTP not found");
      }
    };

    script.onerror = () => {
      const msg = "Failed to load OTP SDK — check network";
      setSdkError(msg);
      console.error(
        msg,
        "Check: CDN up, CSP allows verify.msg91.com, network stable",
      );
    };

    document.head.appendChild(script);
  }, []);

  const sendOtp = (phone) =>
    new Promise((resolve, reject) => {
      if (!sdkReady) return reject(new Error("SDK is not ready"));
      const mobile = phone.replace("+", "");
      window.sendOtp(mobile, resolve, reject);
    });

  const verifyOtp = (otp) =>
    new Promise((resolve, reject) => {
      if (!sdkReady) {
        return reject(new Error("SDK not ready yet. Wait for sdkReady=true"));
      }
      if (!window.verifyOtp) {
        return reject(new Error("window.verifyOtp is undefined"));
      }
      window.verifyOtp(otp, resolve, reject);
    });

  return { sdkReady, sdkError, sendOtp, verifyOtp };
};

export default useMsg91;
