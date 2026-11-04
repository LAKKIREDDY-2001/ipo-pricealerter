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

  function removeLocalSubscriber(email) {
    var norm = String(email || "").trim().toLowerCase();
    if (!norm) return;
    var list = getLocalSubscribers().filter(function (item) {
      return String(item.email || "").trim().toLowerCase() !== norm;
    });
    saveLocalSubscribers(list);
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

  async function unsubscribe(email) {
    var cleanEmail = String(email || "").trim().toLowerCase();
    var result = await request("/api/unsubscribe", cleanEmail);
    removeLocalSubscriber(cleanEmail);
    return result;
  }

  function notify(message, type) {
    if (window.IpoApp && typeof window.IpoApp.showToast === "function") {
      window.IpoApp.showToast(message, type || "info");
    } else {
      alert(message);
    }
  }

  function setModalMode(modal, next) {
    if (!modal) return;
    modal.querySelectorAll("[data-mode]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-mode") === next);
    });
    var consent = modal.querySelector("#ipo-alert-consent");
    if (consent) {
      consent.hidden = next === "unsubscribe";
      var chk = consent.querySelector("input");
      if (chk) chk.required = next === "subscribe";
    }
    var submit = modal.querySelector('button[type="submit"]');
    if (submit) {
      submit.textContent = next === "subscribe" ? "Subscribe Now (Free Live Alerts)" : "Delete User Details & Unsubscribe";
      submit.style.background = next === "subscribe" ? "#0F766E" : "#DC2626";
    }
    var inp = modal.querySelector('input[type="email"]');
    if (inp) {
      inp.placeholder = next === "subscribe" ? "you@example.com" : "Enter email to delete details...";
    }
    var status = modal.querySelector(".ipo-subscribe-status");
    if (status) status.textContent = "";
    modal.dataset.currentMode = next;
  }

  function openSubscribeModal(initialMode, defaultEmail) {
    var mode = (initialMode === "unsubscribe") ? "unsubscribe" : "subscribe";
    var existing = document.getElementById("ipo-subscribe-modal");
    if (existing) {
      existing.hidden = false;
      setModalMode(existing, mode);
      var inp = existing.querySelector('input[type="email"]');
      if (inp) {
        if (defaultEmail) inp.value = defaultEmail;
        inp.focus();
      }
      return;
    }

    var modal = document.createElement("div");
    modal.id = "ipo-subscribe-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.dataset.currentMode = mode;
    modal.innerHTML = `
      <div class="ipo-subscribe-backdrop"></div>
      <div class="ipo-subscribe-dialog">
        <button type="button" class="ipo-subscribe-close" aria-label="Close">&times;</button>
        <h2>IPO Email Alert Notifications</h2>
        <p>Subscribe for instant morning GMP updates, QIB subscription alerts, and allotment announcements, or unsubscribe anytime.</p>
        <div class="ipo-subscribe-actions">
          <button type="button" class="ipo-subscribe-mode ${mode === "subscribe" ? "active" : ""}" data-mode="subscribe">🔔 Subscribe for Alerts</button>
          <button type="button" class="ipo-subscribe-mode ${mode === "unsubscribe" ? "active" : ""}" data-mode="unsubscribe">🚫 Unsubscribe / Delete</button>
        </div>
        <form id="ipo-subscribe-modal-form">
          <label for="ipo-alert-email">Your Email Address</label>
          <input id="ipo-alert-email" type="email" autocomplete="email" placeholder="${mode === 'unsubscribe' ? 'Enter email to delete details...' : 'you@example.com'}" required maxlength="254">
          <label class="ipo-subscribe-consent" id="ipo-alert-consent" ${mode === "unsubscribe" ? "hidden" : ""}>
            <input type="checkbox" ${mode === "subscribe" ? "required" : ""} checked> I agree to receive live IPO alerts from PriceAlerter.
          </label>
          <button type="submit" class="ipo-subscribe-submit" style="background:${mode === 'unsubscribe' ? '#DC2626' : '#0F766E'};">${mode === "subscribe" ? "Subscribe Now (Free Live Alerts)" : "Delete User Details & Unsubscribe"}</button>
          <small class="ipo-subscribe-privacy">Your email is synchronized securely to KV and GitHub Excel. You can delete your details anytime with 1 click.</small>
          <p class="ipo-subscribe-status" aria-live="polite"></p>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    var form = modal.querySelector("form");
    var submit = form.querySelector('button[type="submit"]');

    function close() { modal.hidden = true; }

    modal.querySelectorAll("[data-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        setModalMode(modal, button.getAttribute("data-mode"));
      });
    });

    modal.querySelector(".ipo-subscribe-backdrop").addEventListener("click", close);
    modal.querySelector(".ipo-subscribe-close").addEventListener("click", close);

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      submit.disabled = true;
      var curMode = modal.dataset.currentMode || "subscribe";
      var status = form.querySelector(".ipo-subscribe-status");
      status.textContent = curMode === "subscribe" ? "Saving your subscription…" : "Processing your unsubscribe request…";

      try {
        var emailVal = form.querySelector('input[type="email"]').value;
        var result = curMode === "subscribe"
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
      if (inp) {
        if (defaultEmail) inp.value = defaultEmail;
        inp.focus();
      }
    }, 100);
  }

  function openUnsubscribeModal(defaultEmail) {
    openSubscribeModal("unsubscribe", defaultEmail);
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

  window.setFig1ActionMode = function (mode) {
    var form = document.getElementById("fig1-subscribe-form");
    var btn = form ? form.querySelector(".fig1-subscribe-btn") : document.getElementById("fig1-subscribe-btn");
    var inp = form ? form.querySelector('input[type="email"]') : document.getElementById("fig1-email-input");
    var radios = document.querySelectorAll('input[name="fig1_action_mode"]');
    
    radios.forEach(function (r) {
      r.checked = (r.value === mode);
    });

    if (btn) {
      if (mode === "unsubscribe") {
        btn.textContent = "Delete Details & Unsubscribe";
        btn.classList.add("unsub-mode");
      } else {
        btn.textContent = "Subscribe Now";
        btn.classList.remove("unsub-mode");
      }
    }
    if (inp) {
      inp.placeholder = mode === "unsubscribe" 
        ? "Enter email to delete details..." 
        : "your@email.com";
      inp.focus();
    }
  };

  window.handleDirectUnsubscribe = async function (btnEl) {
    var form = (btnEl && btnEl.closest) ? btnEl.closest("form") : document.getElementById("fig1-subscribe-form");
    var inp = form ? form.querySelector('input[type="email"]') : document.getElementById("fig1-email-input");
    var email = inp ? inp.value.trim() : "";

    if (!email) {
      if (inp) inp.focus();
      notify("Please enter your email address to unsubscribe and delete your details.", "info");
      return;
    }

    if (!EMAIL_RE.test(email)) {
      notify("Please enter a valid email address.", "warning");
      if (inp) inp.focus();
      return;
    }

    if (btnEl) btnEl.disabled = true;
    try {
      var res = await unsubscribe(email);
      notify(res.message || "You have been unsubscribed and your details have been deleted successfully.", "success");
      if (inp) inp.value = "";
      window.setFig1ActionMode("subscribe");
    } catch (err) {
      notify(err.message || "Error processing unsubscribe request.", "warning");
    } finally {
      if (btnEl) btnEl.disabled = false;
    }
  };

  window.handleFig1FormSubmit = async function (event) {
    if (event && event.preventDefault) event.preventDefault();
    var form = event.target || event;
    var inp = form.querySelector('input[type="email"]') || document.getElementById("fig1-email-input");
    var email = inp ? inp.value.trim() : "";
    if (!email) return false;

    var selectedRadio = form.querySelector('input[name="fig1_action_mode"]:checked');
    var mode = selectedRadio ? selectedRadio.value : "subscribe";
    var btn = form.querySelector('button[type="submit"]') || form.querySelector(".fig1-subscribe-btn");
    if (btn) btn.disabled = true;

    try {
      if (mode === "unsubscribe") {
        var unRes = await unsubscribe(email);
        notify(unRes.message || "You have been unsubscribed and your details have been deleted successfully.", "success");
        if (inp) inp.value = "";
        window.setFig1ActionMode("subscribe");
      } else {
        var subRes = await subscribe(email, "Homepage Stay Updated");
        notify(subRes.message || "Thank you! Your email has been added to the IPO alerts list.", "success");
        if (inp) inp.value = "";
      }
      return true;
    } catch (err) {
      notify(err.message, "warning");
      return false;
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  window.handleSubscribeForm = async function (event, source) {
    if (event && event.preventDefault) event.preventDefault();
    var form = event.target || event;
    var input = form.querySelector('input[type="email"]') || form.querySelector("input");
    if (!input || !input.value) return false;

    var selectedRadio = form.querySelector('input[name="fig1_action_mode"]:checked');
    if (selectedRadio && selectedRadio.value === "unsubscribe") {
      return window.handleFig1FormSubmit(event);
    }

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
    removeSubscriber: unsubscribe,
    openSubscribeModal: openSubscribeModal,
    openAlertsModal: openSubscribeModal,
    openUnsubscribeModal: openUnsubscribeModal,
    downloadExcel: downloadExcel,
    getAllSubscribers: getLocalSubscribers
  };

})(window);
