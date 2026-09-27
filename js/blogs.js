(function () {
  const API_URL =
    "https://lemeowapis.meowadvancedintelligence.com/api/sites/meowrenovations-1785930255/blogs?nopaginate=1";

  let cachedBlogs = null;

  async function fetchBlogs() {
    if (cachedBlogs) return cachedBlogs;
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json())?.data ?? [];
      cachedBlogs = Array.isArray(data) ? data : [data];
      return cachedBlogs;
    } catch (err) {
      console.log("BLOGS GET ERROR /", err);
      return [];
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getCoverImage(blog) {
    return (
      blog.cover_photo_url || blog.cover_photo || blog.featured_image || ""
    );
  }

  function isPublished(blog) {
    return blog.status === "published" || blog.pivot?.status === "published";
  }

  function getPublishedDate(blog) {
    return blog.published_at || blog.pivot?.published_at || blog.created_at;
  }

  function sortNewestFirst(blogs) {
    return [...blogs].sort((a, b) => {
      const dateA = new Date(getPublishedDate(a) || 0);
      const dateB = new Date(getPublishedDate(b) || 0);
      return dateB - dateA;
    });
  }

  function createBlogCard(blog) {
    const card = document.createElement("article");
    card.className = "blog-card reveal";

    const coverUrl = getCoverImage(blog);
    const pubDate = formatDate(getPublishedDate(blog));
    const author = blog.author || "Meow Renovations";

    card.innerHTML = `
      <a href="blog-details.html?slug=${encodeURIComponent(blog.slug)}" class="blog-card__image-wrap">
        ${
          coverUrl
            ? `<img src="${coverUrl}" alt="${blog.title}" class="blog-card__image" loading="lazy" onerror="this.parentElement.style.display='none'">`
            : ""
        }
      </a>
      <div class="blog-card__body">
        <div class="blog-card__meta">
          <span>${pubDate}</span>
          <span class="blog-card__meta-dot"></span>
          <span>${author}</span>
        </div>
        <h3 class="blog-card__title">${blog.title}</h3>
        <p class="blog-card__desc">${blog.description || ""}</p>
        <div class="blog-card__footer">
          <span class="blog-card__author">${author}</span>
          <a href="blog-details.html?slug=${encodeURIComponent(blog.slug)}" class="blog-card__readmore">
            Read More
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </div>
    `;
    return card;
  }

  function revealNewCards() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    document
      .querySelectorAll(".blog-card.reveal")
      .forEach((el) => io.observe(el));
  }

  async function initBlogSection() {
    const grid = document.getElementById("blog-grid");
    const skeleton = document.getElementById("blog-skeleton");
    const empty = document.getElementById("blog-empty");
    if (!grid) return;

    const blogs = await fetchBlogs();
    const published = sortNewestFirst(blogs.filter(isPublished));

    skeleton.style.display = "none";

    if (published.length === 0) {
      empty.classList.remove("hidden");
      return;
    }

    const latest = published.slice(0, 3);
    latest.forEach((blog) => {
      grid.appendChild(createBlogCard(blog));
    });

    revealNewCards();
  }

  async function initBlogListing() {
    const grid = document.getElementById("blog-listing-grid");
    const skeleton = document.getElementById("blog-listing-skeleton");
    const empty = document.getElementById("blog-listing-empty");
    if (!grid) return;

    const blogs = await fetchBlogs();
    const published = sortNewestFirst(blogs.filter(isPublished));

    skeleton.style.display = "none";

    if (published.length === 0) {
      empty.classList.remove("hidden");
      return;
    }

    published.forEach((blog) => {
      grid.appendChild(createBlogCard(blog));
    });

    revealNewCards();
  }

  async function initBlogDetails() {
    const container = document.getElementById("blog-detail-content");
    const notFound = document.getElementById("blog-not-found");
    const skeleton = document.getElementById("blog-detail-skeleton");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    if (!slug) {
      if (skeleton) skeleton.style.display = "none";
      if (notFound) notFound.classList.remove("hidden");
      return;
    }

    const blogs = await fetchBlogs();
    const blog = blogs.find((b) => b.slug === slug);

    if (skeleton) skeleton.style.display = "none";

    if (!blog) {
      if (notFound) notFound.classList.remove("hidden");
      return;
    }

    document.title = `${blog.title} · Meow Renovations`;

    const coverUrl = getCoverImage(blog);
    const pubDate = formatDate(getPublishedDate(blog));
    const author = blog.author || "Meow Renovations";
    const tags = blog.tags || [];
    const views = blog.views || 0;

    const metaHTML = `
      <div class="blog-detail__meta">
        <span>${pubDate}</span>
        <span class="blog-detail__meta-dot"></span>
        <span>By ${author}</span>
        ${views > 0 ? `<span class="blog-detail__meta-dot"></span><span>${views} views</span>` : ""}
      </div>
    `;

    const tagsHTML =
      tags.length > 0
        ? `<div class="blog-detail__tags">${tags.map((t) => `<span class="blog-detail__tag">${t}</span>`).join("")}</div>`
        : "";

    container.innerHTML = `
      <a href="blog.html" class="blog-detail__back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M13 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Back to all articles
      </a>
      ${metaHTML}
      <h1 class="blog-detail__title">${blog.title}</h1>
      ${tagsHTML}
      ${
        coverUrl
          ? `<div class="blog-detail__cover"><img src="${coverUrl}" alt="${blog.title}" /></div>`
          : ""
      }
      <div class="blog-detail__content bn-default-styles bn-root">${blog.content}</div>
    `;
  }

  window.initBlogSection = initBlogSection;
  window.initBlogListing = initBlogListing;
  window.initBlogDetails = initBlogDetails;
})();
