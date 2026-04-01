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

  renderLinksList(state);
  renderPreview(state);
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
      if (id === "ws-handle") {
        const v = normalizeHandle(el.value);
        el.value = v;
        state = { ...state, profile: { ...state.profile, handle: v } };
        setWorkspace(state);
        renderPreview(state);
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
      if (!t || !u) return;

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

const logoutBtn = document.getElementById("btn-logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    setLoggedOut();
    updateAuthVisibility();
    window.location.href = "./index.html";
  });
}

updateAuthVisibility();
initWorkspace();
