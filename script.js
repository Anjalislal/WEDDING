const config = window.WEDDING_CONFIG;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const setText = (selector, value) => {
  const element = $(selector);
  if (element) element.textContent = value;
};

const names = `${config.brideName} & ${config.groomName}`;

setText("#coverNames", names);
setText("#coupleNames", names);
setText("#coverDate", config.weddingDateLabel);
setText("#eventDate", config.weddingDateLabel);
setText("#eventTime", config.weddingTimeLabel);
setText("#revealedDate", config.weddingDateLabel);
setText("#revealedTime", config.weddingTimeLabel);
setText("#venueName", config.venueName);
setText("#venueText", `We would be honored to celebrate with you at ${config.venueName}.`);
setText("#invitationMessage", config.invitationMessage);

document.title = `${names} | Wedding Invitation`;

const updateMeta = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.setAttribute("content", value);
};

updateMeta('meta[name="description"]', config.shareDescription);
updateMeta('meta[property="og:title"]', config.shareTitle || document.title);
updateMeta('meta[property="og:description"]', config.shareDescription);
updateMeta('meta[property="og:image"]', config.assets.shareImage);
updateMeta('meta[name="twitter:card"]', "summary_large_image");

const imageExists = (url) =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });

const setBackground = async (selector, url) => {
  const element = $(selector);
  if (!element) return;
  if (url && (await imageExists(url))) {
    element.style.backgroundImage = `url("${url}")`;
    element.classList.remove("placeholder");
  } else {
    element.classList.add("placeholder");
  }
};

setBackground("#coverPhoto", config.assets.coverPhoto);
setBackground("#heroPhoto", config.assets.heroPhoto);
setBackground("#portraitOne", config.assets.portraitPhoto);

const galleryGrid = $("#galleryGrid");
config.assets.gallery.forEach(async (url) => {
  const item = document.createElement("div");
  item.className = "gallery__item placeholder";
  item.setAttribute("role", "img");
  item.setAttribute("aria-label", "Wedding gallery photo");
  galleryGrid.appendChild(item);
  if (await imageExists(url)) {
    item.style.backgroundImage = `url("${url}")`;
    item.classList.remove("placeholder");
  }
});

const mapButton = $("#mapButton");
if (mapButton) {
  const hasMap = config.locationLink && !config.locationLink.includes("[");
  mapButton.href = hasMap ? config.locationLink : "#";
  mapButton.toggleAttribute("aria-disabled", !hasMap);
}

const cover = $("#cover");
const openButton = $("#openInvitation");
const openInvitation = () => {
  cover.classList.add("is-open");
  document.body.classList.add("invitation-open");
  window.setTimeout(() => $("#site")?.scrollIntoView({ behavior: "smooth" }), 420);
  playMusic();
};

cover.addEventListener("click", (event) => {
  if (event.target.closest(".open-button") || event.target === cover || event.target.closest(".cover__content")) {
    openInvitation();
  }
});
openButton.addEventListener("click", openInvitation);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  },
  { threshold: 0.18 }
);

$$(".reveal").forEach((element) => revealObserver.observe(element));

const audio = $("#backgroundMusic");
const musicToggle = $("#musicToggle");
audio.src = config.assets.music;

async function playMusic() {
  if (!config.assets.music || config.assets.music.includes("[")) return;
  try {
    await audio.play();
    musicToggle.classList.add("is-playing");
  } catch {
    musicToggle.classList.remove("is-playing");
  }
}

musicToggle.addEventListener("click", async () => {
  if (audio.paused) {
    await playMusic();
  } else {
    audio.pause();
    musicToggle.classList.remove("is-playing");
  }
});

const timer = $("#countdownTimer");
const targetDate = new Date(config.weddingDateISO);

const updateCountdown = () => {
  if (Number.isNaN(targetDate.getTime())) {
    timer.innerHTML = "<p>Please add weddingDateISO in config.js</p>";
    return;
  }

  const remaining = Math.max(0, targetDate.getTime() - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const values = { days, hours, minutes, seconds };

  Object.entries(values).forEach(([unit, value]) => {
    const element = timer.querySelector(`[data-unit="${unit}"]`);
    if (element) element.textContent = String(value).padStart(2, "0");
  });
};

updateCountdown();
window.setInterval(updateCountdown, 1000);

const canvas = $("#scratchCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
let scratched = false;
let isDrawing = false;

const sizeCanvas = () => {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (scratched) {
    ctx.clearRect(0, 0, rect.width, rect.height);
    return;
  }
  paintScratchLayer(rect.width, rect.height);
};

const paintScratchLayer = (width, height) => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f7dda0");
  gradient.addColorStop(0.45, "#b77d2a");
  gradient.addColorStop(0.7, "#fff0c4");
  gradient.addColorStop(1, "#a87327");
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(45, 36, 32, 0.78)";
  ctx.font = "600 14px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Scratch here", width / 2, height / 2 + 5);
};

const getPoint = (event) => {
  const rect = canvas.getBoundingClientRect();
  const touch = event.touches?.[0] || event;
  return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
};

const scratch = (event) => {
  if (!isDrawing) return;
  event.preventDefault();
  const point = getPoint(event);
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(point.x, point.y, 22, 0, Math.PI * 2);
  ctx.fill();
  checkScratchProgress();
};

const checkScratchProgress = () => {
  if (scratched) return;
  const { width, height } = canvas;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  let transparent = 0;
  for (let index = 3; index < pixels.length; index += 16) {
    if (pixels[index] < 80) transparent += 1;
  }
  if (transparent / (pixels.length / 16) > 0.42) {
    scratched = true;
    ctx.clearRect(0, 0, width, height);
    popPetals();
  }
};

["mousedown", "touchstart"].forEach((type) => {
  canvas.addEventListener(type, (event) => {
    isDrawing = true;
    scratch(event);
  });
});

["mousemove", "touchmove"].forEach((type) => canvas.addEventListener(type, scratch, { passive: false }));
["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((type) => {
  canvas.addEventListener(type, () => {
    isDrawing = false;
  });
});

const popPetals = () => {
  const layer = $("#petalLayer");
  for (let index = 0; index < 34; index += 1) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.style.left = `${42 + Math.random() * 16}%`;
    petal.style.top = `${42 + Math.random() * 10}%`;
    petal.style.setProperty("--x", `${(Math.random() - 0.5) * 330}px`);
    petal.style.setProperty("--y", `${-80 - Math.random() * 220}px`);
    petal.style.setProperty("--r", `${Math.random() * 520 - 260}deg`);
    petal.style.animationDelay = `${Math.random() * 0.2}s`;
    layer.appendChild(petal);
    window.setTimeout(() => petal.remove(), 2200);
  }
};

window.addEventListener("resize", sizeCanvas);
sizeCanvas();
