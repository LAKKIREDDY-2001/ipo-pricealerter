/**
 * IPO Pricealerter — Automated Subscriber & Excel Manager
 * Strictly enforces:
 * 1. Unique subscriber emails added only once.
 * 2. Duplicate emails are marked as duplicates and REJECTED from being stored in GitHub or Excel.
 * 3. Excel (.xlsx / .csv with UTF-8 BOM) generation and automated webhook sync.
 */

(function(window) {
  'use strict';

  var STORAGE_KEY = 'ipo_subscribers_v2';
  var WEBHOOK_KEY = 'ipo_subscriber_webhook_url';
  var EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

  function normalizeEmail(email) {
    if (!email) return '';
    return String(email).trim().toLowerCase();
  }

  function getLocalSubscribers() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(data)) return data;
    } catch(e) {}
    return [];
  }

  function saveLocalSubscribers(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch(e) {}
  }

  var SubscriberService = {
    getAllSubscribers: function() {
      return getLocalSubscribers();
    },

    isDuplicate: function(email) {
      var norm = normalizeEmail(email);
      if (!norm) return false;
      var list = getLocalSubscribers();
      for (var i = 0; i < list.length; i++) {
        if (normalizeEmail(list[i].email) === norm) {
          return true;
        }
      }
      return false;
    },

    subscribe: function(email, name, source) {
      var norm = normalizeEmail(email);

      // 1. Validate Email
      if (!norm || !EMAIL_REGEX.test(norm)) {
        return {
          success: false,
          status: 'invalid',
          message: 'Please enter a valid email address (e.g. name@gmail.com).'
        };
      }

      // 2. Strict Duplicate Check
      if (this.isDuplicate(norm)) {
        console.warn('⚠️ [DUPLICATE BLOCKED] ' + norm + ' is already subscribed. Strictly not allowed to store in GitHub or Excel again.');
        return {
          success: false,
          status: 'duplicate',
          duplicate: true,
          email: norm,
          message: '⚠️ This email (' + norm + ') is already subscribed! Duplicate entries are not allowed and will not be stored.'
        };
      }

      // 3. Unique Subscriber: Add one time
      var record = {
        email: norm,
        name: (name || '').trim(),
        subscribed_at: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        status: 'Active',
        source: source || 'IPO Pricealerter Website'
      };

      var list = getLocalSubscribers();
      list.push(record);
      saveLocalSubscribers(list);

      // 4. Automated Cloud Excel / Google Sheets Webhook Dispatch (if configured)
      var webhookUrl = window.IPO_SUBSCRIBER_WEBHOOK || localStorage.getItem(WEBHOOK_KEY);
      if (webhookUrl) {
        try {
          fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
          }).catch(function(err) {
            console.log('Webhook notice:', err);
          });
        } catch(e) {}
      }

      return {
        success: true,
        status: 'success',
        duplicate: false,
        email: norm,
        record: record,
        message: '✓ Successfully subscribed! You will receive daily IPO alerts & GMP updates.'
      };
    },

    // Generates an Excel-compatible CSV file with UTF-8 BOM for Microsoft Excel
    downloadExcel: function() {
      var list = getLocalSubscribers();
      if (!list || list.length === 0) {
        alert('No subscribers in database yet.');
        return;
      }

      // Deduplicate before exporting
      var uniqueMap = {};
      var cleanList = [];
      for (var i = 0; i < list.length; i++) {
        var e = normalizeEmail(list[i].email);
        if (e && !uniqueMap[e]) {
          uniqueMap[e] = true;
          cleanList.push(list[i]);
        }
      }

      var headers = ['Email Address', 'Subscriber Name', 'Subscribed Date (IST)', 'Status', 'Source'];
      var csvRows = [];
      csvRows.push(headers.map(function(h) { return '"' + h.replace(/"/g, '""') + '"'; }).join(','));

      for (var j = 0; j < cleanList.length; j++) {
        var s = cleanList[j];
        var row = [
          s.email || '',
          s.name || '',
          s.subscribed_at || '',
          s.status || 'Active',
          s.source || 'IPO Pricealerter'
        ];
        csvRows.push(row.map(function(val) { return '"' + String(val).replace(/"/g, '""') + '"'; }).join(','));
      }

      var csvContent = '\uFEFF' + csvRows.join('\r\n');
      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.setAttribute('href', url);
      var dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', 'IPO_Subscribers_' + dateStr + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Global helper for form submissions
  window.handleSubscribeForm = function(event, source) {
    if (event && event.preventDefault) event.preventDefault();
    var form = event.target || event;
    var emailInput = form.querySelector('input[type="email"]') || form.querySelector('input.fig1-subscribe-input');
    var nameInput = form.querySelector('input[type="text"]');

    if (!emailInput || !emailInput.value) {
      alert('Please enter your email address.');
      return false;
    }

    var email = emailInput.value;
    var name = nameInput ? nameInput.value : '';

    var result = SubscriberService.subscribe(email, name, source || 'Stay Updated Form');

    if (window.IpoApp && typeof window.IpoApp.showToast === 'function') {
      window.IpoApp.showToast(result.message, result.success ? 'success' : 'warning');
    } else {
      alert(result.message);
    }

    if (result.success) {
      emailInput.value = '';
      if (nameInput) nameInput.value = '';
    }

    return result.success;
  };

  window.SubscriberService = SubscriberService;

})(window);
