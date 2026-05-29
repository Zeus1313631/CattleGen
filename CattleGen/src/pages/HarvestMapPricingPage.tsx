import { useState } from "react";
import {
  Sprout,
  CheckCircle2,
  X,
  ArrowRight,
  Award,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Heart,
  ShoppingCart,
  Phone,
  Megaphone,
  Camera,
} from "lucide-react";

const TIERS = [
  { id: "founder", name: "Founder", tag: "Lifetime free · 87 spots left", price: { monthly: 0, yearly: 0 }, blurb: "Everything in Premium, free forever. For the first 100 ranches in your region.", cta: "Claim a founder spot", accent: true, isFounder: true },
  { id: "basic", name: "Basic", tag: "Free, forever", price: { monthly: 0, yearly: 0 }, blurb: "Get on the map. Receive customer contacts. No bells, no whistles.", cta: "Start free", accent: false, isFounder: false },
  { id: "premium", name: "Premium", tag: "After the founder spots fill", price: { monthly: 79, yearly: 790 }, blurb: "The full toolkit: ordering, ads, Concierge, featured placement.", cta: "Start 14-day trial", accent: false, isFounder: false },
];

const FEATURES = [
  { label: "Map listing & profile", basic: true, founder: true, premium: true },
  { label: "Direct customer contacts", basic: true, founder: true, premium: true },
  { label: "Photos", basic: "Up to 3", founder: "Unlimited", premium: "Unlimited" },
  { label: "Product listings", basic: "Up to 5", founder: "Unlimited", premium: "Unlimited" },
  { label: "Featured map placement + Premium badge", basic: false, founder: true, premium: true },
  { label: "Priority in category browse", basic: false, founder: true, premium: true },
  { label: "Ordering system (cart, checkout, pickup)", basic: false, founder: true, premium: true },
  { label: "Direct payment via your Stripe — no platform cut", basic: false, founder: true, premium: true },
  { label: "FB & Instagram ad templates", basic: false, founder: true, premium: true },
  { label: "Caption library + email templates", basic: false, founder: true, premium: true },
  { label: "Concierge calls (1-on-1 help)", basic: false, founder: "Monthly", premium: "Monthly" },
  { label: "Profile analytics & insights", basic: "Basic", founder: "Full", premium: "Full" },
  { label: "Compliance walkthroughs & support", basic: false, founder: true, premium: true },
  { label: "Customer reviews", basic: true, founder: true, premium: true },
];

const FAQS = [
  { q: "Does HarvestMap take a cut of my sales?", a: "No. Even when customers order through HarvestMap's built-in cart, the payment goes directly to your Stripe account. We never hold the money, never take a percentage, never charge per transaction. The only revenue HarvestMap makes from you is the subscription — and for founders, that's $0 forever." },
  { q: "What exactly does 'lifetime free Premium' for founders mean?", a: "If you're one of the first 100 ranches to list in your region, you get every Premium feature — ordering system, ad templates, monthly Concierge calls, featured placement, unlimited everything — for $0/month, for as long as you stay listed. No upsells, no expiration, no 'introductory' rate that quietly increases. We're paying you in features to help us build the map." },
  { q: "What's a 'Concierge call'?", a: "A 1-on-1 video or phone call with someone on the HarvestMap team — most of us have worked on real ranches or run small farms. We help with whatever's slowing you down: setting up your listing, taking better photos, picking the right USDA pathway, killing a Facebook ad that's burning your money, planning your harvest-season ordering. 30 minutes, free, monthly for Premium and Founders." },
  { q: "How does the ordering system work?", a: "Customers add your products to a cart on your HarvestMap profile, check out, and pay through Stripe (you connect your account during setup). You get notified, confirm the order, and schedule a pickup window. HarvestMap handles the technology — you handle the food. We never touch the money." },
  { q: "I already have a website / FB / Etsy store. Do I have to switch?", a: "No. HarvestMap works alongside everything else. Plenty of producers use their existing website for direct customers and HarvestMap for discovery. The ordering system is optional — you can also use HarvestMap just for the listing and direct people to your existing checkout." },
  { q: "Can I cancel anytime?", a: "Yes. Premium is month-to-month. Cancel from your dashboard and you keep features until the end of the billing period, then revert to a free Basic listing. We don't delete your profile, photos, or reviews. Founders never cancel because it's free — but you can deactivate your listing any time." },
  { q: "What if I'm a co-op or run multiple ranches?", a: "We have custom pricing for co-ops, regional networks of 10+ producers, and multi-location operations. Contact us — we'll work out what makes sense. Often it's cheaper per producer than individual Premium." },
  { q: "Why is HarvestMap doing this?", a: "Because we've lived it. The founder is a working rancher who burned through too much money on bad ads and clunky tools. We're building HarvestMap so ranches like ours can compete with grocery chains and Amazon without selling out to them. The first 100 ranches in each region are how we get there — they're not just customers, they're partners." },
];

