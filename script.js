function closeAllDropdowns() {
  document.querySelectorAll(".nav__dropdown.is-open").forEach((el) => {
    el.classList.remove("is-open");
    const trigger = el.querySelector(".nav__trigger");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  });
}

function closeAllModals() {
  document.querySelectorAll(".modal:not([hidden])").forEach((modal) => {
    modal.hidden = true;
  });
}

function openModal(name) {
  const modal = document.getElementById(`modal-${name}`);
  if (!modal) return;
  modal.hidden = false;
  const firstInput = modal.querySelector("input, select, textarea, button");
  if (firstInput) firstInput.focus();
}

function setSignupPlan(planName) {
  const input = document.getElementById("signup-plan");
  if (input) input.value = planName || "Advanced";
}

function setStatus(form, message) {
  const el = form.querySelector(".form__status");
  if (!el) return;
  el.textContent = message;
}

function isLoggedIn() {
  try {
    return window.localStorage.getItem("lb_logged_in") === "1";
  } catch {
    return false;
  }
}

function setLoggedIn(payload) {
  try {
    window.localStorage.setItem("lb_logged_in", "1");
    if (payload?.method) window.localStorage.setItem("lb_auth_method", payload.method);
    if (payload?.email) window.localStorage.setItem("lb_email", payload.email);
  } catch {}
}

function getSafeRedirect() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("redirect");
  if (!raw) return "./index.html";
  if (raw.includes("://") || raw.startsWith("//")) return "./index.html";
  return raw;
}

function buildLoginUrl(redirectPath) {
  const redirect = redirectPath || `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `./login.html?redirect=${encodeURIComponent(redirect)}`;
}

document.addEventListener("click", (e) => {
  const authRequired = e.target.closest("[data-auth-required]");
  if (authRequired && !isLoggedIn()) {
    e.preventDefault();
    const modalName = authRequired.getAttribute("data-modal");
    if (modalName) window.sessionStorage.setItem("lb_after_login_modal", modalName);

    const loginLink = document.getElementById("auth-login-link");
    if (loginLink) loginLink.setAttribute("href", buildLoginUrl());
    closeAllDropdowns();
    openModal("auth");
    return;
  }

  const loginAnchor = e.target.closest('a[href$="login.html"], a[href^="./login.html"], a[href^="login.html"]');
  if (loginAnchor) {
    e.preventDefault();
    window.location.href = buildLoginUrl();
    return;
  }

  const modalTrigger = e.target.closest("[data-modal]");
  if (modalTrigger) {
    e.preventDefault();
    const name = modalTrigger.getAttribute("data-modal");
    const plan = modalTrigger.getAttribute("data-plan");
    if (name === "signup") setSignupPlan(plan);
    closeAllModals();
    closeAllDropdowns();
    openModal(name);
    return;
  }

  const modalClose = e.target.closest("[data-modal-close]");
  if (modalClose) {
    e.preventDefault();
    closeAllModals();
    return;
  }

  if (e.target.classList.contains("modal__overlay")) {
    closeAllModals();
    return;
  }

  const navLink = e.target.closest(".nav__link");
  if (navLink) {
    closeAllDropdowns();
    return;
  }

  const dropdown = e.target.closest(".nav__dropdown");

  if (!dropdown) {
    closeAllDropdowns();
    return;
  }

  const trigger = e.target.closest(".nav__trigger");
  if (!trigger) return;

  const isOpen = dropdown.classList.contains("is-open");
  closeAllDropdowns();
  dropdown.classList.toggle("is-open", !isOpen);
  trigger.setAttribute("aria-expanded", String(!isOpen));
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllDropdowns();
    closeAllModals();
  }
});

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    const name = form.getAttribute("id") || "form";
    if (name === "form-signup") {
      const plan = document.getElementById("signup-plan")?.value || "Advanced";
      setStatus(form, `Account created. Trial started on ${plan}.`);
    } else if (name === "form-login") {
      const email = form.querySelector('input[name="email"]')?.value || "";
      setLoggedIn({ method: "email", email });
      setStatus(form, "Logged in successfully.");
    } else if (name === "form-login-page") {
      const email = form.querySelector('input[name="email"]')?.value || "";
      setLoggedIn({ method: "email", email });
      setStatus(form, "Logged in successfully.");
      const redirect = getSafeRedirect();
      window.setTimeout(() => {
        window.location.href = redirect;
      }, 450);
    } else if (name === "form-demo") {
      setStatus(form, "Request received. We’ll email you to schedule a demo.");
    } else if (name === "form-contact") {
      setStatus(form, "Message sent. We’ll get back to you shortly.");
    } else {
      setStatus(form, "Submitted.");
    }

    window.setTimeout(() => {
      if (button) button.disabled = false;
    }, 700);
  });
});

document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const selector = btn.getAttribute("data-toggle-password");
    if (!selector) return;
    const input = document.querySelector(selector);
    if (!(input instanceof HTMLInputElement)) return;

    const nextType = input.type === "password" ? "text" : "password";
    input.type = nextType;
    btn.setAttribute("aria-label", nextType === "password" ? "Show password" : "Hide password");
  });
});

document.querySelectorAll("[data-provider]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const provider = btn.getAttribute("data-provider") || "provider";
    const form = btn.closest("form");
    if (!form) return;
    setLoggedIn({ method: provider });
    setStatus(form, `Signed in with ${provider}.`);
    if (document.body.classList.contains("auth-body")) {
      const redirect = getSafeRedirect();
      window.setTimeout(() => {
        window.location.href = redirect;
      }, 450);
    }
  });
});

const pendingModal = window.sessionStorage.getItem("lb_after_login_modal");
if (pendingModal && isLoggedIn()) {
  window.sessionStorage.removeItem("lb_after_login_modal");
  window.setTimeout(() => {
    openModal(pendingModal);
  }, 50);
}
