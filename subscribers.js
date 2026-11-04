(function (window) {
  "use strict";
  async function request(url, email, source) {
    var response = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(email || "").trim(), source: source || "IPO Pricealerter Website" })
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) { var error = new Error(data.message || "Request could not be completed."); error.status = response.status; throw error; }
    return data;
  }
  function subscribe(email, source) { return request("/api/subscribe", email, source); }
  function unsubscribe(email) { return request("/api/unsubscribe", email); }
  function notify(message, type) {
    if (window.IpoApp && typeof window.IpoApp.showToast === "function") window.IpoApp.showToast(message, type || "info");
    else alert(message);
  }
  function openSubscribeModal() {
    var existing = document.getElementById("ipo-subscribe-modal");
    if (existing) { existing.hidden = false; existing.querySelector('input[type="email"]').focus(); return; }
    var modal = document.createElement("div");
    modal.id = "ipo-subscribe-modal";
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    modal.innerHTML = '<div class="ipo-subscribe-backdrop"></div><div class="ipo-subscribe-dialog"><button type="button" class="ipo-subscribe-close" aria-label="Close">×</button><h2>IPO Email Alerts</h2><p>Receive IPO opening, closing, allotment and listing updates by email.</p><div class="ipo-subscribe-actions"><button type="button" class="ipo-subscribe-mode active" data-mode="subscribe">Subscribe Now</button><button type="button" class="ipo-subscribe-mode" data-mode="unsubscribe">Unsubscribe Now</button></div><form id="ipo-subscribe-modal-form"><label for="ipo-alert-email">Email address</label><input id="ipo-alert-email" type="email" autocomplete="email" placeholder="you@example.com" required maxlength="254"><label class="ipo-subscribe-consent" id="ipo-alert-consent"><input type="checkbox" required> I agree to receive IPO update emails from PriceAlerter.</label><button type="submit" class="ipo-subscribe-submit">Subscribe Now</button><small class="ipo-subscribe-privacy">Your email is stored privately and used only for IPO updates. You can unsubscribe anytime.</small><p class="ipo-subscribe-status" aria-live="polite"></p></form></div>';
    document.body.appendChild(modal);
    var mode = "subscribe";
    var form = modal.querySelector("form");
    var submit = form.querySelector('button[type="submit"]');
    var consent = modal.querySelector("#ipo-alert-consent");
    function close() { modal.remove(); }
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
        var result = mode === "subscribe"
          ? await subscribe(form.querySelector('input[type="email"]').value, "Get Alerts")
          : await unsubscribe(form.querySelector('input[type="email"]').value);
        status.textContent = result.message;
        notify(result.message, "success");
        form.reset();
        setTimeout(close, 1600);
      } catch (error) {
        status.textContent = error.message;
        notify(error.message, "warning");
      } finally { submit.disabled = false; }
    });
    modal.querySelector('input[type="email"]').focus();
  }
  window.handleSubscribeForm = async function (event, source) {
    if (event && event.preventDefault) event.preventDefault();
    var form = event.target || event, input = form.querySelector('input[type="email"]');
    if (!input || !input.value) return false;
    var button = form.querySelector('button[type="submit"]'); if (button) button.disabled = true;
    try { var result = await subscribe(input.value, source || "Stay Updated Form"); notify(result.message, "success"); input.value = ""; return true; }
    catch (error) { notify(error.message, "warning"); return false; }
    finally { if (button) button.disabled = false; }
  };
  window.SubscriberService = {
    subscribe: subscribe, unsubscribe: unsubscribe, openSubscribeModal: openSubscribeModal,
    downloadExcel: async function () {
      var key = prompt("Enter your team subscriber-export key:");
      if (!key) return;
      var response = await fetch("/api/subscribers-export", { headers: { "X-Admin-Key": key } });
      if (!response.ok) { alert(response.status === 401 ? "Access denied." : "Export failed."); return; }
      var url = URL.createObjectURL(await response.blob()), link = document.createElement("a");
      link.href = url; link.download = "PriceAlerter_Subscribers_" + new Date().toISOString().slice(0, 10) + ".csv";
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    }
  };
})(window);
