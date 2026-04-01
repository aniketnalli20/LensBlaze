function closeAllDropdowns() {
  document.querySelectorAll(".nav__dropdown.is-open").forEach((el) => {
    el.classList.remove("is-open");
    const trigger = el.querySelector(".nav__trigger");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  });
}

function closeAllModals() {
  document.querySelectorAll(".modal:not([hidden])").forEach((modal) => {
    modal.classList.remove("is-open");
    window.setTimeout(() => {
      modal.hidden = true;
    }, 260);
  });
}

function openModal(name) {
  const modal = document.getElementById(`modal-${name}`);
  if (!modal) return;
  modal.hidden = false;
  modal.classList.remove("is-open");
  window.requestAnimationFrame(() => {
    modal.classList.add("is-open");
  });
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

function openInitialModalFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("modal");
  if (!name) return;
  window.setTimeout(() => {
    closeAllModals();
    openModal(name);
  }, 0);
}

openInitialModalFromUrl();

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

const FormValidationCore = (() => {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const urlLikeRe = /^(https?:\/\/|mailto:|tel:)/i;

  function required(message) {
    return (value) => {
      const v = String(value ?? "").trim();
      if (!v) return message || "This field is required.";
      return "";
    };
  }

  function email(message) {
    return (value) => {
      const v = String(value ?? "").trim();
      if (!v) return "";
      if (!emailRe.test(v)) return message || "Enter a valid email address.";
      return "";
    };
  }

  function minLength(min, message) {
    return (value) => {
      const v = String(value ?? "");
      if (!v) return "";
      if (v.length < min) return message || `Must be at least ${min} characters.`;
      return "";
    };
  }

  function maxLength(max, message) {
    return (value) => {
      const v = String(value ?? "");
      if (!v) return "";
      if (v.length > max) return message || `Must be at most ${max} characters.`;
      return "";
    };
  }

  function selectRequired(message) {
    return (value) => {
      const v = String(value ?? "");
      if (!v) return message || "Please select an option.";
      return "";
    };
  }

  function urlLike(message) {
    return (value) => {
      const v = String(value ?? "").trim();
      if (!v) return "";
      if (!urlLikeRe.test(v)) return message || "Enter a valid URL.";
      return "";
    };
  }

  return { required, email, minLength, maxLength, selectRequired, urlLike };
})();

const FormSchemas = (() => {
  const v = FormValidationCore;
  return {
    "form-signup": {
      email: [v.required("Work email is required."), v.email("Enter a valid work email.")],
      password: [v.required("Password is required."), v.minLength(8, "Password must be at least 8 characters.")],
    },
    "form-login": {
      email: [v.required("Email is required."), v.email("Enter a valid email.")],
      password: [v.required("Password is required.")],
    },
    "form-login-page": {
      email: [v.required("Email is required."), v.email("Enter a valid email.")],
      password: [v.required("Password is required.")],
    },
    "form-demo": {
      name: [v.required("Name is required."), v.minLength(2, "Name is too short."), v.maxLength(80, "Name is too long.")],
      email: [v.required("Email is required."), v.email("Enter a valid email.")],
      type: [v.selectRequired("Select what you shoot.")],
    },
    "form-contact": {
      name: [v.required("Name is required."), v.minLength(2, "Name is too short."), v.maxLength(80, "Name is too long.")],
      email: [v.required("Email is required."), v.email("Enter a valid email.")],
      message: [v.required("Message is required."), v.minLength(10, "Message is too short."), v.maxLength(1200, "Message is too long.")],
    },
  };
})();

