(() => {
  const SITE_SLUG = "meowrenovations-1785930255";
  const API_KEY = "site_17ae9f96c18a0e8a81d0363c3c91a025709fdb7bace738b2";
  const BASE_URL = "https://lemeowapis.meowadvancedintelligence.com";

  const container = document.getElementById("meowRenovationsContactContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="mr-loading">
      <div class="mr-spinner"></div>
      <p>Loading renovation quote form...</p>
    </div>
  `;

  let formFields = [];

  async function fetchFields() {
    try {
      const res = await fetch(`${BASE_URL}/api/sites/${SITE_SLUG}/contact-fields`, {
        headers: {
          "X-Site-Api-Key": API_KEY,
          Accept: "application/json",
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load form fields");
      }
      formFields = (json.data || [])
        .filter((f) => f.is_active !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      renderForm(formFields);
    } catch (err) {
      console.error("Error loading contact fields:", err);
      container.innerHTML = `
        <div class="mr-error-box">
          <p>Unable to load the quote request form right now.</p>
          <button type="button" class="btn-primary" id="mrRetryBtn" style="margin-top:12px;">Retry</button>
        </div>
      `;
      document.getElementById("mrRetryBtn")?.addEventListener("click", fetchFields);
    }
  }

  function renderForm(fields) {
    if (!fields || fields.length === 0) {
      container.innerHTML = `
        <div class="mr-empty">
          <p>No quote request fields currently configured.</p>
        </div>
      `;
      return;
    }

    const form = document.createElement("form");
    form.id = "meowRenovationsContactForm";
    form.className = "mr-contact-form";
    form.noValidate = true;

    const feedback = document.createElement("div");
    feedback.id = "mrFormFeedback";
    feedback.className = "mr-feedback";
    feedback.style.display = "none";
    form.appendChild(feedback);

    const grid = document.createElement("div");
    grid.className = "mr-form-grid";

    fields.forEach((field) => {
      const fieldWrapper = document.createElement("div");
      fieldWrapper.className = `mr-field-group mr-type-${field.type} ${
        field.type === "textarea" ? "mr-field-full" : ""
      }`;
      fieldWrapper.dataset.key = field.field_key;

      const label = document.createElement("label");
      label.className = "mr-label";
      label.htmlFor = `mr_field_${field.field_key}`;
      label.innerHTML = `${escapeHtml(field.label)}${
        field.is_required ? ' <span class="mr-req">*</span>' : ""
      }`;
      fieldWrapper.appendChild(label);

      let inputEl;

      if (field.type === "textarea") {
        inputEl = document.createElement("textarea");
        inputEl.rows = 4;
      } else if (field.type === "select") {
        inputEl = document.createElement("select");
        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.textContent = field.placeholder || `-- Select ${field.label} --`;
        inputEl.appendChild(defaultOpt);

        const options = Array.isArray(field.options)
          ? field.options
          : typeof field.options === "string"
          ? JSON.parse(field.options || "[]")
          : [];

        options.forEach((opt) => {
          const optEl = document.createElement("option");
          optEl.value = typeof opt === "object" ? opt.value || opt.label : opt;
          optEl.textContent = typeof opt === "object" ? opt.label || opt.value : opt;
          inputEl.appendChild(optEl);
        });
      } else if (field.type === "checkbox") {
        const options = Array.isArray(field.options) ? field.options : [];
        if (options.length > 0) {
          inputEl = document.createElement("div");
          inputEl.className = "mr-checkbox-group";
          options.forEach((opt, idx) => {
            const val = typeof opt === "object" ? opt.value || opt.label : opt;
            const text = typeof opt === "object" ? opt.label || opt.value : opt;
            const cId = `mr_chk_${field.field_key}_${idx}`;
            const cWrap = document.createElement("label");
            cWrap.className = "mr-chk-label";
            cWrap.innerHTML = `
              <input type="checkbox" name="${field.field_key}" value="${escapeHtml(val)}" id="${cId}" />
              <span>${escapeHtml(text)}</span>
            `;
            inputEl.appendChild(cWrap);
          });
        } else {
          inputEl = document.createElement("input");
          inputEl.type = "checkbox";
          inputEl.name = field.field_key;
        }
      } else {
        inputEl = document.createElement("input");
        if (field.type === "email") inputEl.type = "email";
        else if (field.type === "phone") inputEl.type = "tel";
        else if (field.type === "number") inputEl.type = "number";
        else if (field.type === "date") inputEl.type = "date";
        else inputEl.type = "text";
      }

      if (field.type !== "checkbox" || !Array.isArray(field.options) || field.options.length === 0) {
        inputEl.id = `mr_field_${field.field_key}`;
        inputEl.name = field.field_key;
        inputEl.className = "mr-input";
        if (field.placeholder) inputEl.placeholder = field.placeholder;
        if (field.is_required) inputEl.required = true;
      }

      fieldWrapper.appendChild(inputEl);

      const errEl = document.createElement("div");
      errEl.className = "mr-field-error";
      errEl.id = `mr_err_${field.field_key}`;
      errEl.style.display = "none";
      fieldWrapper.appendChild(errEl);

      grid.appendChild(fieldWrapper);
    });

    form.appendChild(grid);

    const privacyNotice = document.createElement("p");
    privacyNotice.style.cssText = "font-size:0.85rem;line-height:1.5";
    privacyNotice.innerHTML = 'By submitting this enquiry, you consent to our use of your details to respond to your request, as described in our <a href="/privacy-policy.html" style="text-decoration:underline">Privacy Policy</a>.';
    form.appendChild(privacyNotice);

    const submitWrap = document.createElement("div");
    submitWrap.className = "mr-submit-wrap";
    submitWrap.innerHTML = `
      <button type="submit" class="btn-primary mr-submit-btn" id="mrSubmitBtn">
        <span class="mr-btn-text">Request Free Quote</span>
        <span class="mr-btn-loader" style="display:none;">
          <span class="mr-mini-spinner"></span> Submitting...
        </span>
      </button>
    `;
    form.appendChild(submitWrap);

    container.innerHTML = "";
    container.appendChild(form);

    form.addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById("mrSubmitBtn");

    clearErrors();
    hideFeedback();

    const payloadData = {};
    let clientError = false;

    formFields.forEach((field) => {
      const key = field.field_key;
      if (field.type === "checkbox" && Array.isArray(field.options) && field.options.length > 0) {
        const checked = form.querySelectorAll(`input[name="${key}"]:checked`);
        const vals = Array.from(checked).map((c) => c.value);
        if (field.is_required && vals.length === 0) {
          showFieldError(key, `${field.label} is required.`);
          clientError = true;
        }
        payloadData[key] = vals.join(", ");
      } else if (field.type === "checkbox") {
        const el = form.querySelector(`input[name="${key}"]`);
        if (field.is_required && !el.checked) {
          showFieldError(key, `${field.label} is required.`);
          clientError = true;
        }
        payloadData[key] = el.checked ? "Yes" : "No";
      } else {
        const el = form.querySelector(`[name="${key}"]`);
        const val = el ? el.value.trim() : "";
        if (field.is_required && !val) {
          showFieldError(key, `${field.label} is required.`);
          clientError = true;
        } else if (val && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          showFieldError(key, "Please enter a valid email address.");
          clientError = true;
        }
        payloadData[key] = val;
      }
    });

    if (clientError) {
      showFeedback("Please complete all required fields accurately.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/sites/${SITE_SLUG}/contact-enquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Site-Api-Key": API_KEY,
        },
        body: JSON.stringify({ data: payloadData }),
      });

      const result = await res.json();

      if (res.status === 200 && result.success) {
        showFeedback(
          result.message || "Thank you! Your quote request has been submitted. We'll be in touch within 24 hours.",
          "success"
        );
        form.reset();
      } else if (res.status === 422) {
        const errData = result.data || {};
        let firstMsg = result.message || "Validation failed";
        Object.keys(errData).forEach((rawKey) => {
          const cleanKey = rawKey.replace(/^data\./, "");
          const msg = Array.isArray(errData[rawKey]) ? errData[rawKey][0] : errData[rawKey];
          showFieldError(cleanKey, msg);
        });
        showFeedback(firstMsg, "error");
      } else {
        throw new Error(result.message || `Server returned error (${res.status})`);
      }
    } catch (err) {
      console.error("Submission error:", err);
      showFeedback(
        err.message || "Something went wrong while submitting. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    const btn = document.getElementById("mrSubmitBtn");
    if (!btn) return;
    btn.disabled = isLoading;
    const textSpan = btn.querySelector(".mr-btn-text");
    const loaderSpan = btn.querySelector(".mr-btn-loader");
    if (textSpan) textSpan.style.display = isLoading ? "none" : "inline";
    if (loaderSpan) loaderSpan.style.display = isLoading ? "inline-flex" : "none";
  }

  function showFieldError(key, message) {
    const errEl = document.getElementById(`mr_err_${key}`);
    const grp = document.querySelector(`.mr-field-group[data-key="${key}"]`);
    if (errEl) {
      errEl.textContent = message;
      errEl.style.display = "block";
    }
    if (grp) grp.classList.add("has-error");
  }

  function clearErrors() {
    document.querySelectorAll(".mr-field-error").forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });
    document.querySelectorAll(".mr-field-group.has-error").forEach((el) => {
      el.classList.remove("has-error");
    });
  }

  function showFeedback(msg, type) {
    const fb = document.getElementById("mrFormFeedback");
    if (!fb) return;
    fb.textContent = msg;
    fb.className = `mr-feedback mr-feedback-${type}`;
    fb.style.display = "block";
  }

  function hideFeedback() {
    const fb = document.getElementById("mrFormFeedback");
    if (!fb) return;
    fb.style.display = "none";
    fb.textContent = "";
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  fetchFields();
})();
