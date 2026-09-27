(function () {
  const API_BASE =
    "https://lemeowapis.meowadvancedintelligence.com/api/sites/meowrenovations-1785930255/reviews";
  const HELPERS_HEAD = "site_17ae9f96c18a0e8a81d0363c3c91a025709fdb7bace738b2";
  const PER_PAGE = 7;

  async function fetchReviewPage(page) {
    const url = new URL(API_BASE);
    url.searchParams.set("page", page);
    url.searchParams.set("per_page", PER_PAGE);

    const res = await fetch(url.href, {
      headers: {
        "X-Helpers-Secret": HELPERS_HEAD,
        "X-Site-Api-Key": HELPERS_HEAD,
        Accept: "application/json",
      },
    });

    if (!res.ok) throw new Error(`Reviews fetch failed: ${res.status}`);
    return extractPageData(await res.json());
  }

  async function fetchReviews() {
    try {
      const firstPage = await fetchReviewPage(1);
      const pages = [firstPage];
      const remaining = [];

      for (let page = 2; page <= firstPage.meta.lastPage; page += 1) {
        remaining.push(fetchReviewPage(page));
      }

      pages.push(...(await Promise.all(remaining)));
      return pages.flatMap((page) => page.reviews).map(normalizeReview);
    } catch (err) {
      console.log("REVIEWS GET ERROR /", err);
      return [];
    }
  }

  function extractPageData(payload) {
    const data = payload?.data ?? payload;
    const paginator = data && !Array.isArray(data) ? data : null;
    const reviews = extractReviews(data);

    return {
      reviews,
      meta: {
        lastPage: Number(paginator?.last_page || 1),
      },
    };
  }

  function extractReviews(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.reviews)) return data.reviews;
    if (Array.isArray(data?.items)) return data.items;
    if (data && typeof data === "object" && isReviewLike(data)) return [data];
    return [];
  }

  function isReviewLike(value) {
    return Boolean(
      value &&
        typeof value === "object" &&
        (value.name || value.title || value.description || value.review),
    );
  }

  function firstValue(...values) {
    return values.find(
      (value) => value !== undefined && value !== null && value !== "",
    );
  }

  function normalizeReview(review) {
    return {
      name: firstValue(review.name, review.customer_name, review.author, "Client"),
      title: firstValue(
        review.title,
        review.heading,
        review.service_name,
        review.category_name,
        "Client Review",
      ),
      text: firstValue(review.review, review.comment, review.description, ""),
      imageUrl: normalizeMediaUrl(
        firstValue(
          review.image_url,
          review.avatar_url,
          review.photo_url,
          review.media?.[0]?.path_url,
          review.media_list?.[0]?.path_url,
        ),
      ),
      meta: [review.category_name, review.sub_category_name]
        .filter(Boolean)
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .join(" / "),
      rating: Math.max(
        1,
        Math.min(5, Number(firstValue(review.rating, review.stars, 5))),
      ),
      order: Number(firstValue(review.sort_order, review.sortOrder, review.id, 999)),
    };
  }

  function normalizeMediaUrl(value) {
    if (!value) return "";
    const markdownMatch = String(value).match(/\((https?:\/\/[^)]+)\)/);
    const urlValue = markdownMatch ? markdownMatch[1] : value;

    try {
      const url = new URL(urlValue, API_BASE);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch (err) {
      return "";
    }
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getInitial(name) {
    return String(name).trim().charAt(0).toUpperCase() || "C";
  }

  function renderStars(rating) {
    return "★★★★★".slice(0, rating);
  }

  function renderReviewCard(review) {
    const imageHTML = review.imageUrl
      ? `<img src="${escapeHTML(review.imageUrl)}" alt="${escapeHTML(review.name)} review" class="testi-photo" loading="lazy" onerror="this.remove()">`
      : "";
    const metaHTML = review.meta
      ? `<div class="text-xs text-stone">${escapeHTML(review.meta)}</div>`
      : "";

    return `
      <figure class="bg-bone border border-softgrey rounded-3xl overflow-hidden reveal in flex flex-col">
        ${imageHTML}
        <div class="p-7 grow flex flex-col">
          <div class="text-accent text-lg">${renderStars(review.rating)}</div>
          <blockquote class="font-display text-lg mt-4 leading-snug">
            "${escapeHTML(review.title)}"
          </blockquote>
          <p class="mt-3 text-sm text-stone leading-relaxed grow">
            ${escapeHTML(review.text)}
          </p>
          <figcaption class="mt-5 flex items-center gap-3">
            <span class="w-9 h-9 rounded-full bg-clay/20 grid place-items-center font-display text-clay text-sm">${escapeHTML(getInitial(review.name))}</span>
            <div>
              <div class="text-sm font-semibold">${escapeHTML(review.name)}</div>
              ${metaHTML}
            </div>
            <span class="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Verified</span>
          </figcaption>
        </div>
      </figure>
    `;
  }

  async function initReviewsSection() {
    const grid = document.getElementById("reviews-grid");
    if (!grid) return;

    const reviews = await fetchReviews();
    if (reviews.length === 0) return;

    grid.insertAdjacentHTML(
      "afterbegin",
      [...reviews] 
        .map(renderReviewCard)
        .join(""),
    );
  }

  window.initReviewsSection = initReviewsSection;
})();
