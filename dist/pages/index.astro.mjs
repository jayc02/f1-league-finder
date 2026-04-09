import { c as createComponent, m as maybeRenderHead, a as addAttribute, r as renderTemplate, b as renderComponent, d as renderHead, e as renderSlot, f as createAstro } from '../chunks/astro/server_D0v6wMEY.mjs';
import 'piccolore';
import 'html-escaper';
/* empty css                                 */
import { jsx, jsxs } from 'react/jsx-runtime';
import { useRef, useEffect, useState, useMemo } from 'react';
import 'clsx';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
export { renderers } from '../renderers.mjs';

const navItems = [
  { label: "Slots", href: "#slots" },
  { label: "System", href: "#how" },
  { label: "Leaderboards", href: "#leaderboards" },
  { label: "Organisers", href: "#organisers" }
];
const raceSlots = [
  {
    event: "Bahrain Night Sprint",
    startsAt: "2026-04-11T20:30:00Z",
    platform: "Crossplay",
    region: "EU-West",
    assists: "Restricted",
    tier: "Apex Tier"
  },
  {
    event: "Imola Precision Cup",
    startsAt: "2026-04-12T18:00:00Z",
    platform: "PC / Console",
    region: "NA-East",
    assists: "No Line",
    tier: "Elite Tier"
  },
  {
    event: "Suzuka Endurance Grid",
    startsAt: "2026-04-13T19:30:00Z",
    platform: "Crossplay",
    region: "APAC",
    assists: "Simulation",
    tier: "Pro Tier"
  }
];
const leaderboardData = {
  global: [
    { rank: 1, name: "L. Marchetti", points: 2461, move: "+2", honour: 97 },
    { rank: 2, name: "S. Ortega", points: 2424, move: "—", honour: 96 },
    { rank: 3, name: "J. Haldane", points: 2368, move: "-1", honour: 92 },
    { rank: 4, name: "A. Morrow", points: 2310, move: "+4", honour: 99 }
  ],
  clean: [
    { rank: 1, name: "R. Vann", points: 1988, move: "+1", honour: 100 },
    { rank: 2, name: "D. Carlsen", points: 1932, move: "+1", honour: 99 },
    { rank: 3, name: "Y. Faber", points: 1904, move: "-2", honour: 98 },
    { rank: 4, name: "M. Rossi", points: 1840, move: "+3", honour: 98 }
  ],
  organisers: [
    { rank: 1, name: "RaceControl One", points: 878, move: "+1", honour: 98 },
    { rank: 2, name: "Steward Collective", points: 860, move: "—", honour: 97 },
    { rank: 3, name: "Grid Authority", points: 844, move: "+2", honour: 95 },
    { rank: 4, name: "Grand Prix Office", points: 810, move: "-1", honour: 96 }
  ],
  weekly: [
    { rank: 1, name: "N. Takeda", points: 188, move: "+12", honour: 95 },
    { rank: 2, name: "K. Linden", points: 172, move: "+9", honour: 92 },
    { rank: 3, name: "P. Duarte", points: 167, move: "+8", honour: 96 },
    { rank: 4, name: "V. Sato", points: 159, move: "+7", honour: 94 }
  ]
};
const features = [
  "Scheduled race slots",
  "Lobby standardisation",
  "Stewarding records",
  "Honour rating",
  "Global leaderboards",
  "Organiser toolset",
  "Crossplay-ready flow"
];

function MagneticButton({ children, href = "#", variant = "solid" }) {
  const ref = useRef(null);
  const move = (e) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    node.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };
  const classes = variant === "solid" ? "bg-white text-black hover:bg-slate-200" : "border border-white/20 bg-white/5 text-white hover:bg-white/10";
  return /* @__PURE__ */ jsx(
    "a",
    {
      ref,
      href,
      onMouseMove: move,
      onMouseLeave: reset,
      className: `magnetic inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold tracking-wide transition duration-300 ${classes}`,
      children
    }
  );
}

const $$SiteHeader = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<header class="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/30 backdrop-blur-xl" data-header> <div class="mx-auto flex w-[min(1280px,94vw)] items-center justify-between py-4"> <a href="#" class="font-display text-lg tracking-[0.24em] text-white">GRID//ONE</a> <nav class="hidden gap-7 text-sm text-slate-300 md:flex"> ${navItems.map((item) => renderTemplate`<a${addAttribute(item.href, "href")} class="transition hover:text-white">${item.label}</a>`)} </nav> ${renderComponent($$result, "MagneticButton", MagneticButton, { "client:load": true, "href": "#final-cta", "variant": "ghost", "client:component-hydration": "load", "client:component-path": "D:/Jayveer/Documents/websites/F1-Site/src/components/ui/MagneticButton", "client:component-export": "default" }, { "default": ($$result2) => renderTemplate`Request Access` })} </div> </header>`;
}, "D:/Jayveer/Documents/websites/F1-Site/src/components/layout/SiteHeader.astro", void 0);

