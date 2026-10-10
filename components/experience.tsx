"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Gauge,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });

type Locale = "FR" | "EN" | "AR";

const copy = {
  FR: {
    nav: ["Collection", "Expérience", "Destinations"],
    book: "Réserver",
    hero: "LE LUXE PREND LA ROUTE.",
    sub: "Découvrez le Maroc au volant de véhicules d'exception, sélectionnés et préparés pour chaque voyage.",
    explore: "Explorer la collection",
    city: "Lieu de départ",
    start: "Départ",
    end: "Retour",
    search: "Voir les disponibilités",
    allCategories: "Tous",
    stickyBook: "Réserver",
    whatsapp: "Conseiller WhatsApp",
  },
  EN: {
    nav: ["Collection", "Experience", "Destinations"],
    book: "Book",
    hero: "LUXURY, SET IN MOTION.",
    sub: "Discover Morocco behind the wheel of exceptional vehicles, selected and prepared for every journey.",
    explore: "Explore the collection",
    city: "Pick-up location",
    start: "Pick-up",
    end: "Return",
    search: "Check availability",
    allCategories: "All",
    stickyBook: "Book now",
    whatsapp: "WhatsApp Concierge",
  },
  AR: {
    nav: ["المجموعة", "التجربة", "الوجهات"],
    book: "احجز",
    hero: "الفخامة تنطلق على الطريق.",
    sub: "اكتشف المغرب خلف مقود سيارات استثنائية، مختارة ومجهزة لكل رحلة.",
    explore: "اكتشف المجموعة",
    city: "مكان الانطلاق",
    start: "الانطلاق",
    end: "العودة",
    search: "تحقق من التوفر",
    allCategories: "الكل",
    stickyBook: "احجز الآن",
    whatsapp: "مستشار واتساب",
  },
} as const;

const fleet = [
  {
    name: "Crimson GT",
    type: "Grand tourisme",
    power: "630 ch",
    zero: "3,1 s",
    price: "4 900",
    image: "/images/gt-showroom.webp",
  },
  {
    name: "Apex RS",
    type: "Supercar",
    power: "720 ch",
    zero: "2,9 s",
    price: "6 800",
    image: "/images/gt-showroom-alt.webp",
  },
  {
    name: "Atlas SV",
    type: "SUV haute performance",
    power: "650 ch",
    zero: "3,6 s",
    price: "5 700",
    image: "/images/gt-showroom.webp",
  },
];

const categories = [
  "Tous",
  "Grand tourisme",
  "Supercar",
  "SUV haute performance",
];

