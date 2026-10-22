import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFoodItems } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import TalkToSalesDialog from "../components/sales/TalkToSalesDialog";
import "./Landing.css";

/* --------------------------------------------------------------------------
   Content is drawn from the project deck: "AR Automated Dining",
   Project Phase I / 20AIPJ701.
   -------------------------------------------------------------------------- */

const FALLBACK_DISHES = [
  {
    _id: "demo-1",
    name: "Saffron Butter Chicken",
    category: "Indian",
    price: 429,
    description: "Slow-simmered in cream, fenugreek, and smoked paprika.",
    imageUrl:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80",
    modelUrl: true,
  },
  {
    _id: "demo-2",
    name: "Charcoal Tandoori Platter",
    category: "Tandoori",
    price: 549,
    description: "Four cuts, clay-oven char, and mint yogurt.",
    imageUrl:
      "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=900&q=80",
    modelUrl: true,
  },
  {
    _id: "demo-3",
    name: "Hyderabadi Dum Biryani",
    category: "Biryani",
    price: 389,
    description: "Layered basmati, saffron steam, and crisp fried onions.",
    imageUrl:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=80",
  },
  {
    _id: "demo-4",
    name: "Crisp Lotus Starters",
    category: "Starters",
    price: 249,
    description: "Sesame glaze, chilli oil, and lime leaf salt.",
    imageUrl:
      "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80",
  },
  {
    _id: "demo-5",
    name: "Royal Thali",
    category: "Special Platter",
    price: 699,
    description: "A tasting sequence of house curries, breads, and pickle.",
    imageUrl:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80",
    modelUrl: true,
  },
  {
    _id: "demo-6",
    name: "Molten Cardamom Cake",
    category: "Desserts",
    price: 219,
    description: "Warm center, pistachio crumb, and rose cream.",
    imageUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
  },
];

/* Abstract, deck pages 4–5: scan → browse → customize → kitchen → service */
const FLOW = [
  {
    n: "01",
    title: "Scan",
    copy: "A QR at the table opens the menu in the browser — the table number travels with every order.",
  },
  {
    n: "02",
    title: "Browse in 3D",
    copy: "Every dish is a model, not a photo. Rotate it, place it on the table, judge the portion.",
  },
  {
    n: "03",
    title: "Customise",
    copy: "Spice, jain, no-onion, allergens — captured as structured data, not a scribble.",
  },
  {
    n: "04",
    title: "Kitchen",
    copy: "The chef screen receives the ticket instantly and tracks it through preparing → ready.",
  },
  {
    n: "05",
    title: "Serve",
    copy: "Waitstaff get the ready alert with the table number. Right dish, right table, first time.",
  },
];

const PORTALS = [
  {
    icon: "🍽",
    tone: "",
    title: "Guest",
    points: [
      "AR menu & 3D viewer",
      "Cart, customisation, live status",
      "Climate label on every dish",
      "E-receipt with GST",
    ],
    cta: "Launch Guest Demo",
    path: "/customer/home",
  },
  {
    icon: "👨‍🍳",
    tone: "is-saffron",
    title: "Kitchen",
    points: [
      "Live ticket board by table",
      "Preparing → ready in one tap",
      "Allergen flags front and centre",
      "Sound + toast notifications",
    ],
    cta: "Launch Kitchen Demo",
    path: "/chef/dashboard",
  },
  {
    icon: "📊",
    tone: "is-basil",
    title: "Admin",
    points: [
      "Live revenue & GST dashboard",
      "Orders as tiles, not a list",
      "Printable e-receipts (PDF)",
      "Menu, models and staff",
    ],
    cta: "Launch Admin Demo",
    path: "/admin/dashboard",
  },
];

/* Software plans and hardware kits, as priced in the business model deck
   (pages 10 and 11). Both are sold per outlet and both are customizable. */
