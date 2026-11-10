"use strict";

// For spoken audio, supply a WebVTT captions path. See README.md for an example.
const projects = [
  { id: "roblox-1", title: "Basketball Zero", category: "roblox", src: "assets/videos/basketball-zero.mp4", poster: "assets/images/roblox-edit-01.png", aspect: "landscape", captions: "" },
  { id: "roblox-2", title: "Reawakened", category: "roblox", slate: "R / 02", src: "assets/videos/New-Project-625-8CE6872--airmore-upscaled.mp4", poster: "assets/images/awakened.png", aspect: "landscape", captions: "" },
  { id: "roblox-3", title: "Grow A Mushroom", category: "roblox", slate: "R / 03", src: "assets/videos/quality_restoration_20261016155805925.mp4", poster: "assets/images/Screenshot (8832).png", aspect: "landscape", captions: "" },
  { id: "anime-1", title: "Frieren: Beyond Journey's End", category: "anime", slate: "A / 01", src: "assets/videos/videoplayback (3).mp4", poster: "assets/images/Frieren.jpg", aspect: "landscape", captions: "" },
  { id: "anime-2", title: "Jujutsu Kaisen: The Honored One", category: "anime", slate: "A / 02", src: "assets/videos/Gojo - My Eyes [Edit_AMV] Alight motion [Best (1080p)].mp4", poster: "assets/images/gojo.png", aspect: "landscape", captions: "" },
  { id: "anime-3", title: "Naruto", category: "anime", slate: "A / 03", src: "assets/videos/itachi-web.mp4", poster: "assets/images/itachi.png", aspect: "landscape", captions: "" }
];

const allPlayers = new Set();
const durationFormat = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

function makeElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createMedia(entry, { onDuration = () => {} } = {}) {
  if (!entry.src) {
    const placeholder = makeElement("div", "video-placeholder");
    const slate = makeElement("span", "placeholder-slate", entry.slate);
    slate.setAttribute("aria-hidden", "true");
    placeholder.append(slate, makeElement("p", "placeholder-label", "Video coming soon"));
    return placeholder;
  }
  const container = makeElement("div", "media-container");
  const frame = makeElement("div", `player-frame${entry.aspect === "portrait" ? " is-portrait" : ""}`);
  const video = document.createElement("video");
  video.controls = true;
  video.playsInline = true;
  video.preload = "none";
  video.poster = entry.poster || "assets/images/video-placeholder.svg";
  video.setAttribute("aria-label", entry.title);
  video.textContent = "Your browser does not support HTML5 video playback.";
  allPlayers.add(video);
  frame.append(video);
  container.append(frame);

  const message = makeElement("p", "player-message");
  message.hidden = true;
  message.setAttribute("role", "status");
  const retry = makeElement("button", "player-retry", "Retry video");
  retry.type = "button";
  retry.hidden = true;
  container.append(message, retry);

  function setStatus(text) {
    message.textContent = text;
    message.hidden = !text;
  }
  video.addEventListener("loadstart", () => {
    // A deferred player can emit loadstart without fetching any media yet.
    if (!video.paused || video.preload !== "none") setStatus("Loading video…");
  });
  video.addEventListener("waiting", () => setStatus("Buffering video…"));
  video.addEventListener("stalled", () => setStatus("Loading is taking longer than expected. Check your connection."));
  video.addEventListener("canplay", () => { setStatus(""); retry.hidden = true; });
  video.addEventListener("playing", () => setStatus(""));
  video.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(video.duration)) onDuration(durationFormat(video.duration));
    setStatus("");
  });
  video.addEventListener("error", () => {
    setStatus("This video couldn’t load. The file may be unavailable or unsupported. Please try again.");
    retry.hidden = false;
  });
  retry.addEventListener("click", () => {
    retry.hidden = true;
    setStatus("Loading video…");
    video.preload = "metadata";
    video.load();
    video.focus();
  });
  video.addEventListener("play", () => {
    for (const other of allPlayers) if (other !== video) other.pause();
  });

  if (entry.captions) {
    const track = document.createElement("track");
    track.kind = "captions";
    track.src = entry.captions;
    track.srclang = entry.captionLanguage || "en";
    track.label = entry.captionLabel || "English";
    video.append(track);
  }
  // Direct src makes network/codec errors observable on the video element.
  // preload=none means browsing the gallery does not download every file.
  video.src = entry.src;
  return container;
}