const FormUI = (() => {
  function getFieldContainer(input) {
    return input.closest(".field") || input.closest(".auth-field") || input.closest(".ws-field") || input.parentElement;
  }

  function getErrorClass(container) {
    if (!container) return "field__error";
    if (container.classList.contains("auth-field")) return "auth-field__error";
    if (container.classList.contains("ws-field")) return "ws-field__error";
    return "field__error";
  }

  function ensureErrorEl(formId, input) {
    const name = input.getAttribute("name") || input.getAttribute("id") || "field";
    const errorId = `${formId}-${name}-error`;
    const container = getFieldContainer(input);
    if (!container) return null;

    let existing = container.querySelector(`#${CSS.escape(errorId)}`);
    if (existing) return existing;

    const el = document.createElement("div");
    el.id = errorId;
    el.className = getErrorClass(container);
    el.setAttribute("role", "alert");
    el.hidden = true;
    container.appendChild(el);
    return el;
  }

  function setAriaDescribedBy(input, errorEl) {
    if (!errorEl) return;
    const current = (input.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    if (!current.includes(errorEl.id)) current.push(errorEl.id);
    input.setAttribute("aria-describedby", current.join(" "));
  }

  function clearAriaDescribedBy(input, errorEl) {
    if (!errorEl) return;
    const current = (input.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    const next = current.filter((id) => id !== errorEl.id);
    if (next.length) input.setAttribute("aria-describedby", next.join(" "));
    else input.removeAttribute("aria-describedby");
  }

  function setFieldError(formId, input, message) {
    const el = ensureErrorEl(formId, input);
    if (!el) return;
    el.textContent = message;
    el.hidden = !message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (message) setAriaDescribedBy(input, el);
    else clearAriaDescribedBy(input, el);
  }

  function clearFieldError(formId, input) {
    setFieldError(formId, input, "");
  }

  function focusFirstInvalid(form) {
    const el = form.querySelector('[aria-invalid="true"]');
    if (el && typeof el.focus === "function") el.focus();
  }

  return { setFieldError, clearFieldError, focusFirstInvalid };
})();

const FormState = (() => {
  function create(form) {
    return {
      id: form.getAttribute("id") || "form",
      values: {},
      errors: {},
      touched: {},
      isSubmitting: false,
    };
  }

  return { create };
})();

const FormHandlers = (() => {
  function handleSubmit(form, state) {
    const id = state.id;
    if (id === "form-signup") {
      const plan = document.getElementById("signup-plan")?.value || "Advanced";
      setStatus(form, `Account created. Trial started on ${plan}.`);
      return;
    }
    if (id === "form-login") {
      const email = String(state.values.email || "");
      setLoggedIn({ method: "email", email });
      setStatus(form, "Logged in successfully.");
      closeAllModals();
      updateAuthVisibility();
      return;
    }
    if (id === "form-login-page") {
      const email = String(state.values.email || "");
      setLoggedIn({ method: "email", email });
      setStatus(form, "Logged in successfully.");
      updateAuthVisibility();
      const redirect = getSafeRedirect();
      window.setTimeout(() => {
        window.location.href = redirect;
      }, 450);
      return;
    }
    if (id === "form-demo") {
      setStatus(form, "Request received. We’ll email you to schedule a demo.");
      closeAllModals();
      return;
    }
    if (id === "form-contact") {
      setStatus(form, "Message sent. We’ll get back to you shortly.");
      closeAllModals();
      return;
    }
    setStatus(form, "Submitted.");
  }

  return { handleSubmit };
})();

function validateField(formId, name, value) {
  const schema = FormSchemas[formId];
  if (!schema) return "";
  const validators = schema[name];
  if (!validators) return "";
  for (const fn of validators) {
    const msg = fn(value);
    if (msg) return msg;
  }
  return "";
}

function initFormSystem() {
  document.querySelectorAll("form").forEach((form) => {
    const formId = form.getAttribute("id") || "form";
    const schema = FormSchemas[formId];
    if (!schema) return;

    form.setAttribute("novalidate", "");
    const state = FormState.create(form);

    const fields = Object.keys(schema)
      .map((name) => form.querySelector(`[name="${CSS.escape(name)}"]`))
      .filter(Boolean);

    const readValues = () => {
      fields.forEach((input) => {
        const key = input.getAttribute("name");
        state.values[key] = input.value;
      });
    };

    const validateOne = (input, markTouched) => {
      const name = input.getAttribute("name");
      if (!name) return "";
      if (markTouched) state.touched[name] = true;
      const msg = validateField(formId, name, input.value);
      state.errors[name] = msg;
      if (state.touched[name]) FormUI.setFieldError(formId, input, msg);
      return msg;
    };

    fields.forEach((input) => {
      input.addEventListener("input", () => {
        state.values[input.getAttribute("name")] = input.value;
        if (state.touched[input.getAttribute("name")]) validateOne(input, false);
      });
      input.addEventListener("blur", () => {
        validateOne(input, true);
      });
      input.addEventListener("change", () => {
        state.values[input.getAttribute("name")] = input.value;
        if (state.touched[input.getAttribute("name")]) validateOne(input, false);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (state.isSubmitting) return;
      state.isSubmitting = true;

      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;

      readValues();
      let hasError = false;
      fields.forEach((input) => {
        const msg = validateOne(input, true);
        if (msg) hasError = true;
      });

      if (hasError) {
        FormUI.focusFirstInvalid(form);
        state.isSubmitting = false;
        if (button) button.disabled = false;
        return;
      }

      FormHandlers.handleSubmit(form, state);

      window.setTimeout(() => {
        state.isSubmitting = false;
        if (button) button.disabled = false;
      }, 700);
    });
  });
}

const ProviderAuth = (() => {
  const SELECTED_KEY = "lb_provider_selected_v1";
  const PENDING_KEY = "lb_provider_pending_v1";

  function isGoogleProvider(provider) {
    return String(provider || "").trim().toLowerCase() === "google";
  }

  function isGoogleEmail(email) {
    const v = String(email || "").trim().toLowerCase();
    if (!v) return false;
    return /@(gmail\.com|googlemail\.com)$/.test(v);
  }

  function requiresSelection(provider) {
    const p = String(provider || "").toLowerCase();
    return p !== "email";
  }

  function getAllSelected() {
    return safeParseJson(window.sessionStorage.getItem(SELECTED_KEY), {});
  }

  function setSelected(provider, email) {
    const next = getAllSelected();
    next[String(provider || "provider")] = { email: String(email || "") };
    try {
      window.sessionStorage.setItem(SELECTED_KEY, JSON.stringify(next));
    } catch {}
  }

  function getSelected(provider) {
    const all = getAllSelected();
    return all[String(provider || "provider")] || null;
  }

  function clearSelected(provider) {
    const key = String(provider || "provider");
    const next = getAllSelected();
    if (!next[key]) return;
    delete next[key];
    try {
      window.sessionStorage.setItem(SELECTED_KEY, JSON.stringify(next));
    } catch {}
  }

  function setPending(provider, formId) {
    try {
      window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ provider, formId }));
    } catch {}
  }

  function getPending() {
    return safeParseJson(window.sessionStorage.getItem(PENDING_KEY), null);
  }

  function clearPending() {
    try {
      window.sessionStorage.removeItem(PENDING_KEY);
    } catch {}
    const status = document.getElementById("provider-status");
    if (status) status.textContent = "";
  }

  function getFallbackAccounts(provider) {
    const p = String(provider || "provider").toLowerCase();
    if (p === "facebook") return ["hello@example.com"];
    if (p === "apple") return ["hello@example.com"];
    return [];
  }

  function getAccounts(provider) {
    if (isGoogleProvider(provider)) {
      const ws = getWorkspace?.();
      const configured = Array.isArray(ws?.account?.googleAccounts) ? ws.account.googleAccounts : [];
      const fromWorkspace = configured.map((v) => String(v || "").trim().toLowerCase()).filter(isGoogleEmail);

      const lastEmail = String(window.localStorage.getItem("lb_email") || "")
        .trim()
        .toLowerCase();
      const fromLast = isGoogleEmail(lastEmail) ? [lastEmail] : [];

      const alreadySelected = String(getSelected(provider)?.email || "")
        .trim()
        .toLowerCase();
      const fromSelected = isGoogleEmail(alreadySelected) ? [alreadySelected] : [];

      return Array.from(new Set([...fromWorkspace, ...fromLast, ...fromSelected]));
    }

    return getFallbackAccounts(provider);
  }

  function renderAccounts(provider) {
    const root = document.getElementById("provider-accounts");
    if (!root) return;
    root.innerHTML = "";

    const cont = document.getElementById("provider-continue");
    const accounts = getAccounts(provider);
    const selected = String(getSelected(provider)?.email || "").trim().toLowerCase();

    if (!accounts.length) {
      const empty = document.createElement("div");
      empty.className = "ws-empty";
      empty.textContent = isGoogleProvider(provider)
        ? "No Google accounts configured yet. Add one in Workspace → Account."
        : "No accounts available for this provider.";
      root.appendChild(empty);
      if (cont instanceof HTMLButtonElement) cont.disabled = true;
      return;
    }

    if (cont instanceof HTMLButtonElement) cont.disabled = false;

    accounts.forEach((email) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "ws-link";
      row.setAttribute("data-provider-email", email);
      row.setAttribute("aria-pressed", String(String(email).toLowerCase() === selected));

      const icon = document.createElement("div");
      icon.className = "ws-link__drag";
      icon.textContent = String(email).toLowerCase() === selected ? "✓" : "○";

      const meta = document.createElement("div");
      meta.className = "ws-link__meta";

      const title = document.createElement("div");
      title.className = "ws-link__title";
      title.textContent = email;

      const hint = document.createElement("div");
      hint.className = "ws-link__url";
      hint.textContent = "Use this account";

      meta.appendChild(title);
      meta.appendChild(hint);

      const action = document.createElement("div");
      action.className = "ws-link__actions";

      const btn = document.createElement("div");
      btn.className = "ws-link__btn";
      btn.textContent = "→";
      action.appendChild(btn);

      row.appendChild(icon);
      row.appendChild(meta);
      row.appendChild(action);

      root.appendChild(row);
    });
  }

  function open(provider, formId, initialStatus) {
    setPending(provider, formId);

    const title = document.getElementById("provider-title");
    const subtitle = document.getElementById("provider-subtitle");
    if (title) title.textContent = `Select ${String(provider || "an")} account`;
    if (subtitle) {
      subtitle.textContent = isGoogleProvider(provider)
        ? "Choose a Gmail/Googlemail account to use for Google sign-in."
        : "Choose the account you want to use before continuing.";
    }
    renderAccounts(provider);
    openModal("provider");
    const status = document.getElementById("provider-status");
    if (status && initialStatus) status.textContent = String(initialStatus);
  }

  function bind() {
    const modal = document.getElementById("modal-provider");
    if (!modal) return;

    modal.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-provider-email]");
      if (!btn) return;
      const pending = getPending();
      const provider = pending?.provider || "provider";
      const email = btn.getAttribute("data-provider-email") || "";
      if (!email) return;
      setSelected(provider, email);
      renderAccounts(provider);
      const status = document.getElementById("provider-status");
      if (status) status.textContent = "";
    });

    const cont = document.getElementById("provider-continue");
    if (cont) {
      cont.addEventListener("click", () => {
        const pending = getPending();
        if (!pending?.provider) return;
        const selected = getSelected(pending.provider);
        const status = document.getElementById("provider-status");
        const email = String(selected?.email || "").trim().toLowerCase();
        if (!email) {
          if (status) status.textContent = "Please select an account to continue.";
          return;
        }
        if (isGoogleProvider(pending.provider) && !isGoogleEmail(email)) {
          clearSelected(pending.provider);
          renderAccounts(pending.provider);
          if (status) status.textContent = "Google sign-in requires a Gmail/Googlemail address.";
          return;
        }

        const form = pending.formId ? document.getElementById(pending.formId) : null;
        if (form) {
          const fakeBtn = document.querySelector(`[data-provider="${CSS.escape(pending.provider)}"]`);
          if (fakeBtn instanceof HTMLButtonElement) fakeBtn.click();
        } else {
          clearPending();
          closeAllModals();
        }
      });
    }

    modal.querySelectorAll("[data-modal-close]").forEach((el) => {
      el.addEventListener("click", () => {
        clearPending();
      });
    });
  }

  bind();

  return { requiresSelection, getSelected, open, clearPending, isGoogleEmail, isGoogleProvider, clearSelected };
})();

const ButtonClickHandlers = (() => {
  function togglePassword(btn) {
    const selector = btn.getAttribute("data-toggle-password");
    if (!selector) return;
    const input = document.querySelector(selector);
    if (!(input instanceof HTMLInputElement)) return;

    const nextType = input.type === "password" ? "text" : "password";
    input.type = nextType;
    btn.setAttribute("aria-label", nextType === "password" ? "Show password" : "Hide password");
  }

  function providerSignIn(btn) {
    const provider = btn.getAttribute("data-provider") || "provider";
    const form = btn.closest("form");
    if (!form) return;
    const selection = ProviderAuth.getSelected(provider);
    const email = String(selection?.email || "").trim().toLowerCase();
    if (ProviderAuth.requiresSelection(provider) && !email) {
      ProviderAuth.open(provider, form.getAttribute("id") || "");
      return;
    }
    if (ProviderAuth.isGoogleProvider(provider) && !ProviderAuth.isGoogleEmail(email)) {
      ProviderAuth.clearSelected(provider);
      ProviderAuth.open(provider, form.getAttribute("id") || "", "Google sign-in requires a Gmail/Googlemail address.");
      return;
    }
    setLoggedIn({ method: provider, email });
    setStatus(form, `Signed in with ${provider}.`);
    updateAuthVisibility();
    ProviderAuth.clearPending();
    if (document.body.classList.contains("auth-body")) {
      const redirect = getSafeRedirect();
      window.setTimeout(() => {
        window.location.href = redirect;
      }, 450);
    }
  }

  return { togglePassword, providerSignIn };
})();

document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
  btn.addEventListener("click", () => {
    ButtonClickHandlers.togglePassword(btn);
  });
});

document.querySelectorAll("[data-provider]").forEach((btn) => {
  btn.addEventListener("click", () => {
    ButtonClickHandlers.providerSignIn(btn);
  });
});

const pendingModal = window.sessionStorage.getItem("lb_after_login_modal");
if (pendingModal && isLoggedIn()) {
  window.sessionStorage.removeItem("lb_after_login_modal");
  window.setTimeout(() => {
    openModal(pendingModal);
  }, 50);
}

