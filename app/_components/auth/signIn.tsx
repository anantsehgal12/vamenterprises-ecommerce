"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import Google from "@/public/logos/google.svg";
import Microsoft from "@/public/logos/microsoft.svg";
import Apple from "@/public/logos/apple.svg";
import Link from "next/link";
import Image from "next/image";

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loading = fetchStatus === "fetching";

  const signInWithPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");

    const { error } = await signIn.password({
      emailAddress,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      setErrorMessage("Failed to sign in");
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          // Handle session tasks
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }

          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
    } else if (signIn.status === "needs_second_factor") {
      setErrorMessage("Multi-factor authentication is required.");
    } else if (signIn.status === "needs_client_trust") {
      setErrorMessage("Additional verification is required.");
    } else {
      console.error("Sign-in attempt not complete:", signIn);
      setErrorMessage("Unable to complete sign-in.");
    }
  };

  const oauthSignIn = async (
    strategy: "oauth_google" | "oauth_microsoft" | "oauth_apple",
  ) => {
    setErrorMessage("");

    const { error } = await signIn.sso({
      strategy,
      redirectCallbackUrl: "/auth/sso-callback",
      redirectUrl: "/",
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      setErrorMessage("Authentication failed");
    }
  };

  return (
    <div className="w-xl px-4 sm:px-6 mx-auto">
      <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 sm:p-8 shadow-2xl w-full">
        <section className="w-full flex items-center justify-center text-center py-4">
          <Image
            src="https://i.ibb.co/6785v806/VAM-Enterprises-Logo.png"
            alt="VAM Enterprises"
            width={1024}
            height={1024}
            className="w-14 h-14 sm:w-16 sm:h-16"
          />
        </section>

        <section className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Sign In to Your Account
          </h2>

          <p className="mt-2 text-sm sm:text-base text-gray-400">
            Continue to VAM Enterprises
          </p>
        </section>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => oauthSignIn("oauth_google")}
            disabled={loading}
            className="inline-flex gap-3 sm:gap-5 w-full items-center justify-center rounded-xl border px-4 py-3 text-sm sm:text-base transition bg-zinc-100 text-zinc-900 border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            <Google className="w-5 h-5 flex-shrink-0" />
            Continue with Google
          </button>
        </div>

        <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="px-3 text-xs text-zinc-500">OR</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={signInWithPassword} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Email</label>

            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4">
              <Mail size={18} className="text-zinc-500 flex-shrink-0" />

              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="h-11 sm:h-12 w-full bg-transparent px-3 text-sm sm:text-base text-white outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
            {errors?.fields?.identifier && (
              <p className="mt-1 text-sm text-red-500">
                {errors.fields.identifier.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">Password</label>

            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4">
              <Lock size={18} className="text-zinc-500 flex-shrink-0" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 sm:h-12 w-full bg-transparent px-3 text-sm sm:text-base text-white outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            {errors?.fields?.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.fields.password.message}
              </p>
            )}
          </div>

          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white py-3 text-sm sm:text-base font-medium text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Don't have an account?
          <Link
            href="/auth/sign-up"
            className="ml-1 text-white hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