function renderProjects() {
  for (const entry of projects) {
    const grid = document.querySelector(`.project-group[data-category="${entry.category}"] .project-grid`);
    const article = makeElement("article", "project");
    article.id = entry.id;
    article.dataset.category = entry.category;
    article.setAttribute("aria-labelledby", `${entry.id}-title`);
    const header = makeElement("div", "project-header");
    const heading = makeElement("h4", "", entry.title);
    heading.id = `${entry.id}-title`;
    const duration = makeElement("span", "project-duration");
    const metadata = makeElement("div");
    const category = entry.category.charAt(0).toUpperCase() + entry.category.slice(1);
    metadata.append(makeElement("p", "project-category", entry.src ? `${category} / Video edit` : "Placeholder"), heading);
    header.append(metadata, duration);
    const media = createMedia(entry, { onDuration: (value) => {
      duration.textContent = value;
      duration.setAttribute("aria-label", `Duration ${value}`);
    } });
    article.append(media, header);
    grid.append(article);
  }
}

function setupFilters() {
  const filters = document.querySelector(".filters");
  filters.hidden = false;
  const grid = document.querySelector("#project-grid");
  const items = [...grid.children];
  const buttons = [...filters.querySelectorAll("button")];
  function filter(category) {
    let count = 0;
    let available = 0;
    for (const item of items) {
      const visible = category === "all" || item.dataset.category === category;
      item.hidden = !visible;
      for (const project of item.querySelectorAll(".project")) {
        project.classList.remove("project-enter");
        if (visible) project.classList.add("project-enter");
      }
      if (visible) {
        count += item.querySelectorAll(".project").length;
        available += item.querySelectorAll("video").length;
      }
      else item.querySelectorAll("video").forEach((video) => video.pause());
    }
    for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.filter === category));
    const empty = document.querySelector("#empty-gallery");
    empty.hidden = count !== 0;
    empty.textContent = category === "all"
      ? "No edits published yet. Check back for the first video."
      : `No ${category === "anime" ? "anime" : "Roblox"} edits published yet. Choose another filter to see available work.`;
    document.querySelector("#filter-status").textContent = `${count} slots shown: ${available} video${available === 1 ? "" : "s"} available, ${count - available} placeholder${count - available === 1 ? "" : "s"}.`;
  }
  for (const button of buttons) button.addEventListener("click", () => filter(button.dataset.filter));
  for (const link of document.querySelectorAll('a[href="#works"]')) {
    link.addEventListener("click", () => filter("all"));
  }
  filter("all");
}

function setupNavigation() {
  const menu = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#navigation");
  const narrowScreen = window.matchMedia("(max-width: 767px)");
  function setMenu(open) {
    menu.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("is-open", open);
    menu.querySelector("span").textContent = open ? "−" : "+";
  }
  function syncMenu() {
    menu.hidden = !narrowScreen.matches;
    setMenu(false);
  }
  menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menu.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) setMenu(false);
  });
  const navLinks = [...navigation.querySelectorAll("a")];
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    link.addEventListener("click", () => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      setMenu(false);
      for (const navLink of navLinks) {
        if (navLink.hash === link.hash) navLink.setAttribute("aria-current", "location");
        else navLink.removeAttribute("aria-current");
      }
      // Keep keyboard focus with the destination when a mobile link disappears.
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }
  narrowScreen.addEventListener("change", syncMenu);
  syncMenu();
}

// Pause when leaving the tab, including a native fullscreen player.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) for (const video of allPlayers) video.pause();
});

renderProjects();
setupFilters();
setupNavigation();
document.documentElement.classList.add("js");