const $$SiteFooter = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<footer class="border-t border-white/10 py-10"> <div class="mx-auto flex w-[min(1200px,92vw)] flex-col gap-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between"> <p>© 2026 GRID//ONE. Competitive race operations for serious drivers.</p> <p>Ranked. Rated. Respected.</p> </div> </footer>`;
}, "D:/Jayveer/Documents/websites/F1-Site/src/components/layout/SiteFooter.astro", void 0);

gsap.registerPlugin(ScrollTrigger);
function PageMotion() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis = null;
    if (!reduced) {
      lenis = new Lenis({ smoothWheel: true });
      const raf = (time) => {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
    gsap.from("[data-hero-word]", {
      yPercent: 105,
      opacity: 0,
      duration: 1,
      stagger: 0.08,
      ease: "power3.out",
      delay: 0.25
    });
    gsap.utils.toArray("[data-reveal]").forEach((item) => {
      gsap.from(item, {
        y: 36,
        opacity: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: item, start: "top 85%" }
      });
    });
    const header = document.querySelector("[data-header]");
    if (header) {
      ScrollTrigger.create({
        start: 20,
        end: 99999,
        onUpdate: (self) => {
          header.style.transform = self.direction === 1 ? "translateY(-100%)" : "translateY(0)";
        }
      });
    }
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      lenis?.destroy();
    };
  }, []);
  return null;
}

function CursorGlow() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const glow = document.createElement("div");
    glow.className = "fixed pointer-events-none z-20 h-80 w-80 rounded-full";
    glow.style.background = "radial-gradient(circle, rgba(165,178,203,0.17), transparent 68%)";
    glow.style.transform = "translate(-50%, -50%)";
    document.body.appendChild(glow);
    const move = (e) => {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      glow.remove();
    };
  }, []);
  return null;
}

const $$Astro = createAstro();
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title = "GRID//ONE | Competitive F1 League Platform" } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description" content="Premium platform for organised F1 race slots, honour-driven rankings, and league operations."><title>${title}</title>${renderHead()}</head> <body> ${renderComponent($$result, "CursorGlow", CursorGlow, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/ui/CursorGlow", "client:component-export": "default" })} ${renderComponent($$result, "PageMotion", PageMotion, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/motion/PageMotion", "client:component-export": "default" })} ${renderComponent($$result, "SiteHeader", $$SiteHeader, {})} <main> ${renderSlot($$result, $$slots["default"])} </main> ${renderComponent($$result, "SiteFooter", $$SiteFooter, {})} </body></html>`;
}, "D:/Jayveer/Documents/websites/F1-Site/src/layouts/BaseLayout.astro", void 0);

function CountUpStat({ value, suffix = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const data = { v: 0 };
    gsap.to(data, {
      v: value,
      duration: 1.4,
      ease: "power3.out",
      onUpdate: () => {
        node.textContent = `${Math.floor(data.v).toLocaleString()}${suffix}`;
      }
    });
  }, [value, suffix]);
  return /* @__PURE__ */ jsx("span", { ref, children: "0" });
}

