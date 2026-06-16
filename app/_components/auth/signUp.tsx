// CustomSignUp.tsx
"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import Google from "@/public/logos/google.svg";
import Microsoft from "@/public/logos/microsoft.svg";
import Apple from "@/public/logos/apple.svg";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Image from "next/image";

export default function CustomSignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [code, setCode] = useState("");

  // ✅ Local flag — prevents showing verify screen before form is submitted
  const [pendingVerification, setPendingVerification] = useState(false);

  const signUpWithPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signUp) return;

    const { error } = await signUp.password({
      firstName: fname,
      lastName: lname,
      emailAddress,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    await signUp.verifications.sendEmailCode();
    setPendingVerification(true);
  };

  const onPressVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signUp) return;

    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
    } else {
      console.error("Sign-up not complete:", signUp);
    }
  };

  const oauthSignUp = async (
    strategy: "oauth_google" | "oauth_microsoft" | "oauth_apple",
  ) => {
    if (!signUp) return;
    await signUp.sso({
      strategy,
      // ✅ Correct param names per SignUpFutureSSOParams
      redirectUrl: "/auth/sso-callback",
      redirectCallbackUrl: "/",
    });
  };

  if (pendingVerification) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-white">Verify your email</h2>
          <p className="mt-2 text-zinc-400">
            Check your email for a verification code.
          </p>
          <form onSubmit={onPressVerify} className="space-y-4 mt-8">
            <div>
              <Label className="mb-2 block text-sm text-zinc-400">
                Verification Code
              </Label>
              <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => setCode(value)}
                  className="text-white"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="text-white" />
                    <InputOTPSlot index={1} className="text-white" />
                    <InputOTPSlot index={2} className="text-white" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className="text-white" />
                    <InputOTPSlot index={4} className="text-white" />
                    <InputOTPSlot index={5} className="text-white" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {errors?.fields?.code && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.fields.code.message}
                </p>
              )}
            </div>

            {errors?.global && (
              <p className="text-sm text-red-500">{errors.global.message}</p>
            )}

            <Button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="w-full rounded-xl bg-white py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {fetchStatus === "fetching" ? "Verifying..." : "Verify"}
            </Button>

            <button
              type="button"
              onClick={() => signUp?.verifications.sendEmailCode()}
              className="w-full text-sm text-zinc-400 hover:text-white transition"
            >
              Resend code
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
        <section className="w-full flex items-center justify-center text-center py-4">
          <Image
            src="https://i.ibb.co/6785v806/VAM-Enterprises-Logo.png"
            alt="VAM-Enterprises-Logo"
            width={1024}
            height={1024}
            className="w-16 h-16"
          />
        </section>
        <section className="text-center">
          <h2 className="text-3xl font-bold text-white">Create an account</h2>
          <p className="mt-2 text-zinc-400">
            Get started with your new account on VAM Enterprises.
          </p>
        </section>

        <div className="mt-8 space-y-3">
          <Button
            onClick={() => oauthSignUp("oauth_google")}
            className="inline-flex gap-5 w-full items-center justify-center rounded-xl border px-4 py-3 transition
             bg-zinc-100 text-zinc-900 border-zinc-300 hover:bg-zinc-200
             dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Google className="w-5 h-5" />
            Continue with Google
          </Button>
          <Button
            onClick={() => oauthSignUp("oauth_microsoft")}
            className="inline-flex gap-5 w-full items-center justify-center rounded-xl border px-4 py-3 transition
             bg-zinc-100 text-zinc-900 border-zinc-300 hover:bg-zinc-200
             dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Microsoft className="w-5 h-5" />
            Continue with Microsoft
          </Button>
          <Button
            onClick={() => oauthSignUp("oauth_apple")}
            className="inline-flex gap-5 w-full items-center justify-center rounded-xl border px-4 py-3 transition
             bg-zinc-100 text-zinc-900 border-zinc-300 hover:bg-zinc-200
             dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Apple className="w-5 h-5 dark:invert" />
            Continue with Apple
          </Button>
        </div>

        <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="px-3 text-sm text-zinc-400">OR</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={signUpWithPassword} className="space-y-4">
          <div id="clerk-captcha" />

          <div>
            <Label className="mb-2 block text-sm text-zinc-400">Name</Label>
            <section className="grid grid-cols-2 gap-5">
              <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 mb-4">
                <User size={18} className="text-zinc-500" />
                <input
                  type="text"
                  value={fname}
                  onChange={(e) => setFname(e.target.value)}
                  className="h-12 w-full bg-transparent px-3 text-white outline-none"
                  placeholder="John"
                  required
                />
              </div>
              <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 mb-4">
                <input
                  type="text"
                  value={lname}
                  onChange={(e) => setLname(e.target.value)}
                  className="h-12 w-full bg-transparent px-3 text-white outline-none"
                  placeholder="Doe"
                  required
                />
              </div>
            </section>

            <Label className="mb-2 block text-sm text-zinc-400">Email</Label>
            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4">
              <Mail size={18} className="text-zinc-500" />
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="h-12 w-full bg-transparent px-3 text-white outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
            {errors?.fields?.emailAddress && (
              <p className="mt-1 text-sm text-red-500">
                {errors.fields.emailAddress.message}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-2 block text-sm text-zinc-400">Password</Label>
            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4">
              <Lock size={18} className="text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full bg-transparent px-3 text-white outline-none"
                placeholder="•••••••••••"
                required
              />
            </div>
            {errors?.fields?.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.fields.password.message}
              </p>
            )}
          </div>

          {errors?.global && (
            <p className="text-sm text-red-500">{errors.global.message}</p>
          )}

          <Button
            type="submit"
            disabled={fetchStatus === "fetching"}
            className="w-full rounded-xl bg-white py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {fetchStatus === "fetching" ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?
          <Link
            href="/auth/sign-in"
            className="ml-1 text-white hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