export default function Experience() {
  const root = useRef<HTMLDivElement>(null);
  const [locale, setLocale] = useState<Locale>("FR");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [vehicle, setVehicle] = useState("Crimson GT");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [scrolled, setScrolled] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const t = copy[locale];

  useEffect(() => {
    document.documentElement.lang = locale.toLowerCase();
    document.documentElement.dir = locale === "AR" ? "rtl" : "ltr";
  }, [locale]);

  /* Lock scroll when modal or mobile drawer is open */
  useEffect(() => {
    if (menuOpen || bookingOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, bookingOpen]);

  /* Track scroll for sticky mobile reservation bar */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 420);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < 768;
    const lenis =
      reduceMotion || isTouch
        ? null
        : new Lenis({ duration: 1.1, smoothWheel: true });
    let raf = 0;
    const tick = (time: number) => {
      lenis?.raf(time);
      raf = requestAnimationFrame(tick);
    };
    if (lenis) raf = requestAnimationFrame(tick);

    const ctx = gsap.context(() => {
      gsap.from(".hero-reveal", {
        y: 52,
        opacity: 0,
        duration: 1.15,
        stagger: 0.09,
        ease: "power4.out",
        delay: 0.2,
      });
      if (!reduceMotion) {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 34,
            opacity: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 86%" },
          });
        });
      }
    }, root);
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      ctx.revert();
    };
  }, []);

  const openBooking = (car = vehicle) => {
    setVehicle(car);
    setStatus("idle");
    setBookingOpen(true);
  };

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    setStatus(response.ok ? "success" : "error");
  }

  const filteredFleet =
    selectedCategory === "Tous"
      ? fleet
      : fleet.filter((c) => c.type === selectedCategory);

  return (
    <div ref={root} className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="REDSALCARS accueil">
          <Image
            src="/images/redsalcars-logo.webp"
            alt="REDSALCARS Luxury Rental"
            width={230}
            height={178}
            priority
          />
        </a>
        <nav className="desktop-nav" aria-label="Navigation principale">
          {t.nav.map((item, index) => (
            <a
              key={item}
              href={["#collection", "#experience", "#destinations"][index]}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <div className="locale-switch" aria-label="Langue">
            {(["FR", "EN", "AR"] as Locale[]).map((lang) => (
              <button
                key={lang}
                className={locale === lang ? "active" : ""}
                onClick={() => setLocale(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
          <button className="book-button" onClick={() => openBooking()}>
            {t.book}
            <ArrowRight size={16} />
          </button>
          <button
            className="menu-button"
            aria-label="Ouvrir le menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={26} />
          </button>
        </div>
      </header>

      <main>
        <section id="top" className="hero" aria-label="REDSALCARS">
          <div className="hero-canvas" aria-hidden="true">
            <HeroScene />
          </div>
          <div className="hero-vignette" />

          <div className="hero-copy">
            <p className="hero-kicker hero-reveal">
              REDSALCARS <span /> LUXURY RENTAL
            </p>
            <h1 className="hero-reveal">{t.hero}</h1>
            <p className="hero-sub hero-reveal">{t.sub}</p>
            <div className="hero-actions hero-reveal">
              <button
                className="hero-primary-btn"
                onClick={() => openBooking("Crimson GT")}
              >
                {t.book}
                <ArrowRight size={16} />
              </button>
              <a className="text-link" href="#collection">
                {t.explore}
                <ArrowDown size={18} />
              </a>
            </div>
          </div>

          <div className="hero-spec hero-reveal">
            <span>V8</span>
            <small>Performance</small>
            <span>630</span>
            <small>Chevaux</small>
          </div>

          <div className="availability hero-reveal">
            <label>
              <MapPin size={17} />
              <span>{t.city}</span>
              <select defaultValue="Casablanca">
                <option>Casablanca</option>
                <option>Marrakech</option>
                <option>Rabat</option>
                <option>Tanger</option>
                <option>Agadir</option>
              </select>
              <ChevronDown size={15} />
            </label>
            <label>
              <CalendarDays size={17} />
              <span>{t.start}</span>
              <input type="date" aria-label={t.start} />
            </label>
            <label>
              <CalendarDays size={17} />
              <span>{t.end}</span>
              <input type="date" aria-label={t.end} />
            </label>
            <button onClick={() => openBooking()}>
              <span>{t.search}</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </section>

        <section id="collection" className="collection section-pad">
          <div className="section-heading" data-reveal>
            <p>Notre collection</p>
            <h2>
              Choisissez votre
              <br />
              <em>prochaine émotion.</em>
            </h2>
            <span>
              Des lignes sculptées, une mécanique d’exception et une
              préparation irréprochable avant chaque départ.
            </span>
          </div>

          {/* Dynamic mobile category pills */}
          <div className="category-filter-bar" data-reveal>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === "Tous" ? t.allCategories : cat}
              </button>
            ))}
          </div>

          <div className="fleet-grid">
            {filteredFleet.map((car, index) => (
              <article className="fleet-card" key={car.name} data-reveal>
                <div className="fleet-image">
                  <Image
                    src={car.image}
                    alt={`${car.name}, ${car.type}`}
                    fill
                    sizes="(max-width: 800px) 100vw, 33vw"
                  />
                </div>
                <div className="fleet-top">
                  <span>{car.type}</span>
                  <span>0{index + 1}</span>
                </div>
                <h3>{car.name}</h3>
                <div className="fleet-specs">
                  <span>
                    <Gauge size={16} />
                    {car.power}
                  </span>
                  <span>
                    <Zap size={16} />
                    0–100 · {car.zero}
                  </span>
                </div>
                <div className="fleet-bottom">
                  <p>
                    À partir de <strong>{car.price} MAD</strong> / jour
                  </p>
                  <button
                    aria-label={`Réserver ${car.name}`}
                    onClick={() => openBooking(car.name)}
                  >
                    <ArrowRight />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="experience-band section-pad">
          <div className="experience-statement" data-reveal>
            <p>Plus qu’une location</p>
            <h2>
              Votre temps est précieux.
              <br />
              Nous nous occupons du reste.
            </h2>
          </div>
          <div className="service-list">
            <article>
              <span>
                <ShieldCheck />
              </span>
              <h3>Exigence absolue</h3>
              <p>
                Chaque véhicule est contrôlé, détaillé et préparé selon un
                protocole rigoureux.
              </p>
            </article>
            <article>
              <span>
                <MapPin />
              </span>
              <h3>Livraison sur mesure</h3>
              <p>
                Aéroport, hôtel ou résidence privée, partout dans les principales
                villes du Maroc.
              </p>
            </article>
            <article>
              <span>
                <Sparkles />
              </span>
              <h3>Conciergerie 24/7</h3>
              <p>
                Un interlocuteur dédié vous accompagne avant, pendant et après
                votre voyage.
              </p>
            </article>
          </div>
        </section>

        <section id="destinations" className="destinations section-pad">
          <div className="destination-copy" data-reveal>
            <p>Le Maroc, en grand</p>
            <h2>Des routes qui méritent une voiture d’exception.</h2>
            <a className="text-link" href="#contact">
              Composer mon itinéraire
              <ArrowRight size={18} />
            </a>
          </div>
          <div className="route-lines" data-reveal>
            <article>
              <span>Casablanca</span>
              <strong>Océan & architecture</strong>
              <small>Point de départ</small>
            </article>
            <article>
              <span>Marrakech</span>
              <strong>Atlas & palmeraie</strong>
              <small>+ 241 km</small>
            </article>
            <article>
              <span>Tanger</span>
              <strong>Détroit & corniche</strong>
              <small>+ 338 km</small>
            </article>
          </div>
        </section>

        <section id="contact" className="final-cta">
          <div data-reveal>
            <p>Votre prochaine route</p>
            <h2>
              Une voiture.
              <br />
              Une destination.
              <br />
              <em>Un souvenir.</em>
            </h2>
            <button className="large-cta" onClick={() => openBooking()}>
              Réserver maintenant
              <ArrowRight />
            </button>
          </div>
        </section>
      </main>

      <footer>
        <Image
          src="/images/redsalcars-logo.webp"
          alt="REDSALCARS"
          width={210}
          height={160}
        />
        <p>Luxury rental · Maroc</p>
        <div>
          <a href="#collection">Collection</a>
          <a href="#experience">Services</a>
          <a href="mailto:contact@redsalcars.ma">Contact</a>
        </div>
        <small>© 2026 REDSALCARS. Tous droits réservés.</small>
      </footer>

      {/* Sticky Mobile Reservation Bar */}
      <div className={`mobile-sticky-bar ${scrolled ? "visible" : ""}`}>
        <div className="sticky-info">
          <span className="sticky-car-name">{vehicle}</span>
          <span className="sticky-car-price">
            Dès <strong>4 900 MAD</strong> / j
          </span>
        </div>
        <button
          className="sticky-book-btn"
          onClick={() => openBooking(vehicle)}
        >
          {t.stickyBook}
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <div
        className={`mobile-menu ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="mobile-menu-header">
          <Image
            src="/images/redsalcars-logo.webp"
            alt="REDSALCARS"
            width={130}
            height={60}
          />
          <button
            className="mobile-close-btn"
            aria-label="Fermer"
            onClick={() => setMenuOpen(false)}
          >
            <X size={26} />
          </button>
        </div>

        {/* Mobile Language Switcher */}
        <div className="mobile-locale-selector">
          <span>Langue / Language</span>
          <div className="mobile-locale-chips">
            {(["FR", "EN", "AR"] as Locale[]).map((lang) => (
              <button
                key={lang}
                className={locale === lang ? "active" : ""}
                onClick={() => setLocale(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <nav className="mobile-nav-links">
          {t.nav.map((item, index) => (
            <a
              key={item}
              onClick={() => setMenuOpen(false)}
              href={["#collection", "#experience", "#destinations"][index]}
            >
              <span>{item}</span>
              <ArrowRight size={18} />
            </a>
          ))}
        </nav>

        <div className="mobile-menu-footer">
          <a
            className="whatsapp-contact-btn"
            href="https://wa.me/212600000000?text=Bonjour,%20je%20souhaite%20r%C3%A9server%20une%20voiture%20de%20luxe"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Phone size={16} />
            {t.whatsapp}
          </a>
          <button
            className="large-cta"
            onClick={() => {
              setMenuOpen(false);
              openBooking();
            }}
          >
            {t.book}
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* Booking Overlay Modal */}
      {bookingOpen && (
        <div
          className="booking-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Réservation"
        >
          <button
            className="overlay-close"
            onClick={() => setBookingOpen(false)}
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
          <div className="booking-panel">
            <p>Demande privée</p>
            <h2>Préparez votre départ.</h2>
            {status === "success" ? (
              <div className="success-state">
                <span>
                  <Check size={28} />
                </span>
                <h3>Demande reçue</h3>
                <p>
                  Notre concierge vous contactera très prochainement pour
                  confirmer les détails.
                </p>
                <button onClick={() => setBookingOpen(false)}>Fermer</button>
              </div>
            ) : (
              <form onSubmit={submitBooking}>
                <label>
                  Nom complet
                  <input name="name" required minLength={2} placeholder="Ex: Karim Benjelloun" />
                </label>
                <label>
                  E-mail
                  <input name="email" type="email" required placeholder="contact@exemple.com" />
                </label>
                <label>
                  Téléphone
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+212 6 XX XX XX XX"
                    required
                  />
                </label>
                <label>
                  Véhicule
                  <select
                    name="vehicle"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                  >
                    {fleet.map((car) => (
                      <option key={car.name}>{car.name}</option>
                    ))}
                  </select>
                </label>
                <div className="form-row">
                  <label>
                    Ville
                    <select name="city" defaultValue="Casablanca">
                      <option>Casablanca</option>
                      <option>Marrakech</option>
                      <option>Rabat</option>
                      <option>Tanger</option>
                      <option>Agadir</option>
                    </select>
                  </label>
                  <label>
                    Départ
                    <input name="startDate" type="date" required />
                  </label>
                  <label>
                    Retour
                    <input name="endDate" type="date" required />
                  </label>
                </div>
                {status === "error" && (
                  <p className="form-error">
                    Vérifiez les informations puis réessayez.
                  </p>
                )}
                <button
                  className="submit-booking"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Envoi…" : "Envoyer la demande"}
                  <ArrowRight />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
