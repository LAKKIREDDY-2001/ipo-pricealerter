(function (window) {
  "use strict";

  var STORAGE_KEY = "ipo_subscribers_v2";
  var OWNER_EMAIL = "lakkistudy@gmail.com";
  var FALLBACK_NOTIFICATION_URL = "https://formsubmit.co/ajax/" + OWNER_EMAIL;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getLocalSubscribers() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(data)) return data;
    } catch (e) {}
    return [];
  }

  function saveLocalSubscribers(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function isLocalDuplicate(email) {
    var norm = String(email || "").trim().toLowerCase();
    if (!norm) return false;
    var list = getLocalSubscribers();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].email || "").trim().toLowerCase() === norm) {
        return true;
      }
    }
    return false;
  }

  function saveLocalSubscriber(email, source) {
    var norm = String(email || "").trim().toLowerCase();
    if (!norm || isLocalDuplicate(norm)) return false;
    var list = getLocalSubscribers();
    list.push({
      email: norm,
      subscribedAt: new Date().toISOString(),
      source: source || "IPO Pricealerter Website",
      status: "Active"
    });
    saveLocalSubscribers(list);
    return true;
  }

  async function request(url, email, source) {
    var cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    try {
      var response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, source: source || "IPO Pricealerter Website" })
      });

      var data = await response.json().catch(function () { return {}; });

      if (response.status === 409) {
        var dupErr = new Error(data.message || "This email is already subscribed.");
        dupErr.status = 409;
        throw dupErr;
      }

      if (response.ok && data.success) {
        saveLocalSubscriber(cleanEmail, source);
        return data;
      }

      // If server returned non-409 error (e.g. 503 or 500), fall back to graceful client-side collection
      console.warn("Backend notice:", data.message || response.statusText);
      return fallbackSubscribe(cleanEmail, source);

    } catch (error) {
      if (error && error.status === 409) {
        throw error;
      }
      // Network failure / offline fallback
      return fallbackSubscribe(cleanEmail, source);
    }
  }

  function fallbackSubscribe(cleanEmail, source) {
    if (isLocalDuplicate(cleanEmail)) {
      var err = new Error("This email is already subscribed.");
      err.status = 409;
      throw err;
    }

    saveLocalSubscriber(cleanEmail, source);

    // Dispatch background email notification to owner
    try {
      fetch(FALLBACK_NOTIFICATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          source: source || "IPO Pricealerter Website",
          subscribed_at: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          _subject: "🔔 [IPO Pricealerter] New Subscriber: " + cleanEmail,
          _template: "table"
        })
      }).catch(function () {});
    } catch (e) {}

    return {
      success: true,
      message: "Thank you! Your email has been added to the IPO alerts list."
    };
  }

  function subscribe(email, source) {
    return request("/api/subscribe", email, source);
  }

  function unsubscribe(email) {
    return request("/api/unsubscribe", email);
  }

  function notify(message, type) {
    if (window.IpoApp && typeof window.IpoApp.showToast === "function") {
      window.IpoApp.showToast(message, type || "info");
    } else {
      alert(message);
    }
  }

  function openSubscribeModal() {
    var existing = document.getElementById("ipo-subscribe-modal");
    if (existing) {
      existing.hidden = false;
      var inp = existing.querySelector('input[type="email"]');
      if (inp) inp.focus();
      return;
    }

    var modal = document.createElement("div");
    modal.id = "ipo-subscribe-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="ipo-subscribe-backdrop"></div>
      <div class="ipo-subscribe-dialog">
        <button type="button" class="ipo-subscribe-close" aria-label="Close">&times;</button>
        <h2>IPO Email Alerts</h2>
        <p>Receive live IPO opening dates, daily morning GMP updates, and registrar allotment results directly in your inbox.</p>
        <div class="ipo-subscribe-actions">
          <button type="button" class="ipo-subscribe-mode active" data-mode="subscribe">Subscribe Now</button>
          <button type="button" class="ipo-subscribe-mode" data-mode="unsubscribe">Unsubscribe Now</button>
        </div>
        <form id="ipo-subscribe-modal-form">
          <label for="ipo-alert-email">Email address</label>
          <input id="ipo-alert-email" type="email" autocomplete="email" placeholder="you@example.com" required maxlength="254">
          <label class="ipo-subscribe-consent" id="ipo-alert-consent">
            <input type="checkbox" checked required> I agree to receive IPO update emails from PriceAlerter.
          </label>
          <button type="submit" class="ipo-subscribe-submit">Subscribe Now</button>
          <small class="ipo-subscribe-privacy">Your email is stored privately and used only for IPO updates. You can unsubscribe anytime.</small>
          <p class="ipo-subscribe-status" aria-live="polite"></p>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    var mode = "subscribe";
    var form = modal.querySelector("form");
    var submit = form.querySelector('button[type="submit"]');
    var consent = modal.querySelector("#ipo-alert-consent");

    function close() { modal.hidden = true; }

    function setMode(next) {
      mode = next;
      modal.querySelectorAll("[data-mode]").forEach(function (button) {
        button.classList.toggle("active", button.getAttribute("data-mode") === mode);
      });
      consent.hidden = mode === "unsubscribe";
      consent.querySelector("input").required = mode === "subscribe";
      submit.textContent = mode === "subscribe" ? "Subscribe Now" : "Unsubscribe Now";
      modal.querySelector(".ipo-subscribe-status").textContent = "";
    }

    modal.querySelectorAll("[data-mode]").forEach(function (button) {
      button.addEventListener("click", function () { setMode(button.getAttribute("data-mode")); });
    });

    modal.querySelector(".ipo-subscribe-backdrop").addEventListener("click", close);
    modal.querySelector(".ipo-subscribe-close").addEventListener("click", close);

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      submit.disabled = true;
      var status = form.querySelector(".ipo-subscribe-status");
      status.textContent = mode === "subscribe" ? "Saving your subscription…" : "Processing your unsubscribe request…";

      try {
        var emailVal = form.querySelector('input[type="email"]').value;
        var result = mode === "subscribe"
          ? await subscribe(emailVal, "Get Alerts Modal")
          : await unsubscribe(emailVal);

        status.textContent = result.message;
        notify(result.message, "success");
        form.reset();
        setTimeout(close, 1800);
      } catch (error) {
        status.textContent = error.message;
        notify(error.message, "warning");
      } finally {
        submit.disabled = false;
      }
    });

    setTimeout(function() {
      var inp = modal.querySelector('input[type="email"]');
      if (inp) inp.focus();
    }, 100);
  }

  function downloadLocalCsv() {
    var list = getLocalSubscribers();
    if (!list || list.length === 0) {
      notify("No subscribers stored in local cache yet.", "warning");
      return;
    }
    var rows = [["Email Address", "Subscribed At", "Source", "Status"]];
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      rows.push([item.email || "", item.subscribedAt || "", item.source || "", item.status || "Active"]);
    }
    var csv = "\uFEFF" + rows.map(function(r) {
      return r.map(function(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\r\n");

    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "PriceAlerter_Subscribers_" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function downloadExcel() {
    var key = prompt("Enter your team subscriber-export key (or leave empty to download local subscribers):");
    if (key && key.trim()) {
      try {
        var response = await fetch("/api/subscribers-export", {
          headers: { "X-Admin-Key": key.trim() }
        });
        if (response.ok) {
          var url = URL.createObjectURL(await response.blob());
          var link = document.createElement("a");
          link.href = url;
          link.download = "PriceAlerter_Subscribers_" + new Date().toISOString().slice(0, 10) + ".csv";
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          return;
        } else if (response.status === 401) {
          notify("Access denied: Invalid admin key.", "warning");
          return;
        }
      } catch (e) {
        console.warn("Export request error, falling back to local storage:", e);
      }
    }
    downloadLocalCsv();
  }

  window.handleSubscribeForm = async function (event, source) {
    if (event && event.preventDefault) event.preventDefault();
    var form = event.target || event;
    var input = form.querySelector('input[type="email"]') || form.querySelector("input");
    if (!input || !input.value) return false;

    var button = form.querySelector('button[type="submit"]') || form.querySelector("button");
    if (button) button.disabled = true;

    try {
      var result = await subscribe(input.value, source || "Stay Updated Form");
      notify(result.message, "success");
      input.value = "";
      return true;
    } catch (error) {
      notify(error.message, "warning");
      return false;
    } finally {
      if (button) button.disabled = false;
    }
  };

  window.SubscriberService = {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    openSubscribeModal: openSubscribeModal,
    openAlertsModal: openSubscribeModal,
    downloadExcel: downloadExcel,
    getAllSubscribers: getLocalSubscribers
  };

})(window);
