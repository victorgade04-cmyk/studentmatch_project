"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "./actions";

const initialState: { error?: string; success?: string } = {};

export default function LoginPage() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  const [signInState, signInAction, signingIn] = useActionState(
    signIn,
    initialState
  );
  const [signUpState, signUpAction, signingUp] = useActionState(
    signUp,
    initialState
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-indigo-600">StudentMatch</h1>
          <p className="text-gray-500 mt-1 text-sm">Connecting students &amp; companies</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  tab === t
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div className="p-7">
            {tab === "signin" ? (
              <form action={signInAction} className="space-y-4">
                <Field label="Email" name="email" type="email" />
                <Field label="Password" name="password" type="password" />
                {signInState?.error && <Error msg={signInState.error} />}
                <SubmitBtn loading={signingIn}>Sign in</SubmitBtn>
              </form>
            ) : (
              <form action={signUpAction} className="space-y-4">
                <Field label="Email" name="email" type="email" />
                <Field label="Password" name="password" type="password" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    I am a…
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "student", label: "🎓 Student" },
                      { value: "company", label: "🏢 Company" },
                    ].map(({ value, label }) => (
                      <label
                        key={value}
                        className="flex items-center justify-center gap-2 border rounded-lg p-3 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="role"
                          value={value}
                          defaultChecked={value === "student"}
                          className="accent-indigo-600"
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {signUpState?.error && <Error msg={signUpState.error} />}
                {signUpState?.success && (
                  <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                    {signUpState.success}
                  </p>
                )}
                <SubmitBtn loading={signingUp}>Create account</SubmitBtn>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
}: {
  label: string;
  name: string;
  type: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required
        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
      />
    </div>
  );
}

function Error({ msg }: { msg: string }) {
  return (
    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
      {msg}
    </p>
  );
}

function SubmitBtn({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors mt-1"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