document.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-template-tab]");
  if (!tab) return;
  if (!(tab instanceof HTMLButtonElement)) return;

  const template = tab.getAttribute("data-template-tab");
  if (!template) return;

  const card = tab.closest(".bio__card--templates");
  if (!card) return;

  const preview = card.querySelector(".template-preview");
  if (!preview) return;

  preview.setAttribute("data-template", template);

  const tabs = card.querySelectorAll("[data-template-tab]");
  tabs.forEach((el) => {
    el.classList.toggle("is-active", el === tab);
  });
});

function safeParseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSetJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

function setLoggedOut() {
  safeRemove("lb_logged_in");
  safeRemove("lb_auth_method");
  safeRemove("lb_email");
}

function updateAuthVisibility() {
  const loggedIn = isLoggedIn();
  document.querySelectorAll("[data-auth-show]").forEach((el) => {
    const mode = el.getAttribute("data-auth-show");
    if (mode === "in") el.hidden = !loggedIn;
    if (mode === "out") el.hidden = loggedIn;
  });

  const workspace = document.getElementById("workspace");
  if (workspace) workspace.hidden = !loggedIn;

  updateNavbarProfile();
}

function updateNavbarProfile() {
  const avatar = document.getElementById("nav-avatar");
  const label = document.getElementById("nav-profile-label");
  if (!avatar || !label) return;
  if (!isLoggedIn()) {
    avatar.style.backgroundImage = "";
    avatar.textContent = "";
    label.textContent = "Profile";
    return;
  }

  const ws = getWorkspace?.() || null;
  const name = ws?.profile?.name || "";
  const logo = ws?.profile?.logo || "";
  const email = window.localStorage.getItem("lb_email") || "";
  const display = name || email || "Profile";

  label.textContent = display;

  if (logo) {
    avatar.style.backgroundImage = `url("${logo}")`;
    avatar.style.backgroundSize = "cover";
    avatar.style.backgroundPosition = "center";
    avatar.textContent = "";
  } else {
    avatar.style.backgroundImage = "";
    avatar.style.backgroundSize = "";
    avatar.style.backgroundPosition = "";
    const initial = String(display || "P").trim().slice(0, 1).toUpperCase();
    avatar.textContent = initial || "P";
  }
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function normalizeHandle(raw) {
  const value = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_-]/g, "");
  return value.slice(0, 32);
}

function hexToRgb(hex) {
  const raw = String(hex || "").trim();
  const m = raw.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToHex(rgb) {
  const to2 = (v) => clamp(v, 0, 255).toString(16).padStart(2, "0");
  return `#${to2(rgb.r)}${to2(rgb.g)}${to2(rgb.b)}`;
}

function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return hexA;
  const p = clamp(Number(t) || 0, 0, 1);
  return rgbToHex({
    r: Math.round(a.r + (b.r - a.r) * p),
    g: Math.round(a.g + (b.g - a.g) * p),
    b: Math.round(a.b + (b.b - a.b) * p),
  });
}

const WORKSPACE_KEY = "lb_workspace_v1";

function getDefaultWorkspace() {
  return {
    profile: {
      name: "Your Name",
      handle: "yourname",
      bio: "Photographer. Available worldwide.",
      location: "",
      website: "",
      logo: "",
    },
    account: {
      email: "",
      phone: "",
      googleAccounts: [],
    },
    branding: {
      primary: "#f08a2a",
      bg: "#ffffff",
      text: "#111827",
      dark: false,
    },
    bio: {
      template: "minimal",
      buttonStyle: "filled",
      radius: 999,
      spacing: "comfortable",
      published: false,
    },
    links: [
      { id: "l1", title: "Book Now", url: "https://example.com/book" },
      { id: "l2", title: "View Portfolio", url: "https://example.com/portfolio" },
      { id: "l3", title: "Contact", url: "mailto:hello@example.com" },
    ],
  };
}

function getWorkspace() {
  const existing = safeParseJson(window.localStorage.getItem(WORKSPACE_KEY), null);
  if (!existing) return getDefaultWorkspace();
  const base = getDefaultWorkspace();
  return {
    profile: { ...base.profile, ...(existing.profile || {}) },
    account: { ...base.account, ...(existing.account || {}) },
    branding: { ...base.branding, ...(existing.branding || {}) },
    bio: { ...base.bio, ...(existing.bio || {}) },
    links: Array.isArray(existing.links) ? existing.links : base.links,
  };
}

function setWorkspace(next) {
  safeSetJson(WORKSPACE_KEY, next);
}

function renderWorkspace(state) {
  const name = document.getElementById("ws-name");
  const handle = document.getElementById("ws-handle");
  const bio = document.getElementById("ws-bio");
  const location = document.getElementById("ws-location");
  const website = document.getElementById("ws-website");
  const email = document.getElementById("ws-email");
  const phone = document.getElementById("ws-phone");
  const primary = document.getElementById("ws-color-primary");
  const bg = document.getElementById("ws-color-bg");
  const text = document.getElementById("ws-color-text");
  const darkToggle = document.getElementById("ws-dark-toggle");
  const btnStyle = document.getElementById("ws-button-style");
  const radius = document.getElementById("ws-radius");
  const spacing = document.getElementById("ws-spacing");

  if (name) name.value = state.profile.name || "";
  if (handle) handle.value = state.profile.handle || "";
  if (bio) bio.value = state.profile.bio || "";
  if (location) location.value = state.profile.location || "";
  if (website) website.value = state.profile.website || "";
  if (email) email.value = state.account.email || window.localStorage.getItem("lb_email") || "";
  if (phone) phone.value = state.account.phone || "";
  if (primary) primary.value = state.branding.primary || "#f08a2a";
  if (bg) bg.value = state.branding.bg || "#ffffff";
  if (text) text.value = state.branding.text || "#111827";
  if (btnStyle) btnStyle.value = state.bio.buttonStyle || "filled";
  if (radius) radius.value = String(state.bio.radius ?? 999);
  if (spacing) spacing.value = state.bio.spacing || "comfortable";
  if (darkToggle) {
    darkToggle.setAttribute("aria-pressed", String(Boolean(state.branding.dark)));
    darkToggle.textContent = state.branding.dark ? "On" : "Off";
  }

  document.querySelectorAll("[data-ws-template]").forEach((btn) => {
    const v = btn.getAttribute("data-ws-template");
    btn.classList.toggle("is-active", v === state.bio.template);
  });

  renderGoogleAccounts(state);
  renderLinksList(state);
  renderPreview(state);
  updateNavbarProfile();
}

function renderLinksList(state) {
  const root = document.getElementById("ws-links");
  if (!root) return;

  root.innerHTML = "";
  state.links.forEach((link) => {
    const row = document.createElement("div");
    row.className = "ws-link";
    row.setAttribute("draggable", "true");
    row.setAttribute("data-link-id", link.id);

    const drag = document.createElement("div");
    drag.className = "ws-link__drag";
    drag.textContent = "⋮⋮";

    const meta = document.createElement("div");
    meta.className = "ws-link__meta";

    const title = document.createElement("div");
    title.className = "ws-link__title";
    title.textContent = link.title || "Untitled";

    const url = document.createElement("div");
    url.className = "ws-link__url";
    url.textContent = link.url || "";

    meta.appendChild(title);
    meta.appendChild(url);

    const actions = document.createElement("div");
    actions.className = "ws-link__actions";

    const edit = document.createElement("button");
    edit.className = "ws-link__btn";
    edit.type = "button";
    edit.setAttribute("data-ws-link-edit", link.id);
    edit.textContent = "✎";

    const del = document.createElement("button");
    del.className = "ws-link__btn";
    del.type = "button";
    del.setAttribute("data-ws-link-del", link.id);
    del.textContent = "×";

    actions.appendChild(edit);
    actions.appendChild(del);

    row.appendChild(drag);
    row.appendChild(meta);
    row.appendChild(actions);
    root.appendChild(row);
  });
}

function renderGoogleAccounts(state) {
  const root = document.getElementById("ws-google-accounts");
  if (!root) return;
  const accounts = Array.isArray(state.account.googleAccounts) ? state.account.googleAccounts : [];
  root.innerHTML = "";

  if (!accounts.length) {
    const empty = document.createElement("div");
    empty.className = "ws-empty";
    empty.textContent = "No Google accounts added yet.";
    root.appendChild(empty);
    return;
  }

  accounts.forEach((email) => {
    const row = document.createElement("div");
    row.className = "ws-link";

    const icon = document.createElement("div");
    icon.className = "ws-link__drag";
    icon.textContent = "G";

    const meta = document.createElement("div");
    meta.className = "ws-link__meta";

    const title = document.createElement("div");
    title.className = "ws-link__title";
    title.textContent = email;

    const hint = document.createElement("div");
    hint.className = "ws-link__url";
    hint.textContent = "Google account";

    meta.appendChild(title);
    meta.appendChild(hint);

    const actions = document.createElement("div");
    actions.className = "ws-link__actions";

    const del = document.createElement("button");
    del.className = "ws-link__btn";
    del.type = "button";
    del.setAttribute("data-ws-google-del", email);
    del.setAttribute("aria-label", "Remove");
    del.textContent = "×";

    actions.appendChild(del);

    row.appendChild(icon);
    row.appendChild(meta);
    row.appendChild(actions);
    root.appendChild(row);
  });
}

