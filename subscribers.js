(function (window) {
  "use strict";
  async function subscribe(email, source) {
    var response = await fetch("/api/subscribe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(email || "").trim(), source: source || "IPO Pricealerter Website" })
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) { var error = new Error(data.message || "Subscription could not be saved."); error.status = response.status; throw error; }
    return data;
  }
  function notify(message, type) {
    if (window.IpoApp && typeof window.IpoApp.showToast === "function") window.IpoApp.showToast(message, type || "info");
    else alert(message);
  }
  function openSubscribeModal() {
    var existing = document.getElementById("ipo-subscribe-modal");
    if (existing) { existing.hidden = false; existing.querySelector("input[type=email]").focus(); return; }
    var modal = document.createElement("div");
    modal.id = "ipo-subscribe-modal";
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    modal.innerHTML = '<div class="ipo-subscribe-backdrop"></div><div class="ipo-subscribe-dialog"><button type="button" class="ipo-subscribe-close" aria-label="Close">×</button><h2>Get IPO Alerts</h2><p>Receive IPO opening, closing, allotment and listing updates by email.</p><form id="ipo-subscribe-modal-form"><label>Email address</label><input type="email" autocomplete="email" placeholder="you@example.com" required maxlength="254"><label class="ipo-subscribe-consent"><input type="checkbox" required> I agree to receive IPO update emails from PriceAlerter.</label><button type="submit">Subscribe</button><small>Your email is stored privately and used only for IPO updates. You can request removal anytime.</small><p class="ipo-subscribe-status" aria-live="polite"></p></form></div>';
    document.body.appendChild(modal);
    function close() { modal.remove(); }
    modal.querySelector(".ipo-subscribe-backdrop").addEventListener("click", close);
    modal.querySelector(".ipo-subscribe-close").addEventListener("click", close);
    modal.querySelector("form").addEventListener("submit", async function (event) {
      event.preventDefault();
      var form = event.currentTarget, button = form.querySelector("button[type=submit]");
      var status = form.querySelector(".ipo-subscribe-status");
      button.disabled = true; status.textContent = "Saving your subscription…";
      try {
        var result = await subscribe(form.querySelector("input[type=email]").value, "Get Alerts");
        status.textContent = result.message; notify(result.message, "success"); form.reset(); setTimeout(close, 1400);
      } catch (error) { status.textContent = error.message; notify(error.message, "warning"); }
      finally { button.disabled = false; }
    });
    modal.querySelector("input[type=email]").focus();
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
    subscribe: subscribe, openSubscribeModal: openSubscribeModal,
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
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".fig1-subscribe-form").forEach(function (form) {
      form.addEventListener("submit", function (event) { window.handleSubscribeForm(event, "Homepage Stay Updated"); });
    });
  });
})(window);