const words = ["Race for position.", "Earn your place.", "Ranked. Rated. Respected."];
function HeroScene() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    const setSize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    const draw = () => {
      t += 8e-3;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) {
        const y = h * 0.2 + i * 26;
        const shift = Math.sin(t + i * 0.25) * 80;
        ctx.strokeStyle = `rgba(198,210,231,${0.04 + i * 25e-4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-40, y + shift);
        ctx.bezierCurveTo(w * 0.35, y - 40, w * 0.6, y + 60, w + 40, y + shift * 0.6);
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    setSize();
    draw();
    window.addEventListener("resize", setSize);
    return () => {
      window.removeEventListener("resize", setSize);
      cancelAnimationFrame(raf);
    };
  }, []);
  return /* @__PURE__ */ jsxs("section", { className: "relative min-h-screen overflow-hidden pt-28", id: "top", children: [
    /* @__PURE__ */ jsx("canvas", { ref: canvasRef, className: "absolute inset-0 opacity-80", "aria-hidden": "true" }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(181,31,47,.2),transparent_42%)]" }),
    /* @__PURE__ */ jsxs("div", { className: "section-shell relative z-10 grid min-h-[78vh] content-end gap-10 pb-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsx("p", { className: "max-w-fit border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300", children: "Competitive F1 Operations Platform" }),
        /* @__PURE__ */ jsx("h1", { className: "font-display text-5xl leading-[0.94] text-white md:text-7xl lg:text-8xl", children: words.map((word) => /* @__PURE__ */ jsx("span", { className: "block overflow-hidden", children: /* @__PURE__ */ jsx("span", { "data-hero-word": true, className: "block", children: word }) }, word)) }),
        /* @__PURE__ */ jsx("p", { className: "max-w-2xl text-lg text-slate-300 md:text-xl", children: "Structured race slots, verified stewarding, and honour-based progression for drivers and organisers building serious competitive lobbies." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
        /* @__PURE__ */ jsx(MagneticButton, { href: "#slots", variant: "solid", children: "Enter Race Calendar" }),
        /* @__PURE__ */ jsx(MagneticButton, { href: "#how", variant: "ghost", children: "How the system works" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-3", children: [
        ["Active drivers", 12840],
        ["Verified leagues", 312],
        ["Clean race ratio", 94]
      ].map(([label, value], idx) => /* @__PURE__ */ jsxs("div", { className: "panel rounded-2xl p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-slate-400", children: label }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 font-display text-4xl text-white", children: /* @__PURE__ */ jsx(CountUpStat, { value: Number(value), suffix: idx === 2 ? "%" : "" }) })
      ] }, label)) })
    ] })
  ] });
}

const formatTimeLeft = (deltaMs) => {
  const totalSeconds = Math.max(0, Math.floor(deltaMs / 1e3));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds % 86400 / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

function SlotShowcase() {
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(timer);
  }, []);
  const slot = raceSlots[index];
  const time = formatTimeLeft(new Date(slot.startsAt).getTime() - now);
  return /* @__PURE__ */ jsxs("section", { id: "slots", className: "section-shell", "data-reveal": true, children: [
    /* @__PURE__ */ jsx("div", { className: "mb-8 flex items-end justify-between gap-4", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.25em] text-slate-400", children: "Upcoming race slots" }),
      /* @__PURE__ */ jsx("h2", { className: "section-title mt-2", children: "Grid-ready sessions with verified standards." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-[1fr_360px]", children: [
      /* @__PURE__ */ jsxs("article", { className: "panel rounded-3xl p-8", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-slate-400", children: slot.tier }),
        /* @__PURE__ */ jsx("h3", { className: "mt-2 font-display text-4xl text-white", children: slot.event }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-2 gap-3 text-sm text-slate-300 md:grid-cols-4", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Platform" }),
            slot.platform
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Region" }),
            slot.region
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Assists" }),
            slot.assists
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Starts" }),
            new Date(slot.startsAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 flex gap-3 text-center", children: Object.entries(time).map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "min-w-20 rounded-xl border border-white/15 bg-black/30 px-3 py-3", children: [
          /* @__PURE__ */ jsx("p", { className: "font-display text-3xl", children: String(v).padStart(2, "0") }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.2em] text-slate-400", children: k })
        ] }, k)) })
      ] }),
      /* @__PURE__ */ jsx("aside", { className: "space-y-3", children: raceSlots.map((entry, i) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setIndex(i),
          className: `panel w-full rounded-2xl p-4 text-left transition ${index === i ? "border-redline bg-redline/10" : "hover:-translate-y-1"}`,
          children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-slate-400", children: entry.region }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 font-semibold text-white", children: entry.event })
          ]
        },
        entry.event
      )) })
    ] })
  ] });
}

gsap.registerPlugin(ScrollTrigger);
const steps = [
  { title: "Choose a slot", copy: "Select a region, tier, and assist profile aligned with your pace and setup." },
  { title: "Race under standards", copy: "Every lobby uses verified settings and stewarding rules so outcomes stay credible." },
  { title: "Score and honour update", copy: "Performance and conduct both feed your profile with transparent adjustments." },
  { title: "Unlock stronger grids", copy: "Higher ratings open premium events, organiser invites, and better-ranked sessions." }
];
function HowItWorksTimeline() {
  const wrapRef = useRef(null);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const track = wrap.querySelector("[data-track]");
    if (!track) return;
    gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth + 80),
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top top",
        end: () => `+=${track.scrollWidth}`,
        pin: true,
        scrub: 1
      }
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);
  return /* @__PURE__ */ jsx("section", { id: "how", ref: wrapRef, className: "relative h-[110vh] overflow-hidden border-y border-white/10 bg-black/30", "data-reveal": true, children: /* @__PURE__ */ jsx("div", { className: "flex h-full items-center gap-8 px-[6vw]", "data-track": true, children: steps.map((step, i) => /* @__PURE__ */ jsxs("article", { className: "panel w-[80vw] max-w-[540px] flex-none rounded-3xl p-10 md:w-[48vw]", children: [
    /* @__PURE__ */ jsxs("p", { className: "text-xs uppercase tracking-[0.25em] text-slate-500", children: [
      "Step ",
      i + 1
    ] }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-4xl text-white", children: step.title }),
    /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg text-slate-300", children: step.copy })
  ] }, step.title)) }) });
}

const tabs = [
  { key: "global", label: "Global" },
  { key: "clean", label: "Clean Drivers" },
  { key: "organisers", label: "Top Organisers" },
  { key: "weekly", label: "Weekly Movers" }
];
function LeaderboardPreview() {
  const [tab, setTab] = useState("global");
  const rows = useMemo(() => leaderboardData[tab], [tab]);
  return /* @__PURE__ */ jsxs("section", { id: "leaderboards", className: "section-shell", "data-reveal": true, children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.25em] text-slate-400", children: "Leaderboards" }),
    /* @__PURE__ */ jsx("h2", { className: "section-title mt-3", children: "Competition visibility, with conduct in plain sight." }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 flex flex-wrap gap-2", children: tabs.map((item) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setTab(item.key),
        className: `rounded-full px-5 py-2 text-sm transition ${item.key === tab ? "bg-white text-black" : "border border-white/20 text-slate-300 hover:bg-white/10"}`,
        children: item.label
      },
      item.key
    )) }),
    /* @__PURE__ */ jsx("div", { className: "panel mt-6 overflow-hidden rounded-3xl", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-white/5 text-slate-400", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-5 py-3 text-left", children: "Rank" }),
        /* @__PURE__ */ jsx("th", { className: "text-left", children: "Name" }),
        /* @__PURE__ */ jsx("th", { className: "text-left", children: "Points" }),
        /* @__PURE__ */ jsx("th", { className: "text-left", children: "Move" }),
        /* @__PURE__ */ jsx("th", { className: "text-left", children: "Honour" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: rows.map((row) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-white/10 transition hover:bg-white/5", children: [
        /* @__PURE__ */ jsx("td", { className: "px-5 py-4 font-display text-xl text-white", children: row.rank }),
        /* @__PURE__ */ jsx("td", { children: row.name }),
        /* @__PURE__ */ jsx("td", { children: row.points.toLocaleString() }),
        /* @__PURE__ */ jsx("td", { className: row.move.startsWith("+") ? "text-emerald-300" : row.move.startsWith("-") ? "text-rose-300" : "text-slate-300", children: row.move }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("div", { className: "h-2 w-24 rounded-full bg-white/10", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-slate-300 to-white", style: { width: `${row.honour}%` } }) }) })
      ] }, row.name)) })
    ] }) })
  ] });
}

function HonourSystem() {
  const [score, setScore] = useState(84);
  useEffect(() => {
    const timer = setInterval(() => {
      setScore((v) => v >= 98 ? 84 : v + 1);
    }, 220);
    return () => clearInterval(timer);
  }, []);
  return /* @__PURE__ */ jsx("section", { className: "section-shell", "data-reveal": true, children: /* @__PURE__ */ jsxs("div", { className: "grid items-center gap-8 lg:grid-cols-2", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.25em] text-slate-400", children: "Honour System" }),
      /* @__PURE__ */ jsx("h2", { className: "section-title mt-3", children: "Fast is respected. Clean is rewarded." }),
      /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg text-slate-300", children: "The honour model monitors incident history, steward confirmations, and racecraft behaviour. Better conduct unlocks premier grids and organiser trust." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel rounded-3xl p-8", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-slate-400", children: "Live conduct index" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 font-display text-7xl text-white", children: score }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 h-3 rounded-full bg-white/10", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-redline via-orange-200 to-emerald-300 transition-all duration-300", style: { width: `${score}%` } }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-3 gap-3 text-xs text-slate-300", children: [
        /* @__PURE__ */ jsx("p", { className: "rounded-xl border border-white/10 p-3", children: "Incident-free laps: +2" }),
        /* @__PURE__ */ jsx("p", { className: "rounded-xl border border-white/10 p-3", children: "Penalty upheld: -4" }),
        /* @__PURE__ */ jsx("p", { className: "rounded-xl border border-white/10 p-3", children: "Steward commendation: +3" })
      ] })
    ] })
  ] }) });
}

const $$OrganiserShowcase = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section id="organisers" class="section-shell" data-reveal> <p class="text-xs uppercase tracking-[0.25em] text-slate-400">For organisers and leagues</p> <h2 class="section-title mt-3">Operate premium race programs with less overhead.</h2> <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"> ${[
    ["Slot control", "Open, tier, and region templates with one command panel."],
    ["Results integrity", "Post-race logs, protest windows, and finalised standings."],
    ["Roster quality", "Filter by honour score to protect lobby standards."],
    ["Visibility boost", "Feature leagues in curated discovery streams."]
  ].map(([title, text]) => renderTemplate`<article class="panel rounded-2xl p-6 transition hover:-translate-y-2"> <h3 class="font-display text-2xl text-white">${title}</h3> <p class="mt-3 text-slate-300">${text}</p> </article>`)} </div> </section>`;
}, "D:/Jayveer/Documents/websites/F1-Site/src/components/sections/OrganiserShowcase.astro", void 0);