const PLANS = [
  {
    name: "Basic",
    for: "A single café or QSR putting its menu in 3D.",
    price: "₹799",
    features: [
      ["", "14-day free trial"],
      ["QR-based AR menu"],
      ["Order management"],
      ["Review system"],
      ["Sales analytics"],
      ["Inventory management"],
      ["Up to ", "50 items"],
      ["Single outlet, ", "unlimited users"],
    ],
    note: "Setup ₹150 per dish for 3D modelling",
    cta: "Talk to Sales",
    featured: false,
  },
  {
    name: "Standard",
    for: "A full-service restaurant running a live kitchen.",
    price: "₹1,499",
    features: [
      ["", "14-day free trial"],
      ["Everything in Basic"],
      ["Up to ", "200 items"],
      ["Food customization"],
      ["Up to ", "3 outlets"],
      ["", "Unlimited users"],
    ],
    note: "Setup waived above 20 dishes",
    cta: "Talk to Sales",
    featured: true,
  },
  {
    name: "Pro",
    for: "Multi-outlet brands and franchises.",
    price: "₹2,499",
    features: [
      ["", "14-day free trial"],
      ["Everything in Standard"],
      ["", "Unlimited", " food items"],
      ["AI insights, forecasting & performance analytics"],
      ["", "Unlimited", " outlets"],
      ["", "Unlimited users"],
    ],
    note: "Onboarding and training included",
    cta: "Talk to Sales",
    featured: false,
  },
];

/* The kit, bought once. The capture kit is the same on every tier — it is
   what turns a dish on your own table into a model — so what changes up the
   tiers is the printer and the screen the kitchen reads from. */
const HARDWARE = [
  {
    name: "Basic",
    for: "One counter, one screen.",
    total: "₹10,199",
    parts: [
      { name: "Capture kit", price: "₹2,000", spec: "motorised turntable, phone stand, LED lights" },
      { name: "Thermal / KOT printer", price: "₹2,200", spec: "58 mm, USB / Bluetooth" },
      { name: "Kitchen display", price: "₹5,999", spec: "10–11 inch HD, 3 GB RAM, Wi-Fi" },
    ],
    featured: false,
  },
  {
    name: "Standard",
    for: "A kitchen working off the board all service.",
    total: "₹15,799",
    parts: [
      { name: "Capture kit", price: "₹2,000", spec: "motorised turntable, phone stand, LED lights" },
      { name: "Thermal / KOT printer", price: "₹4,300", spec: "80 mm, USB / LAN / Bluetooth" },
      { name: "Kitchen display", price: "₹9,499", spec: "15.6 inch HD, 4 GB RAM, Wi-Fi / LAN" },
    ],
    featured: true,
  },
  {
    name: "Pro",
    for: "High volume, and a screen the whole pass can read.",
    total: "₹24,799",
    parts: [
      { name: "Capture kit", price: "₹2,000", spec: "motorised turntable, phone stand, LED lights" },
      { name: "Thermal / KOT printer", price: "₹6,800", spec: "80 mm auto-cutter, multi-interface" },
      { name: "Kitchen display", price: "₹12,499", spec: "21.5–22 inch HD, 8 GB RAM, LAN / Wi-Fi" },
    ],
    featured: false,
  },
];

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 14.3A8.2 8.2 0 1 1 9.7 4a6.6 6.6 0 0 0 10.3 10.3Z" />
  </svg>
);

