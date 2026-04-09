import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white/80 backdrop-blur border-b border-gray-100">
        <span className="text-xl font-bold text-indigo-600">StudentMatch</span>
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight max-w-2xl">
          Connect students with <span className="text-indigo-600">great companies</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-xl">
          StudentMatch bridges the gap between talented students and companies
          looking for fresh skills. Post jobs, apply, and grow — all in one place.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Get started
          </Link>
          <a
            href="#how"
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Learn more
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: "🎓",
            title: "For Students",
            body: "Create a profile, list your skills, and apply to jobs posted by companies. Get matched based on your expertise.",
          },
          {
            icon: "🏢",
            title: "For Companies",
            body: "Post tasks and jobs, browse student profiles, and find the perfect candidate for your project.",
          },
          {
            icon: "⚙️",
            title: "Admin Control",
            body: "Full admin panel to manage users, set student hourly rates, oversee applications, and maintain platform integrity.",
          },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="text-center py-8 text-sm text-gray-400">
        © {new Date().getFullYear()} StudentMatch
      </footer>
    </main>
  );
}
