"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "./actions";
import Link from "next/link";

const initialState: { error?: string; success?: string } = {};

export default function LoginPage() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  const [signInState, signInAction, signingIn] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, initialState);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gray-900 p-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-white text-xs font-bold">SM</span>
          </div>
          <span className="text-white font-bold text-lg">StudentMatch</span>
        </Link>

        <div>
          <p className="text-3xl font-black text-white leading-snug mb-4">
            Find opgaver og jobs<br />der passer<br />til dig.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            Opret en profil, find det rette match og kom i gang med samarbejdet —
            hurtigt og fleksibelt.
          </p>
        </div>

        <p className="text-gray-600 text-xs">© {new Date().getFullYear()} StudentMatch</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">SM</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">StudentMatch</span>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900">
              {tab === "signin" ? "Velkommen tilbage" : "Opret konto"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {tab === "signin"
                ? "Log ind på din konto for at fortsætte."
                : "Kom i gang — det er gratis."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-7">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === t
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "signin" ? "Log ind" : "Opret konto"}
              </button>
            ))}
          </div>

          {tab === "signin" ? (
            <form action={signInAction} className="space-y-4">
              <Field label="Email" name="email" type="email" />
              <Field label="Adgangskode" name="password" type="password" />
              {signInState?.error && <Error msg={signInState.error} />}
              <SubmitBtn loading={signingIn}>Log ind</SubmitBtn>
            </form>
          ) : (
            <form action={signUpAction} className="space-y-4">
              <Field label="Email" name="email" type="email" />
              <Field label="Adgangskode" name="password" type="password" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jeg er…
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "student", label: "Arbejdssøgende" },
                    { value: "company", label: "Virksomhed" },
                  ].map(({ value, label }) => (
                    <label
                      key={value}
                      className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl p-3 cursor-pointer has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50 transition-all"
                    >
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        defaultChecked={value === "student"}
                        className="accent-gray-900"
                      />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {signUpState?.error && <Error msg={signUpState.error} />}
              {signUpState?.success && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                  {signUpState.success}
                </p>
              )}
              <SubmitBtn loading={signingUp}>Opret konto</SubmitBtn>
            </form>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            Ved at fortsætte accepterer du vores{" "}
            <a href="#" className="underline hover:text-gray-600">vilkår</a>{" "}
            og{" "}
            <a href="#" className="underline hover:text-gray-600">privatlivspolitik</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type }: { label: string; name: string; type: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        required
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition placeholder-gray-400"
      />
    </div>
  );
}

function Error({ msg }: { msg: string }) {
  return (
    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
      {msg}
    </p>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors mt-1"
    >
      {loading ? "Vent venligst…" : children}
    </button>
  );
}
