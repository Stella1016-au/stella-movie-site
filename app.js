const API_BASE = "https://api.themoviedb.org/3/movie/now_playing";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

/** Defined in config.js (see config.example.js). Use a backend proxy for production. */
const API_KEY =
  typeof TMDB_API_KEY !== "undefined" && TMDB_API_KEY && TMDB_API_KEY !== "YOUR_TMDB_API_KEY_HERE"
    ? TMDB_API_KEY
    : "";

const gridEl = document.getElementById("movie-grid");
const statusEl = document.getElementById("status");
const introEl = document.querySelector(".intro");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("status--error", isError);
}

function buildPosterUrl(posterPath) {
  if (!posterPath) return null;
  return `${IMG_BASE}${posterPath}`;
}

function createPlaceholder() {
  const div = document.createElement("div");
  div.className = "movie-card__poster movie-card__poster--placeholder";
  div.textContent = "No poster";
  return div;
}

function renderMovies(results) {
  gridEl.innerHTML = "";

  for (const movie of results) {
    const li = document.createElement("li");
    li.className = "movie-card";

    const link = document.createElement("a");
    link.className = "movie-card__link";
    link.href = `https://www.themoviedb.org/movie/${movie.id}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `${movie.title} - View on TMDB`);

    const posterUrl = buildPosterUrl(movie.poster_path);
    if (posterUrl) {
      const img = document.createElement("img");
      img.className = "movie-card__poster";
      img.src = posterUrl;
      img.alt = `${movie.title} poster`;
      img.loading = "lazy";
      img.decoding = "async";
      link.appendChild(img);
    } else {
      link.appendChild(createPlaceholder());
    }

    const title = document.createElement("h3");
    title.className = "movie-card__title";
    title.textContent = movie.title;

    li.appendChild(link);
    li.appendChild(title);
    gridEl.appendChild(li);
  }
}

async function loadNowPlaying() {
  if (!API_KEY) {
    setStatus(
      "TMDB API key is missing. Copy config.example.js to config.js and set TMDB_API_KEY.",
      true
    );
    return;
  }

  setStatus("Loading...");
  gridEl.innerHTML = "";

  const url = new URL(API_BASE);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const results = data.results ?? [];

    if (results.length === 0) {
      setStatus("No movies to display.");
      return;
    }

    setStatus(`${results.length} movies`);
    renderMovies(results);
  } catch (e) {
    console.error(e);
    setStatus("Unable to load movie data. Check your network and API key.", true);
  }
}

function setupIntroScrollAnimation() {
  if (!introEl) return;

  let ticking = false;

  const updateIntroProgress = () => {
    const rect = introEl.getBoundingClientRect();
    const scrollRange = Math.max(introEl.offsetHeight - window.innerHeight, 1);
    const scrolled = Math.min(Math.max(-rect.top, 0), scrollRange);
    const progress = scrolled / scrollRange;
    introEl.style.setProperty("--intro-progress", progress.toFixed(3));
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateIntroProgress);
  };

  updateIntroProgress();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateIntroProgress);
}

setupIntroScrollAnimation();
loadNowPlaying();
