const CONTACT_EMAIL = "";

function copyBrief(text) {
  if (!navigator.clipboard || !window.isSecureContext) return Promise.resolve(false);
  return new Promise(function (resolve) {
    let settled = false;
    const timer = setTimeout(function () {
      if (!settled) resolve(false);
    }, 700);
    navigator.clipboard.writeText(text).then(function () {
      settled = true;
      clearTimeout(timer);
      resolve(true);
    }).catch(function () {
      settled = true;
      clearTimeout(timer);
      resolve(false);
    });
  });
}

function mailHref(email, purpose, brief) {
  const clean = String(email || "").trim();
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(clean)) {
    return "";
  }
  const subject = "Reclaimed & Stained brief: " + purpose;
  return (
    "mailto:" +
    clean +
    "?subject=" +
    encodeURIComponent(subject) +
    "&body=" +
    encodeURIComponent(brief)
  );
}

function initNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const rail = document.querySelector("[data-rail]");
  const backdrop = document.querySelector("[data-nav-backdrop]");
  const main = document.getElementById("content");
  if (!toggle || !rail || !backdrop) return false;

  const drawer = window.matchMedia("(max-width: 760px)");

  function openDrawer() {
    rail.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = "Close";
    backdrop.hidden = false;
    document.body.classList.add("nav-open");
    rail.removeAttribute("inert");
    if (main) main.setAttribute("inert", "");
    const first = rail.querySelector("a");
    if (first) first.focus({ preventScroll: true });
  }

  function closeDrawer(returnFocus) {
    rail.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Index";
    backdrop.hidden = true;
    document.body.classList.remove("nav-open");
    if (drawer.matches) rail.setAttribute("inert", "");
    else rail.removeAttribute("inert");
    if (main) main.removeAttribute("inert");
    if (returnFocus) toggle.focus({ preventScroll: true });
  }

  function syncMode() {
    if (!drawer.matches) {
      rail.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Index";
      backdrop.hidden = true;
      document.body.classList.remove("nav-open");
      rail.removeAttribute("inert");
      if (main) main.removeAttribute("inert");
      return;
    }
    if (!rail.classList.contains("is-open")) {
      rail.setAttribute("inert", "");
      backdrop.hidden = true;
      if (main) main.removeAttribute("inert");
    }
  }

  syncMode();

  toggle.addEventListener("click", function () {
    if (rail.classList.contains("is-open")) closeDrawer(true);
    else openDrawer();
  });

  backdrop.addEventListener("click", function () {
    closeDrawer(true);
  });

  document.addEventListener("keydown", function (event) {
    if (!drawer.matches || !rail.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeDrawer(true);
      return;
    }
    if (event.key !== "Tab") return;
    const nodes = [toggle].concat(Array.prototype.slice.call(rail.querySelectorAll("a")));
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  if (drawer.addEventListener) {
    drawer.addEventListener("change", syncMode);
  }

  return true;
}

function initForm() {
  const form = document.querySelector("[data-brief-form]");
  if (!form) return;

  const result = document.querySelector("[data-brief-result]");
  const status = document.querySelector("[data-brief-status]");
  const output = document.querySelector("[data-brief-output]");
  const mail = document.querySelector("[data-brief-mail]");
  const heading = document.getElementById("brief-heading");

  function clearField(name) {
    const slot = form.querySelector('[data-error="' + name + '"]');
    if (slot) slot.textContent = "";
    const fields = form.querySelectorAll('[name="' + name + '"]');
    Array.prototype.forEach.call(fields, function (node) {
      node.removeAttribute("aria-invalid");
    });
  }

  function setError(name, message) {
    const slot = form.querySelector('[data-error="' + name + '"]');
    if (slot) slot.textContent = message;
    const fields = form.querySelectorAll('[name="' + name + '"]');
    Array.prototype.forEach.call(fields, function (node) {
      node.setAttribute("aria-invalid", "true");
    });
  }

  form.addEventListener("input", function (event) {
    if (event.target && event.target.name) clearField(event.target.name);
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    ["name", "purpose", "detail", "timing"].forEach(clearField);
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const purpose = String(data.get("purpose") || "").trim();
    const detail = String(data.get("detail") || "").trim();
    const timing = String(data.get("timing") || "").trim();
    if (!name) setError("name", "Enter your name.");
    if (!purpose) setError("purpose", "Choose leave wood or ask for wood.");
    if (!detail) setError("detail", "Say what you have or need.");
    if (!timing) setError("timing", "Say the timing.");
    const bad = form.querySelector("[aria-invalid='true']");
    if (bad) {
      bad.focus();
      return;
    }

    const brief = [
      "Reclaimed & Stained",
      "Name: " + name,
      "Purpose: " + purpose,
      "What I have or need: " + detail,
      "Timing: " + timing
    ].join("\n");

    output.value = brief;
    result.hidden = false;
    while (mail.firstChild) mail.removeChild(mail.firstChild);
    const href = mailHref(CONTACT_EMAIL, purpose, brief);
    if (href) {
      const link = document.createElement("a");
      link.className = "button";
      link.href = href;
      link.textContent = "Open this brief in your mail program";
      mail.appendChild(link);
    }
    status.textContent = "The brief is shown below.";
    output.focus();
    output.select();
    // Copy from the selection while the submit gesture is still active. The async clipboard call is denied in some browsers.
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (err) {
      copied = false;
    }
    if (!copied) copied = await copyBrief(brief);
    if (copied) {
      output.setSelectionRange(output.value.length, output.value.length);
      status.textContent = href
        ? "The brief is copied and shown below. A mail link is under the brief."
        : "The brief is copied and shown below.";
      if (heading) heading.focus();
    } else {
      status.textContent = href
        ? "The brief is shown below. Select it and copy it by hand. A mail link is under the brief."
        : "The brief is shown below. Select it and copy it by hand.";
      output.focus();
      output.select();
    }
  });
}

(function () {
  let navOk = false;
  try {
    navOk = initNav() === true;
  } catch (err) {
    console.error(err);
    navOk = false;
  }
  try {
    initForm();
  } catch (err) {
    console.error(err);
  }
  if (navOk) window.__rsNav = true;
})();