function FeatureStrip() {
  const repeated = [...features, ...features];
  return /* @__PURE__ */ jsxs("section", { className: "overflow-hidden border-y border-white/10 bg-white/[0.03] py-7", "data-reveal": true, children: [
    /* @__PURE__ */ jsx("div", { className: "animate-[marquee_26s_linear_infinite] whitespace-nowrap", children: repeated.map((item, idx) => /* @__PURE__ */ jsxs("span", { className: "mx-6 inline-flex items-center text-sm uppercase tracking-[0.18em] text-slate-300", children: [
      /* @__PURE__ */ jsx("span", { className: "mr-6 text-redline", children: "●" }),
      item
    ] }, `${item}-${idx}`)) }),
    /* @__PURE__ */ jsx("style", { children: `@keyframes marquee { from {transform: translateX(0)} to {transform: translateX(-50%)} }` })
  ] });
}

const $$FinalCTA = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section id="final-cta" class="section-shell" data-reveal> <div class="panel rounded-[2rem] border-white/20 bg-gradient-to-br from-white/10 to-white/[0.02] p-10 text-center md:p-16"> <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Join the grid infrastructure</p> <h2 class="mx-auto mt-4 max-w-3xl font-display text-4xl leading-tight text-white md:text-6xl">Build your race identity in a platform that rewards pace and discipline.</h2> <p class="mx-auto mt-5 max-w-xl text-slate-300">Apply as a driver, launch your own league, or partner as an organiser.</p> <div class="mt-8 flex justify-center gap-3"> <a class="rounded-full bg-white px-7 py-3 text-sm font-semibold tracking-wide text-black" href="#">Get Priority Access</a> <a class="rounded-full border border-white/20 px-7 py-3 text-sm font-semibold tracking-wide text-white" href="#">Create organiser profile</a> </div> </div> </section>`;
}, "D:/Jayveer/Documents/websites/F1-Site/src/components/sections/FinalCTA.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "HeroScene", HeroScene, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/sections/HeroScene", "client:component-export": "default" })} ${renderComponent($$result2, "SlotShowcase", SlotShowcase, { "client:idle": true, "client:component-hydration": "idle", "client:component-path": "@/components/sections/SlotShowcase", "client:component-export": "default" })} ${renderComponent($$result2, "HowItWorksTimeline", HowItWorksTimeline, { "client:visible": true, "client:component-hydration": "visible", "client:component-path": "@/components/sections/HowItWorksTimeline", "client:component-export": "default" })} ${renderComponent($$result2, "LeaderboardPreview", LeaderboardPreview, { "client:visible": true, "client:component-hydration": "visible", "client:component-path": "@/components/sections/LeaderboardPreview", "client:component-export": "default" })} ${renderComponent($$result2, "HonourSystem", HonourSystem, { "client:visible": true, "client:component-hydration": "visible", "client:component-path": "@/components/sections/HonourSystem", "client:component-export": "default" })} ${renderComponent($$result2, "OrganiserShowcase", $$OrganiserShowcase, {})} ${renderComponent($$result2, "FeatureStrip", FeatureStrip, { "client:visible": true, "client:component-hydration": "visible", "client:component-path": "@/components/sections/FeatureStrip", "client:component-export": "default" })} ${renderComponent($$result2, "FinalCTA", $$FinalCTA, {})} ` })}`;
}, "D:/Jayveer/Documents/websites/F1-Site/src/pages/index.astro", void 0);

const $$file = "D:/Jayveer/Documents/websites/F1-Site/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
