const root = document.documentElement;

const reducedMotionQuery = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

const revealElements = Array.from(
  document.querySelectorAll<HTMLElement>("[data-reveal]"),
);

if (revealElements.length > 0) {
  root.classList.add("has-reveal-js");
}

const revealAll = () => {
  revealElements.forEach((element) => {
    element.classList.add("is-revealed");
  });
};

if (
  reducedMotionQuery.matches ||
  !("IntersectionObserver" in window)
) {
  revealAll();
} else {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const element = entry.target;

        if (!(element instanceof HTMLElement)) {
          return;
        }

        element.classList.add("is-revealed");
        currentObserver.unobserve(element);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  // waiting 2 frames
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        revealElements.forEach((element) => {
          observer.observe(element);
        });
      }, 100);
    });
  });
}