function renderCell(value: boolean | string) {
  if (value === true) return <CheckCircle2 size={18} className="text-[#3d6b2c] mx-auto" strokeWidth={3} />;
  if (value === false) return <X size={18} className="text-[#4a3528]/50 mx-auto" />;
  return <span className="text-xs font-black text-[#1f3829]">{value}</span>;
}

export default function HarvestMapPricingPage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div
      className="min-h-screen w-full"
      style={{ fontFamily: "'Fraunces', Georgia, serif", background: "linear-gradient(180deg, #f7f1e3 0%, #ebe2cc 100%)" }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* NAV */}
      <header className="relative z-20 max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1f3829] flex items-center justify-center shadow-md">
            <Sprout size={22} className="text-[#d4a017]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl tracking-tight leading-none text-[#1f3829]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 900 }}>
              HARVEST<span className="text-[#b54a2a]">MAP</span>
            </h1>
            <p className="text-[9px] tracking-[0.3em] text-[#b54a2a] uppercase mt-1 font-black">Pricing</p>
          </div>
        </div>
        <button className="px-4 py-2.5 bg-[#1f3829] text-[#f7f1e3] rounded-full text-xs font-black tracking-widest uppercase hover:bg-[#2d4a36] shadow-md">
          List your ranch
        </button>
      </header>

      {/* HERO */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 pt-12 pb-12 text-center">
        <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase font-black px-3 py-1.5 rounded-full bg-[#d4a017] text-[#1f3829] shadow-md">
          <Sparkles size={12} />
          Founder spots: 87 of 100 remaining
        </span>
        <h1
          className="text-5xl md:text-7xl leading-[0.95] mt-5 text-[#1f3829]"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 900 }}
        >
          Built for <span className="italic font-light text-[#b54a2a]">producers,</span> priced for producers.
        </h1>
        <p className="text-lg text-[#1f3829] mt-5 leading-relaxed max-w-2xl mx-auto font-medium">
          Subscription only. Never a percentage of your sales. Your customers, your prices, your margin — every dollar stays with you.
        </p>
      </section>

      {/* TIERS */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 pb-16">
        <div className="grid md:grid-cols-3 gap-5">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={`p-7 rounded-2xl border-4 relative shadow-xl ${
                t.isFounder
                  ? "bg-gradient-to-br from-[#d4a017] to-[#b54a2a] text-[#1f3829] border-[#1f3829]"
                  : t.accent
                  ? "bg-[#1f3829] text-[#f7f1e3] border-[#d4a017]"
                  : "bg-[#f7f1e3] border-[#1f3829]"
              }`}
            >
              {t.isFounder && (
                <span className="absolute -top-3 right-6 px-3 py-1.5 bg-[#1f3829] text-[#d4a017] text-[10px] font-black tracking-widest uppercase rounded-full shadow-md flex items-center gap-1">
                  <Sparkles size={10} />
                  Best deal
                </span>
              )}
              <p
                className={`text-xs tracking-widest uppercase font-black ${
                  t.isFounder ? "text-[#1f3829]" : t.accent ? "text-[#d4a017]" : "text-[#4a3528]"
                }`}
              >
                {t.name}
              </p>
              <p
                className={`text-xs mt-1 font-bold ${
                  t.isFounder ? "text-[#1f3829]" : t.accent ? "text-[#ebe2cc]" : "text-[#4a3528]"
                }`}
              >
                {t.tag}
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span
                  className={`text-5xl ${t.isFounder || t.accent ? "" : "text-[#1f3829]"}`}
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 900 }}
                >
                  {t.price.monthly === 0 ? "$0" : `$${t.price.monthly}`}
                </span>
                <span
                  className={`text-sm font-bold ${
                    t.isFounder ? "text-[#1f3829]" : t.accent ? "text-[#ebe2cc]" : "text-[#4a3528]"
                  }`}
                >
                  {t.price.monthly === 0 ? "/forever" : "/month"}
                </span>
              </div>

              <p
                className={`text-sm mt-4 leading-relaxed font-medium ${
                  t.isFounder ? "text-[#1f3829]" : t.accent ? "text-[#ebe2cc]" : "text-[#1f3829]"
                }`}
              >
                {t.blurb}
              </p>

              <button
                className={`w-full mt-6 py-3 rounded-full text-xs font-black tracking-widest uppercase transition shadow-md ${
                  t.isFounder
                    ? "bg-[#1f3829] text-[#d4a017] hover:bg-[#2d4a36]"
                    : t.accent
                    ? "bg-[#d4a017] text-[#1f3829] hover:bg-[#e5b428]"
                    : "bg-[#1f3829] text-[#f7f1e3] hover:bg-[#2d4a36]"
                }`}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-3xl mx-auto p-5 rounded-xl bg-[#1f3829] text-[#f7f1e3] border-2 border-[#d4a017] shadow-md">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#d4a017] font-black mb-2">Why we're doing founder pricing</p>
          <p className="text-sm leading-relaxed text-[#ebe2cc]">
            A map is only useful if it's full. The first 100 ranches in your region take a leap of faith — listing before there's a big
            customer base. We're paying them back with lifetime free Premium. After 100, the offer closes and Premium becomes $79/month.{" "}
            <strong className="text-[#d4a017]">Once founder spots in your region fill, they don't come back.</strong>
          </p>
        </div>
      </section>

      {/* THE TOOLKIT */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.25em] uppercase text-[#4a3528] font-bold">What's actually in Premium</p>
          <h2 className="text-4xl md:text-5xl mt-2 text-[#1f3829]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 800 }}>
            Not a listing. <span className="italic font-light text-[#b54a2a]">A toolkit.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: ShoppingCart, title: "Ordering system", text: "Cart, checkout, pickup scheduling — direct payments to your Stripe." },
            { icon: Megaphone, title: "Ad templates", text: "FB & IG campaigns that have already worked for ranches near you." },
            { icon: Phone, title: "Concierge calls", text: "Monthly 1-on-1s with people who actually run ranches." },
            { icon: Camera, title: "Content library", text: "Photo guides, caption library, email templates — done for you." },
          ].map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="p-5 rounded-xl bg-[#f7f1e3] border-2 border-[#1f3829] text-center shadow-md">
                <div className="w-14 h-14 rounded-full bg-[#1f3829] flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Icon size={22} className="text-[#d4a017]" />
                </div>
                <h3 className="font-black text-[#1f3829]" style={{ fontFamily: "'Fraunces', serif" }}>
                  {b.title}
                </h3>
                <p className="text-xs text-[#4a3528] mt-2 leading-relaxed font-medium">{b.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURE COMPARISON */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.25em] uppercase text-[#4a3528] font-bold">Compare every feature</p>
          <h2 className="text-4xl md:text-5xl mt-2 text-[#1f3829]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 800 }}>
            Side <span className="italic font-light text-[#b54a2a]">by side</span>
          </h2>
        </div>

        <div className="rounded-2xl bg-[#f7f1e3] border-4 border-[#1f3829] overflow-hidden overflow-x-auto shadow-xl">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-[#1f3829] text-[#f7f1e3]">
                <th className="text-left p-4 font-black tracking-widest uppercase text-xs">Feature</th>
                <th className="p-4 font-black tracking-widest uppercase text-xs">Basic</th>
                <th className="p-4 font-black tracking-widest uppercase text-xs text-[#d4a017] bg-[#d4a017]/15">Founder</th>
                <th className="p-4 font-black tracking-widest uppercase text-xs">Premium</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[#ebe2cc]" : "bg-[#f7f1e3]"}>
                  <td className="p-4 font-bold text-[#1f3829]" style={{ fontFamily: "'Fraunces', serif" }}>
                    {f.label}
                  </td>
                  <td className="p-4 text-center">{renderCell(f.basic)}</td>
                  <td className="p-4 text-center bg-[#d4a017]/15">{renderCell(f.founder)}</td>
                  <td className="p-4 text-center">{renderCell(f.premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* BUSINESS MODEL */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.25em] uppercase text-[#4a3528] font-bold">How we make money</p>
          <h2 className="text-4xl md:text-5xl mt-2 text-[#1f3829]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 800 }}>
            Transparent <span className="italic font-light text-[#b54a2a]">on purpose</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-[#1f3829] text-[#f7f1e3] shadow-lg border-2 border-[#1f3829]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg bg-[#3d6b2c] flex items-center justify-center border-2 border-[#f7f1e3]">
                <CheckCircle2 size={22} className="text-[#f7f1e3]" />
              </div>
              <h3 className="text-xl text-[#f7f1e3]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 800 }}>
                What we do
              </h3>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "Charge Premium subscriptions ($79/mo after founder spots fill)",
                "Charge for special events: Concierge intensives, photo days, regional sponsorships",
                "Sell branded merch (hats, totes) at cost-plus to help with marketing",
                "Reinvest most of it into engineering, trust & safety, and bringing customers to the map",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[#ebe2cc] leading-relaxed">
                  <span className="text-[#d4a017] flex-shrink-0 font-black">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-[#b54a2a] text-[#f7f1e3] shadow-lg border-2 border-[#1f3829]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg bg-[#1f3829] flex items-center justify-center border-2 border-[#f7f1e3]">
                <X size={22} className="text-[#d4a017]" />
              </div>
              <h3 className="text-xl text-[#f7f1e3]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 800 }}>
                What we never do
              </h3>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "Take a percentage of your sales — even when customers order through our cart",
                "Hold or process the customer's payment — Stripe pays you directly",
                "Sell your customer list, contact data, or analytics to anyone",
                "Let big aggregators or wholesalers list — producer-only, no exceptions",
                "Push customers toward big-box partners or 'similar' competing products",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[#f7f1e3] leading-relaxed">
                  <span className="flex-shrink-0 font-black">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 py-20">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.25em] uppercase text-[#4a3528] font-bold">Questions</p>
          <h2 className="text-4xl md:text-5xl mt-2 text-[#1f3829]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 800 }}>
            <span className="italic font-light text-[#b54a2a]">Honestly</span> answered
          </h2>
        </div>

        <div className="space-y-2">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="rounded-xl bg-[#f7f1e3] border-2 border-[#1f3829] overflow-hidden shadow-md">
                <button
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  className="w-full p-5 flex items-center gap-3 text-left hover:bg-[#ebe2cc] transition"
                >
                  <span className="flex-1 font-black text-[#1f3829]" style={{ fontFamily: "'Fraunces', serif" }}>
                    {f.q}
                  </span>
                  {open ? (
                    <ChevronDown size={20} className="text-[#1f3829] flex-shrink-0" />
                  ) : (
                    <ChevronRight size={20} className="text-[#1f3829] flex-shrink-0" />
                  )}
                </button>
                {open && (
                  <div className="px-5 pb-5 pt-1 text-sm text-[#1f3829] leading-relaxed border-t-2 border-[#1f3829]/15 bg-[#ebe2cc] font-medium">
                    <p className="pt-3">{f.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 py-20 text-center">
        <h2
          className="text-5xl md:text-6xl text-[#1f3829] leading-[0.95]"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 900 }}
        >
          87 of 100 founder spots <span className="italic font-light text-[#b54a2a]">remain.</span>
        </h2>
        <p className="text-[#1f3829] mt-5 max-w-xl mx-auto font-medium">
          Once they're gone, they're gone. Premium becomes $79/month — for everyone else.
        </p>
        <button className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-[#1f3829] text-[#f7f1e3] rounded-full text-sm font-black tracking-widest uppercase hover:bg-[#2d4a36] shadow-lg">
          Claim a founder spot
          <ArrowRight size={16} />
        </button>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-[#1f3829] text-[#f7f1e3] mt-12 border-t-4 border-[#d4a017]">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#d4a017] flex items-center justify-center">
              <Sprout size={16} className="text-[#1f3829]" strokeWidth={2.5} />
            </div>
            <span className="text-sm text-[#ebe2cc] font-bold">© 2026 HarvestMap</span>
          </div>
          <div className="flex gap-5 text-xs text-[#ebe2cc] font-bold">
            {["Standards", "Pricing", "Terms", "Privacy", "Contact"].map((l) => (
              <a key={l} className="hover:text-[#d4a017] cursor-pointer">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