const BrandMark = () => (
  <span className="ad-brand-mark">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </svg>
  </span>
);

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { toggleTheme, isDark } = useThemeMode();

  const [foodItems, setFoodItems] = useState([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await getFoodItems();
        const items = response.data?.foodItems || [];
        if (active && items.length) setFoodItems(items);
      } catch (error) {
        console.warn("Landing menu falling back to featured dishes.", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  /* Reveal-on-scroll for section blocks */
  useEffect(() => {
    const nodes = document.querySelectorAll(".ad-reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [loading]);

  const source = foodItems.length ? foodItems : FALLBACK_DISHES;

  const categories = useMemo(() => {
    const unique = Array.from(new Set(source.map((item) => item.category).filter(Boolean)));
    return ["All", ...unique];
  }, [source]);

  const visibleDishes = source
    .filter((item) => category === "All" || item.category === category)
    .slice(0, 6);

  const dashboardPath = isAdmin
    ? "/admin/dashboard"
    : user?.role === "chef"
      ? "/chef/dashboard"
      : "/customer/home";

  const goOrder = () => {
    navigate(isAuthenticated ? dashboardPath : "/login");
  };


  return (
    <div className="ad">
      {/* ---------------------------------------------------------------- nav */}
      <header className={`ad-nav ${scrolled ? "is-scrolled" : ""}`}>
        <div className="ad-nav-inner ad-wrap">
          <a className="ad-brand" href="#top">
            <BrandMark />
            <span className="ad-brand-text">
              <b>AR Automated Dining</b>
              <small>20AIPJ701</small>
            </span>
          </a>

          <nav className="ad-links">
            <a href="#flow">How it works</a>
            <a href="#portals">Portals</a>
            <a href="#menu">Menu</a>
            <a href="#climate">Climate</a>
            <a href="#pricing">Pricing</a>
          </nav>

          <div className="ad-nav-actions">
            <button
              className="ad-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {isAuthenticated ? (
              <button className="ad-btn ad-btn-solid" type="button" onClick={() => navigate(dashboardPath)}>
                Open console
              </button>
            ) : (
              <>
                <button className="ad-btn ad-btn-ghost" type="button" onClick={() => navigate("/login")}>
                  Sign in
                </button>
                <button className="ad-btn ad-btn-solid" type="button" onClick={goOrder}>
                  Demo
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        {/* ------------------------------------------------------------- hero */}
        <section className="ad-hero">
          <div className="ad-wrap ad-hero-grid">
            <div>
              <div className="ad-pill">
                <i>✦</i> Interactive Live Demo · SDG 12 Responsible Consumption
              </div>

              <h1>
                The menu you can <em>walk around.</em>
              </h1>

              <p className="ad-lead">
                Guests scan the QR on their table and the dish appears at true scale —
                ingredients, allergens and climate cost included. The order goes straight
                to the kitchen screen. No app, no printed card, no miscommunication.
              </p>

              <div className="ad-hero-actions">
                <button className="ad-btn ad-btn-solid ad-btn-lg" type="button" onClick={goOrder}>
                  Launch Live Demo&nbsp;&nbsp;→
                </button>
                <a className="ad-btn ad-btn-ghost ad-btn-lg" href="#flow">
                  See how it works&nbsp;&nbsp;↓
                </a>
              </div>

              <dl className="ad-trust">
                <div>
                  <dt>0</dt>
                  <dd>reprints per menu change</dd>
                </div>
                <div>
                  <dt>38%</dt>
                  <dd>faster ticket-to-kitchen</dd>
                </div>
                <div>
                  <dt>3</dt>
                  <dd>portals: guest · chef · admin</dd>
                </div>
              </dl>
            </div>

            <div className="ad-stage" aria-hidden="true">
              <div className="ad-halo" />
              <div className="ad-phone">
                <div className="ad-screen">
                  <div className="ad-notch" />
                  <div className="ad-screen-top">
                    <span>9:41</span>
                    <span className="ad-table-tag">Table 12 · Live</span>
                  </div>
                  <div className="ad-dish-stage">
                    <div className="ad-ar-frame" />
                    <div className="ad-plate" />
                  </div>
                  <div className="ad-screen-meta">
                    <h4>Hyderabadi Dum Biryani</h4>
                    <div className="ad-screen-row">
                      <span className="ad-chip-sm">Serves 2</span>
                      <span className="ad-chip-sm">620 kcal</span>
                      <span className="ad-chip-sm is-eco">● Low impact · A</span>
                    </div>
                  </div>
                  <div className="ad-screen-bar">
                    <b>₹389</b>
                    <small>incl. GST</small>
                    <span className="ad-add">Add to cart</span>
                  </div>
                </div>
              </div>

              <div className="ad-float ad-float-a">
                <b>View in your space</b>
                <span>Three.js · ARCore / ARKit</span>
              </div>
              <div className="ad-float ad-float-b">
                <b>
                  <span className="ad-dot" />
                  Kitchen notified
                </b>
                <span>Table 12 · 2 items · 0.4s</span>
              </div>
              <div className="ad-float ad-float-c">
                <div className="ad-qr" />
                <div>
                  <b>Scan to begin</b>
                  <span>no install needed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- flow */}
        <section id="flow" className="ad-section ad-reveal">
          <div className="ad-wrap">
            <div className="ad-head">
              <div className="ad-eyebrow">How it works</div>
              <h2>Five steps from table to plate.</h2>
              <p>One flow replaces the printed menu, the order pad and the kitchen shout.</p>
            </div>
            <ol className="ad-grid-5">
              {FLOW.map((step) => (
                <li className="ad-card" key={step.n}>
                  <div className="ad-n">{step.n}</div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------------- portals */}
        <section id="portals" className="ad-section ad-reveal">
          <div className="ad-wrap">
            <div className="ad-head">
              <div className="ad-eyebrow">One system</div>
              <h2>Three portals, one language.</h2>
              <p>
                The same tokens, the same light and dark themes, the same loaders — across
                guest, kitchen and management.
              </p>
            </div>
            <div className="ad-grid-3">
              {PORTALS.map((portal) => (
                <article className="ad-card is-lift ad-portal" key={portal.title}>
                  <div className={`ad-icon ${portal.tone}`}>{portal.icon}</div>
                  <h3>{portal.title}</h3>
                  <ul>
                    {portal.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <button
                    className={`ad-btn ad-btn-full ${portal.tone === "is-saffron" ? "ad-btn-saffron" : portal.tone === "is-basil" ? "ad-btn-basil" : "ad-btn-solid"}`}
                    type="button"
                    onClick={() => navigate(portal.path || "/customer/home")}
                  >
                    {portal.cta}&nbsp;&nbsp;→
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- menu */}
        <section id="menu" className="ad-section ad-reveal">
          <div className="ad-wrap">
            <div className="ad-menu-head">
              <div className="ad-head">
                <div className="ad-eyebrow">Live board</div>
                <h2>What the guest sees.</h2>
              </div>
              <div className="ad-chips" role="tablist" aria-label="Filter by course">
                {categories.map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="tab"
                    aria-selected={category === name}
                    className={`ad-chip ${category === name ? "is-active" : ""}`}
                    onClick={() => setCategory(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="ad-dishes">
              {loading &&
                [0, 1, 2, 3, 4, 5].map((i) => (
                  <article className="ad-dish is-skeleton" key={`sk-${i}`} aria-hidden="true">
                    <div className="ad-sk ad-sk-img" />
                    <div className="ad-dish-body">
                      <div className="ad-sk ad-sk-line" style={{ width: "62%" }} />
                      <div className="ad-sk ad-sk-line" style={{ width: "34%" }} />
                      <div className="ad-sk ad-sk-line" style={{ width: "88%" }} />
                    </div>
                  </article>
                ))}

              {!loading &&
                visibleDishes.map((dish) => (
                  <article className="ad-dish" key={dish._id}>
                    <div className="ad-dish-media">
                      {dish.imageUrl ? (
                        <img src={dish.imageUrl} alt={dish.name} loading="lazy" />
                      ) : (
                        <div className="ad-dish-fallback" />
                      )}
                      {dish.modelUrl && <span className="ad-dish-tag">3D model</span>}
                    </div>
                    <div className="ad-dish-body">
                      <div className="ad-dish-top">
                        <h3>{dish.name}</h3>
                        <span className="ad-price">₹{dish.price}</span>
                      </div>
                      <span className="ad-dish-cat">{dish.category}</span>
                      <p>{dish.description || "Prepared to order in the house kitchen."}</p>
                    </div>
                  </article>
                ))}

              {!loading && !visibleDishes.length && (
                <div className="ad-empty">No plates listed in this course yet.</div>
              )}
            </div>

            {loading && (
              <div className="ad-loading-note" role="status" aria-live="polite">
                <span className="ad-spinner" aria-hidden="true" />
                Loading the live board…
              </div>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------- climate */}
        <section id="climate" className="ad-section ad-reveal">
          <div className="ad-wrap ad-climate">
            <div>
              <div className="ad-eyebrow is-basil">Climate label</div>
              <h2>Every dish carries its footprint.</h2>
              <p>
                Responsible consumption is the project's primary SDG, so it is on the plate
                card, not in a footnote. Guests see an A–E grade, water and carbon cost, and
                how local the sourcing is — before they order.
              </p>
              <div className="ad-hero-actions">
                <a className="ad-btn ad-btn-ghost" href="#flow">
                  See the methodology →
                </a>
              </div>
            </div>

            <div className="ad-eco-card">
              <div className="ad-eco-top">
                <div className="ad-eco-score">A</div>
                <div>
                  <b>Hyderabadi Dum Biryani</b>
                  <small>Low climate impact · 1.4 kg CO₂e</small>
                </div>
              </div>

              <div className="ad-eco-row" style={{ marginTop: '24px' }}>
                <header>
                  <b>Carbon</b>
                  <span>1.4 kg CO₂e</span>
                </header>
                <div className="ad-bar">
                  <i style={{ width: "28%" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- pricing */}
        <section id="pricing" className="ad-section ad-reveal">
          <div className="ad-wrap">
            <div className="ad-head is-wide">
              <div className="ad-eyebrow">Pricing</div>
              <h2>Software by the month. Hardware once.</h2>
              <p>
                One subscription covers all three portals — the diner's AR menu, the
                kitchen board and the admin dashboard — with hosting, 3D model storage
                and updates. Every plan starts on a 14-day free trial, and the QR codes
                on your tables never change if you move up a tier.
              </p>
            </div>

            <div className="ad-grid-3 ad-plans">
              {PLANS.map((plan) => (
                <article
                  className={`ad-card ad-plan ${plan.featured ? "is-featured" : ""}`}
                  key={plan.name}
                >
                  {plan.featured && <span className="ad-ribbon">Recommended</span>}
                  <h3>{plan.name}</h3>
                  <p className="ad-plan-for">{plan.for}</p>

                  <div className="ad-price-row">
                    <b>{plan.price}</b>
                    <span>/outlet / month</span>
                  </div>

                  <ul>
                    {plan.features.map((parts, i) => (
                      <li key={i}>
                        <span>
                          {parts[0]}
                          {parts[1] && <b>{parts[1]}</b>}
                          {parts[2] && <i>{parts[2]}</i>}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="ad-plan-note">{plan.note}</div>
                  <button
                    className={`ad-btn ad-btn-full ${plan.featured ? "ad-btn-solid" : "ad-btn-ghost"}`}
                    type="button"
                    onClick={() => {
                      setSelectedPlan(plan.name);
                      setSalesDialogOpen(true);
                    }}
                  >
                    {plan.cta}&nbsp;&nbsp;→
                  </button>
                </article>
              ))}
            </div>

            <p className="ad-plan-foot">
              <b>Included in every plan:</b> a 14-day free trial, unlimited users, hosting,
              unlimited orders, light &amp; dark themes, model updates, and free re-prints
              of your table QR codes.
            </p>

            <div className="ad-head is-wide ad-head-sub">
              <div className="ad-eyebrow">Hardware</div>
              <h2>The kit, bought once.</h2>
              <p>
                Customizable, and optional — keep the printer and screen you already have
                if they do the job. The capture kit is the one piece we would not skip:
                it is what turns a dish on your own table into a model, and it is the
                same kit on every tier.
              </p>
            </div>

            <div className="ad-grid-3 ad-plans">
              {HARDWARE.map((kit) => (
                <article
                  className={`ad-card ad-plan ${kit.featured ? "is-featured" : ""}`}
                  key={kit.name}
                >
                  {kit.featured && <span className="ad-ribbon">Recommended</span>}
                  <h3>{kit.name}</h3>
                  <p className="ad-plan-for">{kit.for}</p>

                  <div className="ad-price-row">
                    <b>{kit.total}</b>
                    <span>one-time, all three pieces</span>
                  </div>

                  <ul>
                    {kit.parts.map((part) => (
                      <li key={part.name}>
                        <span>
                          {part.name} <b>{part.price}</b>
                          <i>{` · ${part.spec}`}</i>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="ad-plan-note">Buy the pieces separately if you prefer</div>
                  <button
                    className={`ad-btn ad-btn-full ${kit.featured ? "ad-btn-solid" : "ad-btn-ghost"}`}
                    type="button"
                    onClick={() => {
                      setSelectedPlan(`${kit.name} hardware kit`);
                      setSalesDialogOpen(true);
                    }}
                  >
                    Talk to Sales&nbsp;&nbsp;→
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- cta */}
        <section className="ad-section is-plain ad-reveal">
          <div className="ad-wrap">
            <div className="ad-cta">
              <h2>Ready to put the menu on the table?</h2>
              <p>
                Set up a restaurant, upload the models once, and print the QR codes.
                Everything else updates itself.
              </p>
              <div className="ad-hero-actions">
                <button className="ad-btn ad-btn-solid ad-btn-lg" type="button" onClick={goOrder}>
                  Launch Live Demo&nbsp;&nbsp;→
                </button>
                <button
                  className="ad-btn ad-btn-ghost ad-btn-lg"
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  Staff sign in
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------- footer */}
      <footer className="ad-footer">
        <div className="ad-wrap">
          <div className="ad-footer-top">
            <div>
              <div className="ad-brand">
                <BrandMark />
                <span className="ad-brand-text">
                  <b>AR Automated Dining</b>
                  <small>Project Phase I · 20AIPJ701</small>
                </span>
              </div>
              <p className="ad-footer-note">
                An augmented reality menu system for the hospitality floor — QR entry, 3D
                dish inspection, automated order processing.
              </p>
            </div>
          </div>

          <div className="ad-footer-bottom">
            <span>© {new Date().getFullYear()} AR Automated Dining</span>
            {/* <span>SDG 12 · 8 · 11 — currently in {themeMode} mode</span> */}
          </div>
        </div>
      </footer>
      <TalkToSalesDialog
        open={salesDialogOpen}
        onClose={() => setSalesDialogOpen(false)}
        defaultPlan={selectedPlan}
      />
    </div>
  );
};

export default Landing;
