"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Stats = { students: number; companies: number; applications: number; services: number };

export default function HomePage() {
  const [searchTab, setSearchTab] = useState<"studerende" | "virksomheder">("studerende");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>({ students: 0, companies: 0, applications: 0, services: 2 });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardLink, setDashboardLink] = useState<{ href: string; label: string } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setIsLoggedIn(true);
      const role = user.user_metadata?.role as string | undefined;
      if (role === "admin") setDashboardLink({ href: "/dashboard/admin", label: "Admin" });
      else if (role === "company") setDashboardLink({ href: "/dashboard/company", label: "Mit dashboard" });
      else setDashboardLink({ href: "/dashboard/student/profile", label: "Min profil" });
    });
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SM</span>
            </div>
            <span className="font-bold text-gray-900 text-base">StudentMatch</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="#ydelser" className="hover:text-gray-900 transition-colors">Ydelser</a>
            <a href="#fordele" className="hover:text-gray-900 transition-colors">Fordele</a>
            <a href="#virksomheder" className="hover:text-gray-900 transition-colors">Virksomheder</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">Sådan virker det</a>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {dashboardLink ? (
              <Link
                href={dashboardLink.href}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
              >
                {dashboardLink.label}
              </Link>
            ) : !isLoggedIn && (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5">
                  Login
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                >
                  Opret konto
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="w-5 h-0.5 bg-gray-900 mb-1 transition-all" />
            <div className="w-5 h-0.5 bg-gray-900 mb-1" />
            <div className="w-5 h-0.5 bg-gray-900" />
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-5 py-4 space-y-3">
            {[
              { label: "Ydelser", href: "#ydelser" },
              { label: "Fordele", href: "#fordele" },
              { label: "Virksomheder", href: "#virksomheder" },
              { label: "Sådan virker det", href: "#how" },
            ].map((item) => (
              <a key={item.href} href={item.href}
                className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-1"
                onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              {dashboardLink ? (
                <Link href={dashboardLink.href} className="text-sm font-semibold bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors">{dashboardLink.label}</Link>
              ) : !isLoggedIn && (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">Login</Link>
                  <Link href="/login" className="text-sm font-semibold bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors">Opret konto</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-5">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Platform nu aktiv
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
            Har du ledig tid?<br />
            <span className="text-gray-400">Bliv matchet med</span><br />
            virksomheder
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-12 leading-relaxed">
            StudentMatch er for alle med ledig tid — studerende, sabbatår, deltidsansatte og freelancere.
            Find opgaver og jobs der passer præcis til dig.
          </p>

          {/* Search widget */}
          <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {(["studerende", "virksomheder"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSearchTab(tab)}
                  className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors ${
                    searchTab === tab
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Søg {tab}
                </button>
              ))}
            </div>

            <div className="p-4 flex gap-3">
              <input
                type="text"
                placeholder={
                  searchTab === "studerende"
                    ? "Kompetence, fag eller navn…"
                    : "Branche, virksomhed eller opgave…"
                }
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
              />
              <Link
                href="/login"
                className="px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors whitespace-nowrap"
              >
                Søg →
              </Link>
            </div>

            <div className="px-4 pb-4">
              <Link href="/login"
                className="block text-center py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Opret gratis konto
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-14 border-y border-gray-100 bg-gray-50">
        <div className="max-w-3xl mx-auto px-5 grid grid-cols-3 gap-8 text-center">
          {[
            { value: stats.students, label: "Studerende" },
            { value: stats.companies, label: "Virksomheder" },
            { value: stats.applications, label: "Forespørgsler" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-black text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="ydelser" className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Ydelser</p>
            <h2 className="text-4xl font-black text-gray-900">Hvad kan vi hjælpe med?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="group relative bg-gray-900 rounded-2xl p-8 overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
              <h3 className="text-2xl font-black text-white mb-3">Find studentermedhjælper</h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                Rekruttér ambitiøse studerende til fast deltidsarbejde. Gennemsnitstimepris
                på 150–200 kr/t — fleksibelt og engageret.
              </p>
              <Link href="/login"
                className="inline-flex items-center gap-2 bg-white text-gray-900 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                Find studerende <span>→</span>
              </Link>
            </div>

            {/* Card 2 */}
            <div className="group relative bg-white rounded-2xl p-8 border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gray-50 rounded-full -translate-y-16 translate-x-16" />
              <h3 className="text-2xl font-black text-gray-900 mb-3">Få hjælp på timebasis</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Har du en specifik opgave? Post din opgave og modtag tilbud fra
                studerende inden for 24 timer. Betal kun for udført arbejde.
              </p>
              <Link href="/login"
                className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors">
                Post opgave <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="fordele" className="py-24 px-5 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Fordele</p>
            <h2 className="text-4xl font-black text-gray-900">Hvorfor StudentMatch?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Timebasis",
                body: "Sæt din egen timepris og få betaling for præcis de timer du arbejder — ingen skjulte gebyrer eller binding.",
              },
              {
                title: "Bliv fundet",
                body: "Virksomheder kan finde og kontakte dig direkte via din profil. Du behøver ikke søge aktivt — lad mulighederne komme til dig.",
              },
              {
                title: "Jobsøgning",
                body: "Søg og ansøg jobs som virksomheder har slået op — fra opgaver på 5 timer til faste deltidsstillinger.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TASK TYPES ── */}
      <section id="virksomheder" className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Opgavetyper</p>
            <h2 className="text-4xl font-black text-gray-900">Hvad kan du hjælpe med?</h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Fra digitale opgaver til analyse og kommunikation — vores brugere besidder bred viden og erfaring.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { title: "SoMe og contentplan", desc: "Instagram, LinkedIn, TikTok og redaktionelle planer" },
              { title: "Excel-modeller og budgetter", desc: "Finansielle modeller, forecast og rapportering" },
              { title: "Regnskabsanalyse", desc: "Gennemgang af regnskaber og nøgletal" },
              { title: "Research og markedsanalyse", desc: "Konkurrentanalyse, trends og markedsdata" },
              { title: "Kundeservice", desc: "Telefon, mail og chat support på deltid" },
              { title: "SEO", desc: "Søgeordsanalyse, on-page og teknisk SEO" },
            ].map((t) => (
              <div key={t.title}
                className="group bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-900 hover:shadow-lg transition-all cursor-pointer">
                <h4 className="font-bold text-sm text-gray-900 mb-1">{t.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/login"
              className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-900 transition-all">
              Se alle opgavetyper <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-24 px-5 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Priser</p>
            <h2 className="text-4xl font-black text-white">Simpel og transparent prissætning</h2>
          </div>

          {/* Company pricing */}
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">For virksomheder</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
            {[
              { name: "Startup", price: "500", employees: "1–10 medarbejdere", jobs: "Maks. 2 aktive jobopslag" },
              { name: "Small", price: "2.000", employees: "11–50 medarbejdere", jobs: "Maks. 5 aktive jobopslag" },
              { name: "Medium", price: "5.000", employees: "51–100 medarbejdere", jobs: "Maks. 10 aktive jobopslag" },
              { name: "Enterprise", price: "10.000", employees: "100+ medarbejdere", jobs: "Ubegrænsede jobopslag" },
            ].map((tier) => (
              <div key={tier.name} className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 transition-colors">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{tier.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-white">{tier.price}</span>
                  <span className="text-lg text-gray-400 mb-1">kr/md</span>
                </div>
                <p className="text-gray-500 text-sm mb-6">Pr. måned</p>
                <ul className="space-y-3 mb-8">
                  {[tier.employees, tier.jobs].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className="block text-center py-2.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
                  Kom i gang
                </Link>
              </div>
            ))}
          </div>

          {/* Student pricing */}
          <div className="border-t border-white/10 pt-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">For studerende</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bronze */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 transition-colors">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 mb-4">Bronze</span>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-white">0</span>
                  <span className="text-xl text-gray-400 mb-1.5">kr</span>
                </div>
                <p className="text-gray-500 text-sm mb-6">Altid gratis</p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Uddannelsesnavn og -sted",
                    "Maks. 3 kompetencer",
                    "1 fil/dokument upload (CV)",
                    "Maks. 5 timer/uge",
                    "Maks. 2 aktive opgaver",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-xs">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className="block text-center py-2.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
                  Kom i gang
                </Link>
              </div>

              {/* Silver */}
              <div className="bg-white rounded-2xl p-7 relative shadow-2xl shadow-black/30 scale-105">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/20 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Anbefalet
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 mb-4">Silver</span>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-gray-900">39</span>
                  <span className="text-xl text-gray-500 mb-1.5">kr/md</span>
                </div>
                <p className="text-gray-500 text-sm mb-6">Pr. måned</p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Uddannelsesnavn og -sted",
                    "Ubegrænsede kompetencer",
                    "3 fil/dokument uploads",
                    "Personlig bio",
                    "Maks. 10 timer/uge",
                    "Maks. 2 aktive opgaver",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center text-xs text-white">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className="block text-center py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                  Vælg Silver
                </Link>
              </div>

              {/* Gold */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 transition-colors">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 mb-4">Gold</span>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-white">79</span>
                  <span className="text-xl text-gray-400 mb-1.5">kr/md</span>
                </div>
                <p className="text-gray-500 text-sm mb-6">Pr. måned</p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Alt ubegrænset",
                    "Ubegrænsede kompetencer",
                    "Ubegrænsede fil/dokument uploads",
                    "Personlig bio",
                    "Ubegrænsede timer/uge",
                    "Maks. 2 aktive opgaver",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-xs">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className="block text-center py-2.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
                  Vælg Gold
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Proces</p>
            <h2 className="text-4xl font-black text-gray-900">Sådan virker det</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Opret din profil", body: "Beskriv dine kompetencer, tilgængelighed og timepris. Bliv fundet af virksomheder der søger præcis dét, du tilbyder." },
              { step: "02", title: "Find opgaver og jobs", body: "Søg blandt virksomheders opslag — alt fra kortsigtede opgaver på få timer til faste deltidsstillinger." },
              { step: "03", title: "Arbejd på dine præmisser", body: "Vælg om du vil arbejde på timebasis, projektbasis eller som fast deltidsansat." },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="bg-gray-50 rounded-2xl p-6 h-full border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="text-xs font-black text-gray-300 tracking-widest mb-4">{s.step}</div>
                  <h4 className="font-bold text-gray-900 mb-2">{s.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-7 py-3.5 text-sm font-bold hover:bg-gray-700 transition-colors">
              Opret konto gratis <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-5 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">FAQ</p>
            <h2 className="text-4xl font-black text-gray-900">Hyppige spørgsmål</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Er det gratis at oprette profil?",
                a: "Ja, det er helt gratis at oprette en profil — både som arbejdssøgende og virksomhed. Du vælger selv, om du vil opgradere til en betalt pakke for flere funktioner.",
              },
              {
                q: "Hvem kan bruge StudentMatch?",
                a: "Alle med ledig tid kan oprette profil — studerende, folk på sabbatår, deltidsansatte og andre. Det eneste krav er, at du har tid og kompetencer at tilbyde. Virksomheder af alle størrelser er velkomne — fra startups til etablerede selskaber.",
              },
              {
                q: "Hvad koster en studentermedhjælper?",
                a: "Gennemsnitstimeprisen ligger på 150–200 kr/t. Den konkrete pris aftales mellem virksomheden og den studerende og sættes af vores admin baseret på profil og kompetencer.",
              },
              {
                q: "Hvordan sikres betalingen?",
                a: "Alle betalinger håndteres sikkert via platformen. Vi udbetaler til den studerende, efter virksomheden har godkendt det udførte arbejde.",
              },
              {
                q: "Kan jeg ansætte fast på deltid?",
                a: "Absolut. Mange virksomheder starter med en kortere opgave og ansætter efterfølgende fast på deltid. Vi faciliterer begge former for samarbejde.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-sm text-gray-900">{item.q}</span>
                  <span className={`text-gray-400 text-lg font-light transition-transform duration-200 flex-shrink-0 ml-4 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-5 bg-gray-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-4">Klar til at komme i gang?</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Tilslut dig hundredvis af virksomheder og arbejdssøgende, der allerede bruger StudentMatch til at skabe værdifulde samarbejder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login"
              className="px-7 py-3.5 rounded-xl bg-white text-gray-900 text-sm font-bold hover:bg-gray-100 transition-colors">
              Opret gratis konto
            </Link>
            <Link href="/dashboard"
              className="px-7 py-3.5 rounded-xl border border-white/20 text-white text-sm font-bold hover:bg-white/10 transition-colors">
              Gå til dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-500 py-12 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">SM</span>
                </div>
                <span className="text-white font-bold">StudentMatch</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                Forbinder virksomheder med mennesker med ledig tid siden 2026.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-white font-semibold mb-3">Platform</p>
                <div className="space-y-2">
                  <a href="#ydelser" className="block hover:text-white transition-colors">Ydelser</a>
                  <a href="#how" className="block hover:text-white transition-colors">Sådan virker det</a>
                  <Link href="/login" className="block hover:text-white transition-colors">Log ind</Link>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Brugere</p>
                <div className="space-y-2">
                  <a href="#fordele" className="block hover:text-white transition-colors">Fordele</a>
                  <a href="#virksomheder" className="block hover:text-white transition-colors">Virksomheder</a>
                  <Link href="/dashboard" className="block hover:text-white transition-colors">Dashboard</Link>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Priser</p>
                <div className="space-y-2">
                  <span className="block">Startup — 500 kr/md</span>
                  <span className="block">Small — 2.000 kr/md</span>
                  <span className="block">Medium — 5.000 kr/md</span>
                  <span className="block">Enterprise — 10.000 kr/md</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>© {new Date().getFullYear()} StudentMatch. Alle rettigheder forbeholdes.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white transition-colors">Privatlivspolitik</a>
              <a href="#" className="hover:text-white transition-colors">Vilkår</a>
              <a href="#" className="hover:text-white transition-colors">Kontakt</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