function spacingToGap(value) {
  if (value === "compact") return 8;
  if (value === "spacious") return 16;
  return 12;
}

function renderPreview(state) {
  const preview = document.getElementById("ws-preview");
  if (!preview) return;

  preview.setAttribute("data-template", state.bio.template || "minimal");

  const tp = preview.querySelector(".tp");
  if (tp) {
    const primary = state.branding.primary || "#f08a2a";
    const accent2 = mix(primary, "#ffffff", 0.25);
    const dark = Boolean(state.branding.dark);

    const bg = dark ? "#0b1220" : state.branding.bg || "#ffffff";
    const text = dark ? "#f9fafb" : state.branding.text || "#111827";
    const surface = dark ? "rgba(17, 24, 39, 0.72)" : "rgba(255, 255, 255, 0.92)";
    const muted = dark ? "rgba(249, 250, 251, 0.76)" : "#6b7280";

    tp.style.setProperty("--tp-bg", bg);
    tp.style.setProperty("--tp-surface", surface);
    tp.style.setProperty("--tp-text", text);
    tp.style.setProperty("--tp-muted", muted);
    tp.style.setProperty("--tp-accent", primary);
    tp.style.setProperty("--tp-accent-2", accent2);
    tp.style.setProperty("--tp-gap", `${spacingToGap(state.bio.spacing)}px`);
    tp.style.setProperty("--tp-link-radius", `${Number(state.bio.radius) || 999}px`);
    tp.setAttribute("data-btn", state.bio.buttonStyle || "filled");
  }

  const pn = document.getElementById("ws-preview-name");
  const pb = document.getElementById("ws-preview-bio");
  if (pn) pn.textContent = state.profile.name || "Your Name";
  if (pb) pb.textContent = state.profile.bio || "Your bio will show here.";

  const avatar = document.getElementById("ws-preview-avatar");
  if (avatar) {
    if (state.profile.logo) {
      avatar.style.backgroundImage = `url("${state.profile.logo}")`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
    } else {
      avatar.style.backgroundImage = "";
      avatar.style.backgroundSize = "";
      avatar.style.backgroundPosition = "";
    }
  }

  const url = document.getElementById("ws-preview-url");
  if (url) {
    const handle = normalizeHandle(state.profile.handle || "");
    url.textContent = handle ? `/${handle}` : "/username";
  }

  const viewPublic = document.getElementById("workspace-view-public");
  if (viewPublic) {
    const handle = normalizeHandle(state.profile.handle || "");
    const base = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "/")}`;
    viewPublic.setAttribute("href", handle ? `${base}?u=${encodeURIComponent(handle)}` : base);
  }

  const linksRoot = document.getElementById("ws-preview-links");
  if (linksRoot) {
    linksRoot.innerHTML = "";
    const items = Array.isArray(state.links) ? state.links : [];
    const max = Math.min(items.length, 6);
    for (let i = 0; i < max; i++) {
      const l = items[i];
      const a = document.createElement("a");
      a.className = i === 0 ? "tp__link tp__link--primary" : "tp__link";
      a.href = l.url || "#";
      a.textContent = l.title || "Untitled";
      linksRoot.appendChild(a);
    }
    if (max === 0) {
      const a = document.createElement("a");
      a.className = "tp__link tp__link--primary";
      a.href = "#";
      a.textContent = "Add your first link";
      linksRoot.appendChild(a);
    }
  }
}

function initWorkspace() {
  const workspace = document.getElementById("workspace");
  if (!workspace) return;

  let state = getWorkspace();
  let editingLinkId = null;
  const wsTouched = {};

  const wsSchema = {
    "ws-name": [FormValidationCore.required("Name is required."), FormValidationCore.maxLength(80, "Name is too long.")],
    "ws-handle": [FormValidationCore.required("Handle is required."), FormValidationCore.maxLength(32, "Handle is too long.")],
    "ws-bio": [FormValidationCore.maxLength(160, "Bio is too long.")],
    "ws-location": [FormValidationCore.maxLength(60, "Location is too long.")],
    "ws-website": [FormValidationCore.urlLike("Use https://, mailto:, or tel:")],
    "ws-email": [FormValidationCore.email("Enter a valid email.")],
    "ws-phone": [FormValidationCore.maxLength(24, "Phone is too long.")],
    "ws-link-title": [FormValidationCore.required("Title is required."), FormValidationCore.maxLength(40, "Title is too long.")],
    "ws-link-url": [FormValidationCore.required("URL is required."), FormValidationCore.urlLike("Use https://, mailto:, or tel:")],
    "ws-google-email": [
      FormValidationCore.required("Email is required."),
      FormValidationCore.email("Enter a valid email."),
      (value) => {
        const v = String(value ?? "").trim().toLowerCase();
        if (!v) return "";
        if (!/@(gmail\.com|googlemail\.com)$/.test(v)) return "Must be a Gmail/Googlemail address.";
        return "";
      },
    ],
  };

  const wsValidateInput = (el, markTouched) => {
    if (!(el instanceof HTMLElement)) return "";
    const id = el.getAttribute("id") || "";
    const validators = wsSchema[id];
    if (!validators) return "";
    if (markTouched) wsTouched[id] = true;
    const value = el.value ?? "";
    let msg = "";
    for (const fn of validators) {
      msg = fn(value);
      if (msg) break;
    }
    if (wsTouched[id]) FormUI.setFieldError("workspace", el, msg);
    return msg;
  };

  const wsBindValidation = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("blur", () => {
      wsValidateInput(el, true);
    });
    el.addEventListener("input", () => {
      if (wsTouched[id]) wsValidateInput(el, false);
    });
  };

  Object.keys(wsSchema).forEach((id) => {
    if (id === "ws-link-title" || id === "ws-link-url") return;
    wsBindValidation(id);
  });
  wsBindValidation("ws-link-title");
  wsBindValidation("ws-link-url");

  const googleAdd = document.getElementById("ws-google-add");
  if (googleAdd) {
    googleAdd.addEventListener("click", () => {
      const input = document.getElementById("ws-google-email");
      if (!(input instanceof HTMLInputElement)) return;
      const msg = wsValidateInput(input, true);
      if (msg) return;
      const email = String(input.value || "").trim().toLowerCase();
      const current = Array.isArray(state.account.googleAccounts) ? state.account.googleAccounts : [];
      const next = current.includes(email) ? current : [...current, email];
      state = { ...state, account: { ...state.account, googleAccounts: next } };
      setWorkspace(state);
      input.value = "";
      FormUI.clearFieldError("workspace", input);
      renderWorkspace(state);
    });
  }

  const logo = document.getElementById("ws-logo");
  if (logo) {
    logo.addEventListener("change", async () => {
      const file = logo.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state = { ...state, profile: { ...state.profile, logo: String(reader.result || "") } };
        setWorkspace(state);
        renderWorkspace(state);
      };
      reader.readAsDataURL(file);
    });
  }

  const onInput = (id, fn) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      state = fn(el.value);
      setWorkspace(state);
      renderPreview(state);
      if (wsTouched[id]) wsValidateInput(el, false);
      if (id === "ws-handle") {
        const v = normalizeHandle(el.value);
        el.value = v;
        state = { ...state, profile: { ...state.profile, handle: v } };
        setWorkspace(state);
        renderPreview(state);
        if (wsTouched[id]) wsValidateInput(el, false);
      }
    });
  };

  onInput("ws-name", (v) => ({ ...state, profile: { ...state.profile, name: v } }));
  onInput("ws-handle", (v) => ({ ...state, profile: { ...state.profile, handle: v } }));
  onInput("ws-bio", (v) => ({ ...state, profile: { ...state.profile, bio: v } }));
  onInput("ws-location", (v) => ({ ...state, profile: { ...state.profile, location: v } }));
  onInput("ws-website", (v) => ({ ...state, profile: { ...state.profile, website: v } }));
  onInput("ws-email", (v) => {
    try {
      window.localStorage.setItem("lb_email", v);
    } catch {}
    return { ...state, account: { ...state.account, email: v } };
  });
  onInput("ws-phone", (v) => ({ ...state, account: { ...state.account, phone: v } }));
  onInput("ws-color-primary", (v) => ({ ...state, branding: { ...state.branding, primary: v } }));
  onInput("ws-color-bg", (v) => ({ ...state, branding: { ...state.branding, bg: v } }));
  onInput("ws-color-text", (v) => ({ ...state, branding: { ...state.branding, text: v } }));
  onInput("ws-button-style", (v) => ({ ...state, bio: { ...state.bio, buttonStyle: v } }));
  onInput("ws-radius", (v) => ({ ...state, bio: { ...state.bio, radius: Number(v) } }));
  onInput("ws-spacing", (v) => ({ ...state, bio: { ...state.bio, spacing: v } }));

  const darkToggle = document.getElementById("ws-dark-toggle");
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      state = { ...state, branding: { ...state.branding, dark: !state.branding.dark } };
      setWorkspace(state);
      renderWorkspace(state);
    });
  }

  const addBtn = document.getElementById("ws-link-add");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const title = document.getElementById("ws-link-title");
      const url = document.getElementById("ws-link-url");
      const t = String(title?.value || "").trim();
      const u = String(url?.value || "").trim();
      const titleMsg = title ? wsValidateInput(title, true) : "";
      const urlMsg = url ? wsValidateInput(url, true) : "";
      if (titleMsg || urlMsg) return;

      const nextLinks = Array.isArray(state.links) ? [...state.links] : [];
      if (editingLinkId) {
        const idx = nextLinks.findIndex((l) => l.id === editingLinkId);
        if (idx >= 0) nextLinks[idx] = { ...nextLinks[idx], title: t, url: u };
        editingLinkId = null;
        addBtn.textContent = "Add";
      } else {
        const id = `l_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        nextLinks.push({ id, title: t, url: u });
      }

      if (title) title.value = "";
      if (url) url.value = "";
      if (title) FormUI.clearFieldError("workspace", title);
      if (url) FormUI.clearFieldError("workspace", url);

      state = { ...state, links: nextLinks };
      setWorkspace(state);
      renderWorkspace(state);
    });
  }

  const panelButtons = workspace.querySelectorAll("[data-ws-panel]");
  panelButtons.forEach((btn) => {
    if (!(btn instanceof HTMLButtonElement)) return;
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-ws-panel");
      if (!target) return;
      workspace.querySelectorAll(".ws-nav__item").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      workspace.querySelectorAll(".ws-panel").forEach((p) => {
        p.classList.toggle("is-active", p.getAttribute("data-ws-panel") === target);
      });
    });
  });

  workspace.querySelectorAll("[data-ws-template]").forEach((btn) => {
    if (!(btn instanceof HTMLButtonElement)) return;
    btn.addEventListener("click", () => {
      const template = btn.getAttribute("data-ws-template");
      if (!template) return;
      state = { ...state, bio: { ...state.bio, template } };
      setWorkspace(state);
      renderWorkspace(state);
    });
  });

  const linksRoot = document.getElementById("ws-links");
  if (linksRoot) {
    let dragId = null;

    linksRoot.addEventListener("dragstart", (e) => {
      const row = e.target.closest("[data-link-id]");
      if (!row) return;
      dragId = row.getAttribute("data-link-id");
      e.dataTransfer?.setData("text/plain", dragId || "");
      e.dataTransfer?.setDragImage(row, 10, 10);
    });

    linksRoot.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    linksRoot.addEventListener("drop", (e) => {
      e.preventDefault();
      const targetRow = e.target.closest("[data-link-id]");
      if (!targetRow) return;
      const targetId = targetRow.getAttribute("data-link-id");
      const from = dragId || e.dataTransfer?.getData("text/plain");
      if (!from || !targetId || from === targetId) return;

      const next = [...state.links];
      const fromIdx = next.findIndex((l) => l.id === from);
      const toIdx = next.findIndex((l) => l.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      state = { ...state, links: next };
      setWorkspace(state);
      renderWorkspace(state);
    });
  }

  workspace.addEventListener("click", (e) => {
    const del = e.target.closest("[data-ws-link-del]");
    if (del) {
      const id = del.getAttribute("data-ws-link-del");
      if (!id) return;
      state = { ...state, links: state.links.filter((l) => l.id !== id) };
      setWorkspace(state);
      renderWorkspace(state);
      return;
    }

    const edit = e.target.closest("[data-ws-link-edit]");
    if (edit) {
      const id = edit.getAttribute("data-ws-link-edit");
      if (!id) return;
      const link = state.links.find((l) => l.id === id);
      if (!link) return;
      const title = document.getElementById("ws-link-title");
      const url = document.getElementById("ws-link-url");
      const add = document.getElementById("ws-link-add");
      if (title) title.value = link.title || "";
      if (url) url.value = link.url || "";
      if (add) add.textContent = "Save";
      editingLinkId = id;
      return;
    }
  });

  const publish = document.getElementById("workspace-publish");
  if (publish) {
    publish.addEventListener("click", () => {
      let hasError = false;
      Object.keys(wsSchema).forEach((id) => {
        if (id === "ws-link-title" || id === "ws-link-url") return;
        const el = document.getElementById(id);
        if (!el) return;
        const msg = wsValidateInput(el, true);
        if (msg) hasError = true;
      });
      if (hasError) {
        const firstInvalid = workspace.querySelector('[aria-invalid="true"]');
        if (firstInvalid && typeof firstInvalid.focus === "function") firstInvalid.focus();
        return;
      }
      state = { ...state, bio: { ...state.bio, published: true } };
      setWorkspace(state);
      publish.textContent = "Saved";
      window.setTimeout(() => {
        publish.textContent = "Publish changes";
      }, 900);
    });
  }

  const logoutAll = document.getElementById("ws-logout-all");
  if (logoutAll) {
    logoutAll.addEventListener("click", () => {
      setLoggedOut();
      updateAuthVisibility();
      window.location.href = "./index.html";
    });
  }

  renderWorkspace(state);
}

