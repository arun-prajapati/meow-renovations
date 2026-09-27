(() => {
  if (window.__meowNoticeBoardLoaded) return;
  window.__meowNoticeBoardLoaded = true;

  const API_BASE = "https://lemeowapis.meowadvancedintelligence.com";
  const SITE_SLUG = "meowrenovations-1785930255";
  const API_KEY = "site_17ae9f96c18a0e8a81d0363c3c91a025709fdb7bace738b2";
  const STORAGE_KEY = "dismissed_notices";
  const STYLE_ID = "meow-notice-board-styles";
  const THEME = {
    overlay: "rgba(31, 27, 22, 0.72)",
    panel: "#fbf8f2",
    line: "#e8e4dc",
    ink: "#1f1b16",
    muted: "#6b6359",
    accent: "#8b7355",
    closeBackground: "rgba(251, 248, 242, 0.96)",
    shadow: "rgba(31, 27, 22, 0.3)",
    body: '"Manrope", sans-serif',
    display: '"Fraunces", Georgia, serif',
    radius: "20px",
  };

  const state = {
    queue: [],
    current: null,
    overlay: null,
    panel: null,
    previousFocus: null,
    previousBodyOverflow: null,
  };

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .notice-board-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: 12px;
        padding-top: max(12px, env(safe-area-inset-top, 0px));
        padding-right: max(12px, env(safe-area-inset-right, 0px));
        padding-bottom: max(12px, env(safe-area-inset-bottom, 0px));
        padding-left: max(12px, env(safe-area-inset-left, 0px));
        background: ${THEME.overlay};
        color: ${THEME.ink};
        font-family: ${THEME.body};
      }
      .notice-board-panel {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 70vw;
        max-width: 70vw;
        max-height: 90dvh;
        min-width: 0;
        min-height: 0;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        overflow: hidden;
        border: 1px solid ${THEME.line};
        border-radius: ${THEME.radius};
        background: ${THEME.panel};
        color: ${THEME.ink};
        box-shadow: 0 24px 80px ${THEME.shadow};
      }
      .notice-board-panel:focus-visible {
        outline: 2px solid ${THEME.accent};
        outline-offset: -2px;
      }
      .notice-board-close {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 10;
        display: grid;
        width: 36px;
        height: 36px;
        place-items: center;
        padding: 0;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 50%;
        background: #ffffff;
        color: #1f1b16;
        font: 400 24px/1 ${THEME.body};
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
      }
      .notice-board-close:hover,
      .notice-board-close:focus-visible {
        background: #f0ede6;
        color: ${THEME.accent};
      }
      .notice-board-full-content {
        flex: 1 1 auto;
        width: 100%;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        box-sizing: border-box;
        padding: clamp(24px, 4vw, 40px);
        padding-right: clamp(64px, 7vw, 80px);
        overflow-wrap: anywhere;
        scrollbar-gutter: stable;
      }
      .notice-board-full-layout {
        display: flex;
        flex: 1 1 auto;
        min-height: 0;
        flex-direction: column;
      }
      .notice-board-full-layout:not(.has-image) .notice-board-full-content {
        padding-top: 64px;
      }
      .notice-board-title {
        margin: 0;
        color: ${THEME.ink};
        font-family: ${THEME.display};
        font-size: clamp(2rem, 6vw, 4.5rem);
        font-weight: 500;
        line-height: 1.05;
      }
      .notice-board-subtitle {
        margin: 16px 0 0;
        color: ${THEME.accent};
        font-size: clamp(1rem, 2vw, 1.35rem);
        line-height: 1.4;
      }
      .notice-board-date {
        margin: 18px 0 0;
        color: ${THEME.muted};
        font-size: 0.9rem;
        line-height: 1.5;
      }
      .notice-board-message {
        margin: 28px 0 0;
        color: ${THEME.ink};
        font-size: clamp(1rem, 1.7vw, 1.2rem);
        line-height: 1.7;
        white-space: pre-wrap;
      }
      .notice-board-image {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }
      .notice-board-full-image {
        position: relative;
        flex: 0 0 auto;
        width: 100%;
        max-height: 40dvh;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        background: ${THEME.panel};
      }
      .notice-board-image-content {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 70vw;
        max-height: 85svh;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        padding: 0;
        overflow: hidden;
      }
      .notice-board-picture {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-height: 85svh;
        min-width: 0;
        min-height: 0;
      }
      .notice-board-banner {
        display: block;
        width: 100%;
        height: auto;
        max-height: 85svh;
        object-fit: contain;
        object-position: center;
      }
      @media (max-width: 767px) {
        .notice-board-panel {
          width: auto;
          max-width: calc(100vw - 24px);
          max-height: 80svh;
          min-width: 0;
          min-height: 0;
        }
        .notice-board-image-content {
          display: flex;
          align-items: center;
          justify-content: center;
          width: auto;
          max-width: 100%;
          max-height: 80svh;
          min-width: 0;
          min-height: 0;
        }
        .notice-board-picture {
          display: flex;
          align-items: center;
          justify-content: center;
          width: auto;
          max-width: 100%;
          max-height: 80svh;
          min-width: 0;
          min-height: 0;
        }
        .notice-board-banner {
          width: auto;
          height: auto;
          max-width: calc(100vw - 24px);
          max-height: 80svh;
          object-fit: contain;
        }
        .notice-board-full-image {
          max-height: 34dvh;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getString(value) {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    return "";
  }

  function resolveImageUrl(value) {
    const raw = getString(value);
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return "";
    return `${API_BASE}/${raw.replace(/^\/+/, "")}`;
  }

  function getDismissedIds() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function getDismissedSet() {
    return new Set(getDismissedIds().map((value) => String(value)));
  }

  function saveDismissed(id) {
    const ids = getDismissedIds();
    if (!ids.some((value) => String(value) === String(id))) ids.push(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      return;
    }
  }

  function isDismissible() {
    return true;
  }

  function extractNotices(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || payload.success === false) return [];
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
    return [];
  }

  function normalizeNotice(item) {
    if (!item || typeof item !== "object") return null;
    const type = getString(item.type).toLowerCase();
    const id = getString(item.id);
    const displayOn = getString(item.display_on).toLowerCase();
    if (displayOn === "app") return null;

    const title = getString(item.title);
    const subtitle = getString(item.subtitle);
    const message = getString(item.message);
    const displayDateRange = getString(item.display_date_range);
    const imageUrl =
      resolveImageUrl(item.image_url) || resolveImageUrl(item.image);
    const webBannerImageUrl =
      resolveImageUrl(item.web_banner_image_url) ||
      resolveImageUrl(item.web_banner_image);
    const webMobileBannerImageUrl =
      resolveImageUrl(item.web_mobile_banner_image_url) ||
      resolveImageUrl(item.web_mobile_banner_image);
    if (!id || (type !== "full" && type !== "image_only")) return null;
    if (
      type === "full" &&
      !title &&
      !subtitle &&
      !message &&
      !displayDateRange &&
      !imageUrl
    ) {
      return null;
    }
    if (type === "image_only" && !webBannerImageUrl && !webMobileBannerImageUrl) {
      return null;
    }
    return {
      id,
      type,
      title: title || "Notice",
      subtitle,
      message,
      displayDateRange,
      imageUrl,
      webBannerImageUrl: webBannerImageUrl || webMobileBannerImageUrl,
      webMobileBannerImageUrl,
      hasTextContent: Boolean(title || subtitle || message || displayDateRange),
      isDismissible: isDismissible(item.is_dismissible),
    };
  }

  function appendText(parent, tagName, className, value) {
    if (!value) return null;
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = value;
    parent.appendChild(element);
    return element;
  }

  function createCloseButton(notice) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "notice-board-close";
    button.setAttribute("aria-label", "Dismiss notice");
    button.textContent = "×";
    button.addEventListener("click", () => {
      if (state.current === notice) dismissCurrent();
    });
    return button;
  }

  function createFullContent(notice) {
    if (notice.imageUrl && !notice.hasTextContent) {
      const content = document.createElement("div");
      content.className = "notice-board-image-content";
      const image = document.createElement("img");
      image.className = "notice-board-banner";
      image.src = notice.imageUrl;
      image.alt = "Notice";
      content.appendChild(image);
      return { content, titleId: "", descriptionIds: [] };
    }
    const layout = document.createElement("div");
    layout.className = "notice-board-full-layout";
    if (notice.imageUrl) {
      layout.classList.add("has-image");
      const media = document.createElement("div");
      media.className = "notice-board-full-image";
      const image = document.createElement("img");
      image.className = "notice-board-image";
      image.src = notice.imageUrl;
      image.alt = notice.title;
      media.appendChild(image);
      layout.appendChild(media);
    }
    const content = document.createElement("div");
    content.className = "notice-board-full-content";
    const title = appendText(content, "h2", "notice-board-title", notice.title);
    title.id = "notice-board-title";
    const descriptionIds = [];
    const subtitle = appendText(
      content,
      "p",
      "notice-board-subtitle",
      notice.subtitle,
    );
    if (subtitle) {
      subtitle.id = "notice-board-subtitle";
      descriptionIds.push(subtitle.id);
    }
    const date = appendText(
      content,
      "p",
      "notice-board-date",
      notice.displayDateRange,
    );
    if (date) {
      date.id = "notice-board-date";
      descriptionIds.push(date.id);
    }
    const message = appendText(
      content,
      "p",
      "notice-board-message",
      notice.message,
    );
    if (message) {
      message.id = "notice-board-message";
      descriptionIds.push(message.id);
    }
    layout.appendChild(content);
    return { content: layout, titleId: title.id, descriptionIds };
  }

  function createImageContent(notice) {
    const content = document.createElement("div");
    content.className = "notice-board-image-content";
    const picture = document.createElement("picture");
    picture.className = "notice-board-picture";
    if (notice.webMobileBannerImageUrl) {
      const source = document.createElement("source");
      source.setAttribute("media", "(max-width: 767px)");
      source.setAttribute("srcset", notice.webMobileBannerImageUrl);
      picture.appendChild(source);
    }
    const image = document.createElement("img");
    image.className = "notice-board-banner";
    image.src = notice.webBannerImageUrl;
    image.alt = notice.title || "Notice";
    picture.appendChild(image);
    content.appendChild(picture);
    return { content };
  }

  function createDialog(notice) {
    const overlay = document.createElement("div");
    overlay.className = "notice-board-overlay";
    overlay.setAttribute("role", "presentation");
    const panel = document.createElement("section");
    panel.className = `notice-board-panel notice-board-${notice.type === "full" ? "full" : "image-only"}`;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.tabIndex = -1;
    const rendered =
      notice.type === "full" ? createFullContent(notice) : createImageContent(notice);
    if (notice.type === "full") {
      if (rendered.titleId) {
        panel.setAttribute("aria-labelledby", rendered.titleId);
      } else {
        panel.setAttribute("aria-label", "Notice");
      }
      if (rendered.descriptionIds.length) {
        panel.setAttribute("aria-describedby", rendered.descriptionIds.join(" "));
      }
    } else {
      panel.setAttribute("aria-label", notice.title || "Notice");
    }
    panel.appendChild(rendered.content);
    panel.appendChild(createCloseButton(notice));
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    overlay.addEventListener("keydown", handleKeydown);
    return { overlay, panel };
  }

  function getFocusableElements() {
    if (!state.panel) return [];
    return Array.from(
      state.panel.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      ),
    ).filter((element) => !element.hasAttribute("disabled"));
  }

  function handleKeydown(event) {
    if (!state.current) return;
    if (event.key === "Escape") {
      event.preventDefault();
      dismissCurrent();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = getFocusableElements();
    if (!focusable.length) {
      event.preventDefault();
      state.panel.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === state.panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function removeDialog() {
    if (!state.overlay) return;
    const previousFocus = state.previousFocus;
    state.overlay.remove();
    if (state.previousBodyOverflow) {
      document.body.style.overflow = state.previousBodyOverflow.overflow;
      document.body.style.overflowX = state.previousBodyOverflow.overflowX;
      document.body.style.overflowY = state.previousBodyOverflow.overflowY;
    }
    state.overlay = null;
    state.panel = null;
    state.current = null;
    state.previousFocus = null;
    state.previousBodyOverflow = null;
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
  }

  function dismissCurrent() {
    if (!state.current) return;
    saveDismissed(state.current.id);
    removeDialog();
    showNext();
  }

  function showNext() {
    const dismissed = getDismissedSet();
    while (state.queue.length && dismissed.has(String(state.queue[0].id))) {
      state.queue.shift();
    }
    const notice = state.queue.shift();
    if (!notice) return;
    state.current = notice;
    state.previousFocus = document.activeElement;
    const dialog = createDialog(notice);
    state.overlay = dialog.overlay;
    state.panel = dialog.panel;
    state.previousBodyOverflow = {
      overflow: document.body.style.overflow,
      overflowX: document.body.style.overflowX,
      overflowY: document.body.style.overflowY,
    };
    document.body.style.overflow = "hidden";
    const focusTarget =
      state.panel.querySelector(".notice-board-close") || state.panel;
    focusTarget.focus({ preventScroll: true });
  }

  async function loadNotices() {
    try {
      installStyles();
      const response = await fetch(
        `${API_BASE}/api/sites/${SITE_SLUG}/notice-board?nopaginate=1`,
        {
          method: "GET",
          headers: {
            "X-Site-Api-Key": API_KEY,
            Accept: "application/json",
          },
          credentials: "omit",
        },
      );
      if (!response.ok) return;
      const payload = await response.json();
      const dismissed = getDismissedSet();
      state.queue = extractNotices(payload)
        .map(normalizeNotice)
        .filter(Boolean)
        .filter((notice) => !dismissed.has(String(notice.id)));
      showNext();
    } catch {
      return;
    }
  }

  function start() {
    void loadNotices();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
