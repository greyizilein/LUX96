// ==========================================================
// LUX96 Furnitures — site behaviour
// Update CONTACT below with the real business details.
// ==========================================================
const CONTACT = {
  // International format, digits only (used for wa.me links)
  whatsapp: "0000000000000",
  email: "hello@lux96furnitures.com",
};

document.documentElement.classList.add("js");

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Sticky header shadow
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
const setMenu = (open) => {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  nav.classList.toggle("is-open", open);
};
toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

// Reveal on scroll
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -60px 0px", threshold: 0.08 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-visible"));
}

// Highlight current section in nav
const navLinks = [...nav.querySelectorAll('a[href^="#"]:not(.btn)')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
if ("IntersectionObserver" in window) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));
}

// Gallery filter
const filters = document.querySelectorAll(".filter");
const tiles = document.querySelectorAll(".tile");
filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.dataset.filter;
    filters.forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    tiles.forEach((t) => t.classList.toggle("is-hidden", cat !== "all" && t.dataset.cat !== cat));
  });
});

// Quote form -> WhatsApp or email (no backend required)
const form = document.getElementById("quote-form");
const errorEl = form.querySelector(".form-error");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const via = e.submitter?.dataset.via || "whatsapp";
  const data = Object.fromEntries(new FormData(form));
  const missing = ["name", "message"].filter((k) => !String(data[k] || "").trim());

  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  if (missing.length) {
    missing.forEach((k) => form.elements[k].setAttribute("aria-invalid", "true"));
    errorEl.textContent = "Please add your name and a short description of your project.";
    errorEl.hidden = false;
    form.elements[missing[0]].focus();
    return;
  }
  errorEl.hidden = true;

  const lines = [
    "Hello LUX96, I'd like a quote.",
    "",
    `Name: ${data.name}`,
    data.phone ? `Phone: ${data.phone}` : null,
    data.email ? `Email: ${data.email}` : null,
    `Project: ${data.project}`,
    "",
    data.message,
  ].filter((l) => l !== null);
  const body = lines.join("\n");

  if (via === "email") {
    const subject = `Quote request — ${data.project}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  } else {
    window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
  }
});
