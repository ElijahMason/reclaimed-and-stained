// Empty until a real mailbox is set. No mailto link while this stays empty.
const CONTACT_EMAIL = "";

(function () {
  var toggle = document.querySelector("[data-cans-toggle]");
  var cans = document.querySelector("[data-cans]");

  function mobileNav() {
    return toggle && getComputedStyle(toggle).display !== "none";
  }

  function setOpen(open) {
    if (!toggle || !cans) return;
    cans.setAttribute("data-open", open ? "true" : "false");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "Close labels" : "Stain labels";
  }

  if (toggle && cans) {
    toggle.addEventListener("click", function () {
      var willOpen = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(willOpen);
      if (willOpen) {
        var first = cans.querySelector("a");
        if (first) first.focus();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!mobileNav()) return;
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      setOpen(false);
      toggle.focus();
    });

    cans.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (mobileNav()) setOpen(false);
      });
    });
  }

  var note = document.querySelector("[data-mail-note]");
  if (note && CONTACT_EMAIL) {
    note.textContent = "You can open a message after you copy the brief.";
  }

  var form = document.querySelector("[data-brief-form]");
  if (!form) return;

  var output = document.querySelector("[data-brief]");
  var briefText = document.querySelector("[data-brief-text]");
  var status = document.querySelector("[data-form-status]");
  var mailSlot = document.querySelector("[data-mail-slot]");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var name = String(data.get("name") || "").trim();
    var intent = String(data.get("leave-or-ask") || "").trim();
    var detail = String(data.get("have-or-need") || "").trim();
    var timing = String(data.get("timing") || "").trim();

    if (!name) {
      say("Add your name, then copy the brief.");
      form.querySelector("#name").focus();
      return;
    }
    if (!intent) {
      say("Choose leave or ask, then copy the brief.");
      var radio = form.querySelector('input[name="leave-or-ask"]');
      if (radio) radio.focus();
      return;
    }
    if (!detail) {
      say("Describe what you have or need, then copy the brief.");
      form.querySelector("#have-or-need").focus();
      return;
    }
    if (!timing) {
      say("Add the timing, then copy the brief.");
      form.querySelector("#timing").focus();
      return;
    }

    var brief = [
      "Reclaimed & Stained",
      "Milwaukie, Oregon",
      "",
      "Name: " + name,
      "Leave or ask: " + intent,
      "What you have or need: " + detail,
      "Timing: " + timing
    ].join("\n");

    output.hidden = false;
    briefText.textContent = brief;
    if (mailSlot) {
      mailSlot.textContent = "";
      if (CONTACT_EMAIL) {
        var link = document.createElement("a");
        var subject = encodeURIComponent("Reclaimed & Stained brief");
        var body = encodeURIComponent(brief);
        link.href = "mailto:" + CONTACT_EMAIL + "?subject=" + subject + "&body=" + body;
        link.textContent = "Open a message";
        mailSlot.appendChild(link);
      }
    }

    copyText(brief).then(function (ok) {
      if (ok) {
        say("Copied. The brief is below. Nothing was sent.");
      } else {
        say("The brief is below. Select it and copy it. Nothing was sent.");
      }
    });
    output.focus();
  });

  function say(message) {
    if (status) status.textContent = message;
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value).then(
        function () { return true; },
        function () { return fallbackCopy(value); }
      );
    }
    return Promise.resolve(fallbackCopy(value));
  }

  function fallbackCopy(value) {
    var area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.width = "1px";
    area.style.height = "1px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }
})();
