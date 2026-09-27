(function () {
  "use strict";

  const script = document.currentScript;
  const brandSlug = script?.dataset.brandSlug;
  const apiUrl = "https://lemeowapis.meowadvancedintelligence.com/api/user/brand";

  if (!brandSlug) return;

  const contactAnchors = Array.from(
    document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"], a[href*="wa.me/"]'),
  );

  const hideContact = (element) => {
    const row = element.closest("[data-brand-contact-item], .info-row");
    const listItem = element.closest("li");
    const labelledListItem =
      listItem && /^(phone|email|whatsapp|address)\b/i.test(listItem.textContent.trim());
    (row || (labelledListItem ? listItem : element)).hidden = true;
  };

  contactAnchors.forEach(hideContact);
  document.querySelectorAll("[data-brand-contact-list]").forEach((element) => {
    element.hidden = true;
  });

  const setLink = (anchor, value, type) => {
    if (!value) return;

    const originalUrl = new URL(anchor.href, window.location.href);
    if (type === "phone") {
      const digits = value.replace(/\D/g, "");
      anchor.href = originalUrl.hostname === "wa.me"
        ? `https://wa.me/${digits}${originalUrl.search}`
        : `tel:${value.replace(/\s/g, "")}`;
      if (/^\+?[\d\s()-]+$/.test(anchor.textContent.trim())) anchor.textContent = value;
      const phoneLabel = anchor.querySelector("[data-brand-phone-label]");
      if (phoneLabel) phoneLabel.textContent = `Call ${value}`;
    } else {
      anchor.href = `mailto:${value}${originalUrl.search}`;
      if (anchor.textContent.includes("@")) anchor.textContent = value;
    }
    anchor.hidden = false;
    const row = anchor.closest("[data-brand-contact-item], .info-row");
    const listItem = anchor.closest("li");
    const labelledListItem =
      listItem && /^(phone|email|whatsapp|address)\b/i.test(listItem.textContent.trim());
    if (row || labelledListItem) (row || listItem).hidden = false;
  };

  const renderContactList = (element, brand) => {
    const fields = [ 
      { key: "phone", label: "Phone", value: brand.phone },
      { key: "email", label: "Email", value: brand.email },
      { key: "address", label: "Address", value: brand.address },
    ].filter((field) => Boolean(field.value));

    element.replaceChildren(
      ...fields.map((field) => {
        const row = document.createElement("li");
        row.className = "brand-contact-row";
        const labelNode = document.createElement("strong");
        labelNode.textContent = `${field.label} · `;
        row.append(labelNode);

        if (field.key === "phone" || field.key === "email") {
          const link = document.createElement("a");
          link.className = "hover:text-bone transition";
          link.href = field.key === "phone"
            ? `tel:${field.value.replace(/\s/g, "")}`
            : `mailto:${field.value}`;
          link.textContent = field.value;
          row.append(link);
        } else {
          row.append(document.createTextNode(field.value));
        }
        return row;
      }),
    );
    element.hidden = fields.length === 0;
    const section = element.closest("[data-brand-contact-section]");
    if (section) section.hidden = fields.length === 0;
  };

  window.brandContactPromise = fetch(apiUrl, { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error(`Brand request failed (${response.status})`);
      return response.json();
    })
    .then((payload) => {
      const brand = payload?.data?.find(
        (item) => item.slug?.toLowerCase() === brandSlug.toLowerCase(),
      );
      if (!brand) return;

      contactAnchors.forEach((anchor) => {
        const href = anchor.getAttribute("href") || "";
        if (href.startsWith("mailto:")) setLink(anchor, brand.email, "email");
        else setLink(anchor, brand.phone, "phone");
      });

      document.querySelectorAll("[data-brand-contact-list]").forEach((element) => {
        renderContactList(element, brand);
      });
      document.querySelectorAll("[data-brand-field]").forEach((element) => {
        const value = brand[element.dataset.brandField];
        if (!value) {
          hideContact(element);
          return;
        }
        element.textContent = value;
        element.hidden = false;
      });
      return brand;
    })
    .catch((error) => {
      console.error("Unable to load brand contact information", error);
      return null;
    });
})();
