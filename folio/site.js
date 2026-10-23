const CONTACT_EMAIL = "";

(function () {
  const toggle = document.querySelector("[data-sheet-toggle]");
  const index = document.querySelector("[data-sheet-index]");
  const narrow = window.matchMedia("(max-width: 51.99rem)");

  function setOpen(open) {
    if (!toggle || !index) {
      return;
    }
    index.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "Close sheet index" : "Open sheet index";
  }

  if (toggle && index) {
    let wasNarrow = narrow.matches;

    toggle.addEventListener("click", function () {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(open);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && narrow.matches && index.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    function syncNav() {
      const isNarrow = narrow.matches;
      if (!isNarrow) {
        setOpen(true);
      } else if (!wasNarrow) {
        setOpen(false);
      }
      wasNarrow = isNarrow;
    }

    if (typeof narrow.addEventListener === "function") {
      narrow.addEventListener("change", syncNav);
    } else if (typeof narrow.addListener === "function") {
      narrow.addListener(syncNav);
    }

    syncNav();
  }

  const pageName = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const current = pageName === "" ? "index.html" : pageName;
  document.querySelectorAll("[data-sheet-index] a").forEach(function (link) {
    const row = link.closest("tr");
    const href = (link.getAttribute("href") || "").toLowerCase();
    if (href === current) {
      link.setAttribute("aria-current", "page");
      if (row) {
        row.classList.add("here");
      }
    } else {
      link.removeAttribute("aria-current");
      if (row) {
        row.classList.remove("here");
      }
    }
  });

  const form = document.querySelector("[data-brief-form]");
  if (!form) {
    return;
  }

  const status = document.getElementById("brief-status");
  const output = document.getElementById("brief-text");
  const heading = document.getElementById("brief-heading");
  const radios = form.querySelectorAll('input[name="intent"]');

  function clearCustomValidity() {
    ["name", "description", "timing"].forEach(function (fieldName) {
      form.elements[fieldName].setCustomValidity("");
    });
    if (radios[0]) {
      radios[0].setCustomValidity("");
    }
  }

  form.addEventListener("input", clearCustomValidity);
  radios.forEach(function (radio) {
    radio.addEventListener("change", clearCustomValidity);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearCustomValidity();

    const name = form.elements.name.value.trim();
    const description = form.elements.description.value.trim();
    const timing = form.elements.timing.value.trim();
    const chosen = form.querySelector('input[name="intent"]:checked');
    const intent = chosen ? chosen.value.trim() : "";
    let valid = true;

    if (!name) {
      form.elements.name.setCustomValidity("Add your name.");
      valid = false;
    }
    if (!intent && radios[0]) {
      radios[0].setCustomValidity("Choose leave or ask.");
      valid = false;
    }
    if (!description) {
      form.elements.description.setCustomValidity("Describe the wood or the job.");
      valid = false;
    }
    if (!timing) {
      form.elements.timing.setCustomValidity("Add timing.");
      valid = false;
    }

    if (!valid || !form.checkValidity()) {
      form.reportValidity();
      if (status) {
        status.textContent = "Fill name, leave or ask, description, and timing.";
      }
      return;
    }

    const brief = [
      "Reclaimed & Stained",
      "RS-04 Note",
      "",
      "Name: " + name,
      "Leave or ask: " + intent,
      "Description: " + description,
      "Timing: " + timing
    ].join("\n");

    output.textContent = brief;

    // Empty CONTACT_EMAIL is not an address. Do not build a mail link.
    let message = "The brief is on this sheet.";
    if (CONTACT_EMAIL.trim() === "") {
      message += " The email line is empty, so this page did not send it.";
    }
    status.textContent = message;
    if (heading) {
      heading.focus();
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(brief).then(function () {
        status.textContent = message + " A copy is on the clipboard too.";
      }).catch(function () {
        status.textContent = message;
      });
    }
  });
})();