function activateWorkspacePanel(panelId) {
  const workspace = document.getElementById("workspace");
  if (!workspace) return;
  if (workspace.hidden) workspace.hidden = false;
  const btn = workspace.querySelector(`.ws-nav__item[data-ws-panel="${CSS.escape(panelId)}"]`);
  if (btn instanceof HTMLButtonElement) btn.click();
}

const logoutBtn = document.getElementById("btn-logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    setLoggedOut();
    updateAuthVisibility();
    window.location.href = "./index.html";
  });
}

const navProfileSettings = document.getElementById("nav-profile-settings");
if (navProfileSettings) {
  navProfileSettings.addEventListener("click", () => {
    closeAllDropdowns();
    window.location.hash = "#workspace";
    window.setTimeout(() => {
      activateWorkspacePanel("account");
    }, 0);
  });
}

const navProfileLogout = document.getElementById("nav-profile-logout");
if (navProfileLogout) {
  navProfileLogout.addEventListener("click", () => {
    closeAllDropdowns();
    setLoggedOut();
    updateAuthVisibility();
    window.location.href = "./index.html";
  });
}

initFormSystem();
updateAuthVisibility();
initWorkspace();

const ChatbotFlow = (() => {
  const TEMPLATE_MAP = {
    Minimal: "minimal",
    Grid: "grid",
    Story: "feed",
    Editorial: "editorial",
    Conversion: "booking",
    Creative: "experimental",
  };

  const state = {
    path: ["start"],
  };

  function el(id) {
    return document.getElementById(id);
  }

  function progress(flow, step, total) {
    if (!flow) return "";
    if (!step || !total) return flow;
    return `${flow} · Step ${step} of ${total}`;
  }

  function getContext() {
    const loggedIn = isLoggedIn();
    const ws = loggedIn && typeof getWorkspace === "function" ? getWorkspace() : null;
    return { loggedIn, ws };
  }

  function buildPublicProfileUrl(ws) {
    const handle = normalizeHandle(ws?.profile?.handle || "");
    const base = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "/")}`;
    return handle ? `${base}?u=${encodeURIComponent(handle)}` : base;
  }

  function requireLogin() {
    if (isLoggedIn()) return true;
    const loginLink = document.getElementById("auth-login-link");
    if (loginLink) loginLink.setAttribute("href", buildLoginUrl("./index.html#workspace"));
    closeAllDropdowns();
    openModal("auth");
    return false;
  }

  function goWorkspace(panelId) {
    if (!requireLogin()) return;
    closeAllModals();
    window.location.hash = "#workspace";
    window.setTimeout(() => {
      if (panelId) activateWorkspacePanel(panelId);
    }, 0);
  }

  function copyToClipboard(text) {
    const value = String(text || "");
    if (!value) return Promise.resolve(false);
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value).then(() => true, () => false);

    const input = document.createElement("input");
    input.value = value;
    input.setAttribute("readonly", "true");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    input.remove();
    return Promise.resolve(ok);
  }

  function setTemplate(label) {
    if (!requireLogin()) return;
    const id = TEMPLATE_MAP[label] || "minimal";
    const ws = getWorkspace();
    setWorkspace({ ...ws, bio: { ...ws.bio, template: id } });
  }

  function publishWorkspace() {
    if (!requireLogin()) return;
    closeAllModals();
    window.location.hash = "#workspace";
    window.setTimeout(() => {
      const btn = document.getElementById("workspace-publish");
      if (btn instanceof HTMLButtonElement) btn.click();
    }, 0);
  }

  function openLoginPage() {
    window.location.href = buildLoginUrl("./index.html#workspace");
  }

  function nodes(ctx) {
    const tip = (() => {
      if (!ctx.loggedIn) return "";
      if (ctx.ws?.bio?.published) return "";
      return "Quick tip: publish your bio page for a fast “shareable link” win.";
    })();

    return {
      start: {
        progress: "Start",
        message: tip ? `Welcome to LensBlaze. What would you like to do? ${tip}` : "Welcome to LensBlaze. What would you like to do?",
        options: [
          { label: "Get started", next: "onboarding_start" },
          { label: "Build my bio page", next: "bio_entry" },
          { label: "Deliver photos to clients", next: "gallery_entry" },
          { label: "Sell prints or downloads", next: "store_entry" },
          { label: "Manage bookings", next: "booking_entry" },
          { label: "Fix an issue", next: "issue_entry" },
          { label: "Pricing & plans", next: "pricing_entry" },
        ],
      },

      onboarding_start: {
        progress: progress("Get Started", 1, 2),
        message: "Are you new to LensBlaze?",
        options: [
          { label: "Yes, I’m new", next: "onboarding_new" },
          {
            label: "I already have an account",
            action: () => {
              if (ctx.loggedIn) goWorkspace("profile");
              else openLoginPage();
            },
          },
        ],
      },

      onboarding_new: {
        progress: progress("Get Started", 2, 2),
        message: "What do you want to set up first?",
        options: [
          { label: "Bio page (quick start)", next: "bio_entry" },
          { label: "Client galleries", next: "gallery_entry" },
          { label: "Full website", next: "website_entry" },
          {
            label: "Just explore",
            action: () => {
              closeAllModals();
              window.location.hash = "#overview";
            },
          },
        ],
      },

      bio_entry: {
        progress: progress("Bio Page", 1, 3),
        message: "Let’s create your bio page.",
        options: [{ label: "Choose a style", next: "bio_style" }],
      },

      bio_style: {
        progress: progress("Bio Page", 1, 3),
        message: "Choose a style:",
        options: [
          { label: "Minimal", next: "bio_add", action: () => setTemplate("Minimal") },
          { label: "Grid", next: "bio_add", action: () => setTemplate("Grid") },
          { label: "Story", next: "bio_add", action: () => setTemplate("Story") },
          { label: "Editorial", next: "bio_add", action: () => setTemplate("Editorial") },
          { label: "Conversion", next: "bio_add", action: () => setTemplate("Conversion") },
          { label: "Creative", next: "bio_add", action: () => setTemplate("Creative") },
        ],
      },

      bio_add: {
        progress: progress("Bio Page", 2, 3),
        message: "What would you like to add?",
        options: [
          { label: "Add links", action: () => goWorkspace("links") },
          { label: "Add gallery", action: () => goWorkspace("galleries") },
          { label: "Add booking button", action: () => goWorkspace("bookings") },
          { label: "Customize design", action: () => goWorkspace("bio") },
          { label: "Continue", next: "bio_publish" },
        ],
      },

      bio_publish: {
        progress: progress("Bio Page", 3, 3),
        message: "Ready to publish?",
        options: [
          { label: "Publish now", action: () => publishWorkspace(), next: "bio_exit" },
          { label: "Preview first", action: () => goWorkspace("bio") },
          { label: "Edit more", action: () => goWorkspace("profile") },
          { label: "Continue", next: "bio_exit" },
        ],
      },

      bio_exit: {
        progress: "Bio Page",
        message: "Your bio page is live. Want to share it?",
        options: [
          {
            label: "Copy link",
            action: async () => {
              const nextCtx = getContext();
              if (!nextCtx.loggedIn) {
                openLoginPage();
                return;
              }
              const url = buildPublicProfileUrl(nextCtx.ws);
              const ok = await copyToClipboard(url);
              const status = el("chatbot-message");
              if (status) status.textContent = ok ? "Copied your bio page link." : "Couldn’t copy automatically. Open the page and copy the URL.";
            },
          },
          {
            label: "Open page",
            action: () => {
              const nextCtx = getContext();
              if (!nextCtx.loggedIn) {
                openLoginPage();
                return;
              }
              window.open(buildPublicProfileUrl(nextCtx.ws), "_blank", "noopener");
            },
          },
          { label: "Continue setup", next: "onboarding_new" },
          { label: "Go to dashboard", action: () => goWorkspace("profile") },
        ],
      },

      gallery_entry: {
        progress: "Client Galleries",
        message: "Upload and deliver photos to your clients. What would you like to do?",
        options: [
          { label: "Upload new gallery", next: "gallery_upload" },
          { label: "Share gallery", next: "gallery_share" },
          { label: "Enable downloads", next: "gallery_downloads" },
          { label: "Client proofing", next: "gallery_proofing" },
        ],
      },

      gallery_upload: {
        progress: progress("Client Galleries", 1, 4),
        message: "Upload your images and name your gallery.",
        options: [
          { label: "Continue upload", action: () => goWorkspace("galleries") },
          { label: "Cancel", next: "start" },
        ],
      },

      gallery_share: {
        progress: progress("Client Galleries", 2, 4),
        message: "Set access permissions and send your gallery to the client.",
        options: [
          { label: "Public", action: () => goWorkspace("galleries") },
          { label: "Private (link only)", action: () => goWorkspace("galleries") },
          { label: "Password protected", action: () => goWorkspace("galleries") },
          { label: "Done", next: "start" },
        ],
      },

      gallery_downloads: {
        progress: progress("Client Galleries", 3, 4),
        message: "Enable features like favorites, downloads, and watermarking.",
        options: [
          { label: "Favorites", action: () => goWorkspace("galleries") },
          { label: "Downloads", action: () => goWorkspace("galleries") },
          { label: "Watermark", action: () => goWorkspace("galleries") },
          { label: "Done", next: "start" },
        ],
      },

      gallery_proofing: {
        progress: progress("Client Galleries", 4, 4),
        message: "Proofing helps clients select their favorites quickly.",
        options: [
          { label: "Enable proofing", action: () => goWorkspace("galleries") },
          { label: "Done", next: "start" },
        ],
      },

      store_entry: {
        progress: "Store",
        message: "Start selling your work. What do you want to sell?",
        options: [
          { label: "Prints", next: "store_pricing" },
          { label: "Digital downloads", next: "store_pricing" },
          { label: "Packages", next: "store_pricing" },
        ],
      },

      store_pricing: {
        progress: progress("Store", 2, 3),
        message: "Set pricing:",
        options: [
          { label: "Add price", action: () => goWorkspace("store") },
          { label: "Create package", action: () => goWorkspace("store") },
          { label: "Add discount", action: () => goWorkspace("store") },
          { label: "Continue", next: "store_checkout" },
        ],
      },

      store_checkout: {
        progress: progress("Store", 3, 3),
        message: "Enable checkout?",
        options: [
          { label: "Yes", action: () => goWorkspace("store") },
          { label: "Not now", next: "start" },
        ],
      },

      booking_entry: {
        progress: "Bookings & Leads",
        message: "Capture and manage client inquiries. What do you want to do?",
        options: [
          { label: "Create inquiry form", next: "booking_fields" },
          { label: "View leads", action: () => goWorkspace("bookings") },
          { label: "Automate replies", next: "booking_autoresponse" },
        ],
      },

      booking_fields: {
        progress: progress("Bookings & Leads", 2, 3),
        message: "Add fields to your form:",
        options: [
          { label: "Name", action: () => goWorkspace("bookings") },
          { label: "Email", action: () => goWorkspace("bookings") },
          { label: "Event type", action: () => goWorkspace("bookings") },
          { label: "Message", action: () => goWorkspace("bookings") },
          { label: "Continue", next: "booking_autoresponse" },
        ],
      },

      booking_autoresponse: {
        progress: progress("Bookings & Leads", 3, 3),
        message: "Enable auto-response?",
        options: [
          { label: "Yes", action: () => goWorkspace("bookings") },
          { label: "No", action: () => goWorkspace("bookings") },
          { label: "Done", next: "start" },
        ],
      },

      website_entry: {
        progress: "Website Builder",
        message: "Build your photography website. Choose a layout:",
        options: [
          { label: "Portfolio", next: "website_sections" },
          { label: "Business", next: "website_sections" },
          { label: "Personal brand", next: "website_sections" },
        ],
      },

      website_sections: {
        progress: progress("Website Builder", 2, 3),
        message: "Add sections:",
        options: [
          { label: "Gallery", action: () => goWorkspace("galleries") },
          { label: "About", action: () => goWorkspace("profile") },
          { label: "Contact", action: () => closeAllModals() },
          { label: "Services", action: () => goWorkspace("store") },
          { label: "Continue", next: "website_domain" },
        ],
      },

      website_domain: {
        progress: progress("Website Builder", 3, 3),
        message: "Connect domain?",
        options: [
          { label: "Yes", action: () => goWorkspace("account") },
          { label: "Later", next: "start" },
        ],
      },

      pricing_entry: {
        progress: "Pricing & Plans",
        message: "Explore plans and features. What do you want to know?",
        options: [
          {
            label: "Free plan details",
            action: () => {
              closeAllModals();
              window.location.hash = "#pricing";
            },
          },
          {
            label: "Trial (30/60/90 days)",
            action: () => {
              closeAllModals();
              window.location.hash = "#pricing";
            },
          },
          {
            label: "Upgrade options",
            action: () => {
              closeAllModals();
              window.location.hash = "#pricing";
            },
          },
          { label: "Do you want to upgrade?", next: "pricing_upgrade" },
        ],
      },

      pricing_upgrade: {
        progress: "Pricing & Plans",
        message: "Do you want to upgrade?",
        options: [
          { label: "Yes", action: () => (closeAllModals(), openModal("contact")) },
          { label: "Not now", next: "start" },
        ],
      },

      issue_entry: {
        progress: "Fix an Issue",
        message: "What issue are you facing?",
        options: [
          { label: "Login problem", next: "issue_login" },
          { label: "Gallery not working", next: "issue_gallery" },
          { label: "Payment issue", next: "issue_payment" },
          { label: "Email not sending", next: "issue_email" },
          { label: "Something else", next: "issue_other" },
        ],
      },

      issue_login: {
        progress: "Fix an Issue",
        message: "Try: reset password and check email verification.",
        options: [
          { label: "Reset now", action: () => (window.location.href = "mailto:support@lensblaze.com?subject=Password%20reset") },
          { label: "Contact support", action: () => (closeAllModals(), openModal("contact")) },
          { label: "Back to menu", next: "start" },
        ],
      },

      issue_gallery: {
        progress: "Fix an Issue",
        message: "If galleries are not loading, confirm access settings and try again.",
        options: [
          { label: "Open galleries settings", action: () => goWorkspace("galleries") },
          { label: "Contact support", action: () => (closeAllModals(), openModal("contact")) },
          { label: "Back to menu", next: "start" },
        ],
      },

      issue_payment: {
        progress: "Fix an Issue",
        message: "For payment issues, confirm plan status and checkout details.",
        options: [
          { label: "View billing", action: () => goWorkspace("billing") },
          { label: "Contact support", action: () => (closeAllModals(), openModal("contact")) },
          { label: "Back to menu", next: "start" },
        ],
      },

      issue_email: {
        progress: "Fix an Issue",
        message: "If emails are not sending, double-check address and spam folder.",
        options: [
          { label: "Check notifications", action: () => goWorkspace("notifications") },
          { label: "Contact support", action: () => (closeAllModals(), openModal("contact")) },
          { label: "Back to menu", next: "start" },
        ],
      },

      issue_other: {
        progress: "Fix an Issue",
        message: "Still need help?",
        options: [
          { label: "Contact support", action: () => (closeAllModals(), openModal("contact")) },
          { label: "Restart", action: () => restart() },
        ],
      },
    };
  }

  function render() {
    const root = el("modal-chatbot");
    const msgEl = el("chatbot-message");
    const optionsEl = el("chatbot-options");
    const progressEl = el("chatbot-progress");
    const backBtn = el("chatbot-back");

    if (!root || !msgEl || !optionsEl || !progressEl) return;

    const ctx = getContext();
    const all = nodes(ctx);
    const currentId = state.path[state.path.length - 1] || "start";
    const node = all[currentId] || all.start;

    progressEl.textContent = node.progress || "";
    msgEl.textContent = node.message || "";

    optionsEl.innerHTML = "";
    (node.options || []).forEach((opt, idx) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "ws-link";
      row.setAttribute("data-chat-option", String(idx));

      const icon = document.createElement("div");
      icon.className = "ws-link__drag";
      icon.textContent = String(idx + 1);

      const meta = document.createElement("div");
      meta.className = "ws-link__meta";

      const title = document.createElement("div");
      title.className = "ws-link__title";
      title.textContent = opt.label || "Option";

      const hint = document.createElement("div");
      hint.className = "ws-link__url";
      hint.textContent = opt.next ? "Continue" : "Open";

      meta.appendChild(title);
      meta.appendChild(hint);

      const actions = document.createElement("div");
      actions.className = "ws-link__actions";

      const arrow = document.createElement("div");
      arrow.className = "ws-link__btn";
      arrow.textContent = "→";
      actions.appendChild(arrow);

      row.appendChild(icon);
      row.appendChild(meta);
      row.appendChild(actions);

      row.addEventListener("click", async () => {
        const nextCtx = getContext();
        const allNow = nodes(nextCtx);
        const activeId = state.path[state.path.length - 1] || "start";
        const active = allNow[activeId] || allNow.start;
        const nextOpt = (active.options || [])[idx];
        if (!nextOpt) return;
        if (typeof nextOpt.action === "function") await nextOpt.action();
        if (nextOpt.next) {
          state.path.push(nextOpt.next);
          render();
        }
      });

      optionsEl.appendChild(row);
    });

    if (backBtn instanceof HTMLButtonElement) backBtn.disabled = state.path.length <= 1;
  }

  function back() {
    if (state.path.length <= 1) return;
    state.path.pop();
    render();
  }

  function restart() {
    state.path = ["start"];
    render();
  }

  function bind() {
    const root = el("modal-chatbot");
    if (!root) return;

    const backBtn = el("chatbot-back");
    if (backBtn instanceof HTMLButtonElement) backBtn.addEventListener("click", () => back());

    const restartBtn = el("chatbot-restart");
    if (restartBtn instanceof HTMLButtonElement) restartBtn.addEventListener("click", () => restart());

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest('[data-modal="chatbot"]');
      if (!trigger) return;
      window.setTimeout(() => {
        restart();
      }, 0);
    });

    render();
  }

  bind();

  return { restart };
})();

const ShortLinks = (() => {
  const STORAGE_KEY = "lb_shortlinks_v1";
  const API_URL = "./api/shortlinks.php";
  const urlLikeRe = /^(https?:\/\/|mailto:|tel:)/i;

  function nowMs() {
    return Date.now();
  }

  function safeGetLinks() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = safeParseJson(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function safeSetLinks(links) {
    safeSetJson(STORAGE_KEY, links);
  }

  function baseUrl() {
    return `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "/")}`;
  }

  function buildShortUrl(code) {
    return `${baseUrl()}?s=${encodeURIComponent(code)}`;
  }

  function normalizeUrl(raw) {
    return String(raw || "").trim();
  }

  function isValidUrl(raw) {
    const v = normalizeUrl(raw);
    if (!v) return false;
    if (/\s/.test(v)) return false;
    if (!urlLikeRe.test(v)) return false;
    if (v.length > 2048) return false;
    return true;
  }

  function isExpired(expiresAtMs) {
    if (!expiresAtMs) return false;
    return nowMs() > Number(expiresAtMs);
  }

  function bytesToBase64Url(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  async function generateCode(seed) {
    const salt = new Uint8Array(16);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(salt);
    const basis = `${seed}|${bytesToBase64Url(salt)}|${nowMs()}`;

    if (window.crypto?.subtle?.digest) {
      const data = new TextEncoder().encode(basis);
      const hash = await window.crypto.subtle.digest("SHA-256", data);
      const out = new Uint8Array(hash);
      return bytesToBase64Url(out).slice(0, 10);
    }

    const fallback = new Uint8Array(12);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(fallback);
    return bytesToBase64Url(fallback).slice(0, 10);
  }

  async function apiCreate(url, expiresInDays) {
    const body = { action: "create", url, expiresInDays };
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("api");
    const json = await res.json();
    if (!json?.ok || !json?.code) throw new Error("api");
    return { code: String(json.code), shortUrl: String(json.shortUrl || buildShortUrl(json.code)) };
  }

  async function apiResolve(code) {
    const url = `${API_URL}?action=resolve&code=${encodeURIComponent(code)}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error("api");
    const json = await res.json();
    if (!json?.ok || !json?.url) throw new Error("api");
    return { url: String(json.url) };
  }

  async function create(rawUrl, expiresInDays) {
    const url = normalizeUrl(rawUrl);
    const exp = Number(expiresInDays);
    const days = Number.isFinite(exp) ? exp : 7;
    if (!isValidUrl(url)) return { ok: false, message: "Enter a valid URL (https://, mailto:, or tel:)." };

    const useApi = window.location.protocol === "https:" || window.location.hostname === "localhost";
    if (useApi) {
      try {
        const api = await apiCreate(url, days);
        return { ok: true, code: api.code, shortUrl: api.shortUrl };
      } catch {}
    }

    const links = safeGetLinks();
    let code = await generateCode(url);
    while (links.some((l) => l.code === code)) {
      code = await generateCode(url);
    }

    const createdAt = nowMs();
    const expiresAt = days === 0 ? null : createdAt + days * 24 * 60 * 60 * 1000;
    const next = [
      {
        code,
        url,
        createdAt,
        expiresAt,
        clicks: 0,
        lastClickAt: null,
      },
      ...links,
    ].slice(0, 50);
    safeSetLinks(next);
    return { ok: true, code, shortUrl: buildShortUrl(code) };
  }

  function resolveLocal(code) {
    const links = safeGetLinks();
    const idx = links.findIndex((l) => l.code === code);
    if (idx < 0) return { ok: false, message: "Short link not found in this browser." };
    const item = links[idx];
    if (isExpired(item.expiresAt)) return { ok: false, message: "This short link has expired." };
    const next = [...links];
    next[idx] = {
      ...item,
      clicks: Number(item.clicks || 0) + 1,
      lastClickAt: nowMs(),
    };
    safeSetLinks(next);
    return { ok: true, url: String(item.url || "") };
  }

  async function resolve(code) {
    const clean = String(code || "").trim();
    if (!clean) return { ok: false, message: "Missing short link code." };

    const useApi = window.location.protocol === "https:" || window.location.hostname === "localhost";
    if (useApi) {
      try {
        const api = await apiResolve(clean);
        return { ok: true, url: api.url };
      } catch {}
    }

    return resolveLocal(clean);
  }

  function updateShareLinks(shortUrl) {
    const x = document.getElementById("share-x");
    const wa = document.getElementById("share-whatsapp");
    const fb = document.getElementById("share-facebook");
    const u = encodeURIComponent(String(shortUrl || ""));
    if (x) x.setAttribute("href", `https://twitter.com/intent/tweet?url=${u}`);
    if (wa) wa.setAttribute("href", `https://wa.me/?text=${u}`);
    if (fb) fb.setAttribute("href", `https://www.facebook.com/sharer/sharer.php?u=${u}`);
  }

  function renderList() {
    const root = document.getElementById("share-list");
    if (!root) return;
    root.innerHTML = "";
    const links = safeGetLinks();
    if (!links.length) {
      const empty = document.createElement("div");
      empty.className = "ws-empty";
      empty.textContent = "No short links created yet.";
      root.appendChild(empty);
      return;
    }

    links.forEach((l) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "ws-link";
      row.setAttribute("data-share-code", String(l.code || ""));

      const icon = document.createElement("div");
      icon.className = "ws-link__drag";
      icon.textContent = "🔗";

      const meta = document.createElement("div");
      meta.className = "ws-link__meta";

      const title = document.createElement("div");
      title.className = "ws-link__title";
      title.textContent = buildShortUrl(l.code);

      const hint = document.createElement("div");
      hint.className = "ws-link__url";
      const clicks = Number(l.clicks || 0);
      hint.textContent = isExpired(l.expiresAt) ? `Expired · ${clicks} clicks` : `${clicks} clicks`;

      meta.appendChild(title);
      meta.appendChild(hint);

      const actions = document.createElement("div");
      actions.className = "ws-link__actions";

      const open = document.createElement("div");
      open.className = "ws-link__btn";
      open.textContent = "→";
      actions.appendChild(open);

      row.appendChild(icon);
      row.appendChild(meta);
      row.appendChild(actions);
      root.appendChild(row);
    });
  }

  function getDefaultShareUrl() {
    if (!isLoggedIn() || typeof getWorkspace !== "function") return "";
    const ws = getWorkspace();
    const handle = normalizeHandle(ws?.profile?.handle || "");
    const base = baseUrl();
    return handle ? `${base}?u=${encodeURIComponent(handle)}` : base;
  }

  async function copy(text) {
    const value = String(text || "");
    if (!value) return false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {}
    }
    const input = document.createElement("input");
    input.value = value;
    input.setAttribute("readonly", "true");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    input.remove();
    return ok;
  }

  function bindShareUi() {
    const modal = document.getElementById("modal-share");
    if (!modal) return;

    const urlInput = document.getElementById("share-url");
    const exp = document.getElementById("share-exp");
    const createBtn = document.getElementById("share-create");
    const status = document.getElementById("share-status");
    const out = document.getElementById("share-short");
    const copyBtn = document.getElementById("share-copy");

    const setStatusText = (t) => {
      if (status) status.textContent = String(t || "");
    };

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest('[data-modal="share"]');
      if (!trigger) return;
      window.setTimeout(() => {
        if (urlInput instanceof HTMLInputElement) {
          urlInput.value = getDefaultShareUrl();
        }
        if (out instanceof HTMLInputElement) out.value = "";
        updateShareLinks("");
        setStatusText("");
        renderList();
      }, 0);
    });

    if (createBtn instanceof HTMLButtonElement) {
      createBtn.addEventListener("click", async () => {
        if (!(urlInput instanceof HTMLInputElement)) return;
        const expDays = exp instanceof HTMLSelectElement ? Number(exp.value) : 7;
        createBtn.disabled = true;
        setStatusText("Generating…");
        const res = await create(urlInput.value, expDays);
        createBtn.disabled = false;
        if (!res.ok) {
          setStatusText(res.message || "Could not create short link.");
          return;
        }
        if (out instanceof HTMLInputElement) out.value = res.shortUrl;
        updateShareLinks(res.shortUrl);
        setStatusText("Short link generated.");
        renderList();
      });
    }

    if (copyBtn instanceof HTMLButtonElement) {
      copyBtn.addEventListener("click", async () => {
        if (!(out instanceof HTMLInputElement)) return;
        const ok = await copy(out.value);
        setStatusText(ok ? "Copied." : "Could not copy automatically.");
      });
    }

    modal.addEventListener("click", async (e) => {
      const row = e.target.closest("[data-share-code]");
      if (!row) return;
      const code = row.getAttribute("data-share-code") || "";
      const url = buildShortUrl(code);
      if (out instanceof HTMLInputElement) out.value = url;
      updateShareLinks(url);
      const ok = await copy(url);
      setStatusText(ok ? "Copied selected short link." : "Selected short link.");
    });
  }

  async function handleRedirect() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("s");
    if (!code) return;
    const result = await resolve(code);
    if (result.ok && result.url) {
      window.location.replace(result.url);
      return;
    }
    closeAllModals();
    openModal("share");
    const status = document.getElementById("share-status");
    if (status) status.textContent = result.message || "Could not resolve this short link.";
    const out = document.getElementById("share-short");
    if (out instanceof HTMLInputElement) out.value = "";
  }

  bindShareUi();
  handleRedirect();

  return { create, resolve, isValidUrl };
})();

