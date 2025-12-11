"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, User, Building2 } from "lucide-react";

// Zod schema for sign-in validation
const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email.")
    .email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
  rememberMe: z.boolean(),
});

// Zod schema for sign-up validation
const signUpSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters.").max(80, "Organization name must be at most 80 characters."),
  firstName: z.string().min(2, "First name must be at least 2 characters.").max(80, "First name must be at most 80 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters.").max(80, "Last name must be at most 80 characters."),
  email: z.string().min(1, "Enter your email.").email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Must be at least 8 characters.")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, "Must include upper, lower, number, symbol."),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine((val) => val === true, "You must accept the terms."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Confirm password must match.",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function AuthSwitch() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Sign In Form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Sign Up Form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      organizationName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  useEffect(() => {
    const container = document.querySelector(".container");
    if (!container) return;
    if (isSignUp) container.classList.add("sign-up-mode");
    else container.classList.remove("sign-up-mode");
  }, [isSignUp]);

  // Sign In Handler
  const onSignIn = async (data: SignInFormData) => {
    setGlobalError("");
    setUnverifiedEmail(null);
    setIsSubmitting(true);

    const normalizedData = {
      email: data.email.trim().toLowerCase(),
      password: data.password,
      rememberMe: data.rememberMe,
    };

    try {
      const response = await apiClient(getApiUrl("auth/signin"), {
        method: "POST",
        body: JSON.stringify(normalizedData),
        skipCsrf: true,
      });

      const responseData = await response.json();

      if (response.ok && responseData.requiresVerification) {
        setUnverifiedEmail(normalizedData.email);
        setGlobalError(responseData.message || "Please verify your email address before signing in.");
        return;
      }

      if (!response.ok) {
        if (response.status === 429) {
          const retryMinutes = responseData.retryAfterSeconds ? Math.ceil(responseData.retryAfterSeconds / 60) : 15;
          setGlobalError(responseData.message || `Too many attempts. Please try again in ${retryMinutes} minutes.`);
          return;
        }

        if (responseData.fieldErrors && typeof responseData.fieldErrors === "object") {
          Object.entries(responseData.fieldErrors).forEach(([field, message]) => {
            signInForm.setError(field as keyof SignInFormData, {
              type: "server",
              message: message as string,
            });
          });
        } else {
          setGlobalError(responseData.message || "Invalid credentials.");
        }
        return;
      }

      await refreshUser();
      router.push("/dashboard");
    } catch (error) {
      console.error("[SignIn] Error during sign in:", error);
      setGlobalError("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up Handler
  const onSignUp = async (data: SignUpFormData) => {
    setGlobalError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(getApiUrl("auth/signup"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgName: data.organizationName.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          confirmPassword: data.confirmPassword,
          termsAccepted: data.termsAccepted,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.errors && typeof responseData.errors === "object") {
          Object.entries(responseData.errors).forEach(([field, message]) => {
            signUpForm.setError(field as keyof SignUpFormData, {
              type: "server",
              message: message as string,
            });
          });
        } else {
          setGlobalError(responseData.message || "Something went wrong. Please try again.");
        }
        return;
      }

      router.push("/auth/verify-email?email=" + encodeURIComponent(data.email));
    } catch (error) {
      setGlobalError("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    try {
      await fetch(getApiUrl("auth/resend-verification"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      router.push(`/auth/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
    } catch (error) {
      setGlobalError("Failed to resend verification email.");
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .auth-wrapper {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .container {
          position: relative;
          width: 100%;
          max-width: 900px;
          height: 600px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .forms-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .signin-signup {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          left: 75%;
          width: 50%;
          transition: 1s 0.7s ease-in-out;
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 3rem;
          transition: all 0.2s 0.7s;
          overflow: hidden;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
        }

        form.sign-up-form {
          opacity: 0;
          z-index: 1;
        }

        form.sign-in-form {
          z-index: 2;
        }

        .title {
          font-size: 2.2rem;
          color: #444;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .input-field {
          max-width: 380px;
          width: 100%;
          background-color: #f0f0f0;
          margin: 8px 0;
          height: 50px;
          border-radius: 50px;
          display: grid;
          grid-template-columns: 15% 85%;
          padding: 0 0.4rem;
          position: relative;
          transition: 0.3s;
        }

        .input-field:focus-within {
          background-color: #e8e8e8;
          box-shadow: 0 0 0 2px #667eea;
        }

        .input-field i {
          text-align: center;
          line-height: 50px;
          color: #666;
          transition: 0.5s;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .input-field input[type="text"],
        .input-field input[type="email"],
        .input-field input[type="password"] {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 500;
          font-size: 0.95rem;
          color: #333;
          width: 100%;
        }

        .input-field input::placeholder {
          color: #aaa;
          font-weight: 400;
        }

        .checkbox-field {
          max-width: 380px;
          width: 100%;
          margin: 8px 0;
          display: flex;
          align-items: center;
          font-size: 0.9rem;
        }

        .checkbox-field input[type="checkbox"] {
          margin-right: 8px;
          width: 16px;
          height: 16px;
        }

        .btn {
          width: 150px;
          background-color: #667eea;
          border: none;
          outline: none;
          height: 49px;
          border-radius: 49px;
          color: #fff;
          text-transform: uppercase;
          font-weight: 600;
          margin: 10px 0;
          cursor: pointer;
          transition: 0.5s;
          font-size: 0.9rem;
        }

        .btn:hover {
          background-color: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .btn:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .panels-container {
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .panel {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-around;
          text-align: center;
          z-index: 6;
        }

        .left-panel {
          pointer-events: all;
          padding: 3rem 17% 2rem 12%;
        }

        .right-panel {
          pointer-events: none;
          padding: 3rem 12% 2rem 17%;
        }

        .panel .content {
          color: #fff;
          transition: transform 0.9s ease-in-out;
          transition-delay: 0.6s;
        }

        .panel h3 {
          font-weight: 600;
          line-height: 1;
          font-size: 1.5rem;
          margin-bottom: 10px;
        }

        .panel p {
          font-size: 0.95rem;
          padding: 0.7rem 0;
        }

        .btn.transparent {
          margin: 0;
          background: none;
          border: 2px solid #fff;
          width: 130px;
          height: 41px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .btn.transparent:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .right-panel .content {
          transform: translateX(800px);
        }

        .container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 52%;
        }

        .container.sign-up-mode .left-panel .content {
          transform: translateX(-800px);
        }

        .container.sign-up-mode .signin-signup {
          left: 25%;
        }

        .container.sign-up-mode form.sign-up-form {
          opacity: 1;
          z-index: 2;
        }

        .container.sign-up-mode form.sign-in-form {
          opacity: 0;
          z-index: 1;
        }

        .container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
        }

        .container.sign-up-mode .left-panel {
          pointer-events: none;
        }

        .container.sign-up-mode .right-panel {
          pointer-events: all;
        }

        .container:before {
          content: "";
          position: absolute;
          height: 2000px;
          width: 2000px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background: linear-gradient(-45deg, #667eea 0%, #764ba2 100%);
          transition: 1.8s ease-in-out;
          border-radius: 50%;
          z-index: 6;
        }

        .error-message {
          color: #dc2626;
          font-size: 0.75rem;
          margin-top: 4px;
          max-width: 380px;
          width: 100%;
          text-align: left;
        }

        .global-error {
          max-width: 380px;
          width: 100%;
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .global-error-text {
          color: #991b1b;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .resend-link {
          color: #991b1b;
          text-decoration: underline;
          font-size: 0.875rem;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          margin-top: 8px;
        }

        .forgot-password-link {
          color: #667eea;
          font-size: 0.85rem;
          text-decoration: none;
          margin-top: 8px;
          display: inline-block;
        }

        .forgot-password-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 870px) {
          .container {
            min-height: 800px;
            height: 100vh;
          }
          .signin-signup {
            width: 100%;
            top: 95%;
            transform: translate(-50%, -100%);
            transition: 1s 0.8s ease-in-out;
          }
          .signin-signup,
          .container.sign-up-mode .signin-signup {
            left: 50%;
          }
          .panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }
          .panel {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            padding: 2.5rem 8%;
            grid-column: 1 / 2;
          }
          .right-panel {
            grid-row: 3 / 4;
          }
          .left-panel {
            grid-row: 1 / 2;
          }
          .panel .content {
            padding-right: 15%;
            transition: transform 0.9s ease-in-out;
            transition-delay: 0.8s;
          }
          .panel h3 {
            font-size: 1.2rem;
          }
          .panel p {
            font-size: 0.7rem;
            padding: 0.5rem 0;
          }
          .btn.transparent {
            width: 110px;
            height: 35px;
            font-size: 0.7rem;
          }
          .container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
            transition: 2s ease-in-out;
          }
          .container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
          }
          .container.sign-up-mode .left-panel .content {
            transform: translateY(-300px);
          }
          .container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
          }
          .right-panel .content {
            transform: translateY(300px);
          }
          .container.sign-up-mode .signin-signup {
            top: 5%;
            transform: translate(-50%, 0);
          }
        }

        @media (max-width: 570px) {
          form {
            padding: 0 1.5rem;
          }
          .panel .content {
            padding: 0.5rem 1rem;
          }
        }
      `}</style>

      <div className="auth-wrapper">
        <div className="container">
          <div className="forms-container">
            <div className="signin-signup">
              {/* Sign In Form */}
              <form className="sign-in-form" onSubmit={signInForm.handleSubmit(onSignIn)}>
                <h2 className="title">Sign in</h2>

                {globalError && !isSignUp && (
                  <div className="global-error">
                    <p className="global-error-text">{globalError}</p>
                    {unverifiedEmail && (
                      <button onClick={handleResendVerification} className="resend-link">
                        Resend verification email
                      </button>
                    )}
                  </div>
                )}

                <div className="input-field">
                  <i><Mail size={18} /></i>
                  <input type="email" placeholder="Email" {...signInForm.register("email")} />
                </div>
                {signInForm.formState.errors.email && (
                  <p className="error-message">{signInForm.formState.errors.email.message}</p>
                )}

                <div className="input-field">
                  <i><Lock size={18} /></i>
                  <input type="password" placeholder="Password" {...signInForm.register("password")} />
                </div>
                {signInForm.formState.errors.password && (
                  <p className="error-message">{signInForm.formState.errors.password.message}</p>
                )}

                <div className="checkbox-field">
                  <input type="checkbox" id="rememberMe" {...signInForm.register("rememberMe")} />
                  <label htmlFor="rememberMe">Remember me</label>
                </div>

                <a href="/auth/forgot-password" className="forgot-password-link">
                  Forgot password?
                </a>

                <button type="submit" disabled={isSubmitting} className="btn solid">
                  {isSubmitting ? "Signing in..." : "Login"}
                </button>
              </form>

              {/* Sign Up Form */}
              <form className="sign-up-form" onSubmit={signUpForm.handleSubmit(onSignUp)}>
                <h2 className="title">Sign up</h2>

                {globalError && isSignUp && (
                  <div className="global-error">
                    <p className="global-error-text">{globalError}</p>
                  </div>
                )}

                <div className="input-field">
                  <i><Building2 size={18} /></i>
                  <input type="text" placeholder="Organization Name" {...signUpForm.register("organizationName")} />
                </div>
                {signUpForm.formState.errors.organizationName && (
                  <p className="error-message">{signUpForm.formState.errors.organizationName.message}</p>
                )}

                <div className="input-field">
                  <i><User size={18} /></i>
                  <input type="text" placeholder="First Name" {...signUpForm.register("firstName")} />
                </div>
                {signUpForm.formState.errors.firstName && (
                  <p className="error-message">{signUpForm.formState.errors.firstName.message}</p>
                )}

                <div className="input-field">
                  <i><User size={18} /></i>
                  <input type="text" placeholder="Last Name" {...signUpForm.register("lastName")} />
                </div>
                {signUpForm.formState.errors.lastName && (
                  <p className="error-message">{signUpForm.formState.errors.lastName.message}</p>
                )}

                <div className="input-field">
                  <i><Mail size={18} /></i>
                  <input type="email" placeholder="Email" {...signUpForm.register("email")} />
                </div>
                {signUpForm.formState.errors.email && (
                  <p className="error-message">{signUpForm.formState.errors.email.message}</p>
                )}

                <div className="input-field">
                  <i><Lock size={18} /></i>
                  <input type="password" placeholder="Password" {...signUpForm.register("password")} />
                </div>
                {signUpForm.formState.errors.password && (
                  <p className="error-message">{signUpForm.formState.errors.password.message}</p>
                )}

                <div className="input-field">
                  <i><Lock size={18} /></i>
                  <input type="password" placeholder="Confirm Password" {...signUpForm.register("confirmPassword")} />
                </div>
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="error-message">{signUpForm.formState.errors.confirmPassword.message}</p>
                )}

                <div className="checkbox-field">
                  <input type="checkbox" id="termsAccepted" {...signUpForm.register("termsAccepted")} />
                  <label htmlFor="termsAccepted">I accept the terms and conditions</label>
                </div>
                {signUpForm.formState.errors.termsAccepted && (
                  <p className="error-message">{signUpForm.formState.errors.termsAccepted.message}</p>
                )}

                <button type="submit" disabled={isSubmitting} className="btn">
                  {isSubmitting ? "Creating..." : "Sign up"}
                </button>
              </form>
            </div>
          </div>

          <div className="panels-container">
            <div className="panel left-panel">
              <div className="content">
                <h3>New here?</h3>
                <p>Join us today and discover a world of possibilities. Create your account in seconds!</p>
                <button className="btn transparent" onClick={() => setIsSignUp(true)}>
                  Sign up
                </button>
              </div>
            </div>

            <div className="panel right-panel">
              <div className="content">
                <h3>One of us?</h3>
                <p>Welcome back! Sign in to continue your journey with us.</p>
                <button className="btn transparent" onClick={() => setIsSignUp(false)}>
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
