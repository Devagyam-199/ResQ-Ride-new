import { useEffect, useState } from "react";

// FIX: removed console.log statements that were leaking widget ID
// and token auth status to the browser console in production.

const useMsg91 = () => {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(null);

  useEffect(() => {
    if (window.__msg91Loaded) {
      setSdkReady(true);
      return;
    }

    window.configuration = {
      widgetId:      import.meta.env.VITE_MSG91_WIDGETID,
      tokenAuth:     import.meta.env.VITE_MSG91_TOKEN,
      exposeMethods: true,
      success: () => {},  // FIX: removed console.log
      failure: () => {},  // FIX: removed console.log
    };

    const script = document.createElement("script");
    script.src   = "https://verify.msg91.com/otp-provider.js";
    script.async = true;

    script.onload = () => {
      if (typeof window.initSendOTP === "function") {
        window.initSendOTP(window.configuration);
        window.__msg91Loaded = true;
        setSdkReady(true);
      } else {
        setSdkError("OTP service unavailable. Please refresh and try again.");
      }
    };

    script.onerror = () => {
      setSdkError("Failed to load OTP service. Please check your connection.");
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
      if (!sdkReady) return reject(new Error("SDK not ready yet. Wait for sdkReady=true"));
      if (!window.verifyOtp) return reject(new Error("window.verifyOtp is undefined"));
      window.verifyOtp(otp, resolve, reject);
    });

  return { sdkReady, sdkError, sendOtp, verifyOtp };
};

export default useMsg91;