const params = new URLSearchParams(window.location.search);
if (params.get("lb_test") === "1") {
  const assert = (cond, msg) => {
    if (!cond) throw new Error(msg);
  };

  const testEmail = () => {
    const f = validateField("form-login", "email", "bad");
    assert(Boolean(f), "Expected invalid email error");
    const ok = validateField("form-login", "email", "a@b.co");
    assert(!ok, "Expected valid email");
  };

  const testSignup = () => {
    const form = document.getElementById("form-signup");
    if (!form) return;
    const email = form.querySelector('input[name="email"]');
    const password = form.querySelector('input[name="password"]');
    if (!(email instanceof HTMLInputElement)) return;
    if (!(password instanceof HTMLInputElement)) return;

    email.value = "bad";
    password.value = "123";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    assert(email.getAttribute("aria-invalid") === "true", "Expected email aria-invalid true");
    assert(password.getAttribute("aria-invalid") === "true", "Expected password aria-invalid true");

    email.value = "a@b.co";
    password.value = "12345678";
    email.dispatchEvent(new Event("blur", { bubbles: true }));
    password.dispatchEvent(new Event("blur", { bubbles: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    assert(email.getAttribute("aria-invalid") !== "true", "Expected email aria-invalid false");
    assert(password.getAttribute("aria-invalid") !== "true", "Expected password aria-invalid false");
  };

  const testContact = () => {
    const form = document.getElementById("form-contact");
    if (!form) return;
    const message = form.querySelector('textarea[name="message"]');
    if (!(message instanceof HTMLTextAreaElement)) return;
    message.value = "hi";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    assert(message.getAttribute("aria-invalid") === "true", "Expected message aria-invalid true");
    message.value = "Hello, I would like to book a session.";
    message.dispatchEvent(new Event("blur", { bubbles: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    assert(message.getAttribute("aria-invalid") !== "true", "Expected message aria-invalid false");
  };

  const testTogglePassword = () => {
    const btn = document.querySelector("[data-toggle-password]");
    if (!(btn instanceof HTMLButtonElement)) return;
    const selector = btn.getAttribute("data-toggle-password");
    if (!selector) return;
    const input = document.querySelector(selector);
    if (!(input instanceof HTMLInputElement)) return;
    const start = input.type;
    btn.click();
    assert(input.type !== start, "Expected password field type to toggle");
  };

  const testShortLinks = () => {
    assert(ShortLinks.isValidUrl("https://example.com"), "Expected https URL valid");
    assert(ShortLinks.isValidUrl("mailto:hello@example.com"), "Expected mailto URL valid");
    assert(ShortLinks.isValidUrl("tel:+919999999999"), "Expected tel URL valid");
    assert(!ShortLinks.isValidUrl("example.com"), "Expected missing scheme invalid");
    assert(!ShortLinks.isValidUrl("javascript:alert(1)"), "Expected unsafe scheme invalid");
  };

  try {
    testEmail();
    testSignup();
    testContact();
    testTogglePassword();
    testShortLinks();
    console.log("[LensBlaze] Form tests passed");
  } catch (err) {
    console.error("[LensBlaze] Form tests failed", err);
  }
}
