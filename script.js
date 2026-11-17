(() => {
  const carousel = document.querySelector("[data-carousel]");
  const track = carousel?.querySelector(".slides");

  if (!carousel || !track) {
    return;
  }

  const cards = Array.from(track.querySelectorAll(".course-card"));

  if (!cards.length) {
    return;
  }

  const previousButton = carousel.querySelector("[data-carousel-previous]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const dots = Array.from(carousel.querySelectorAll("[data-carousel-to]"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cloneCount = Math.min(3, cards.length);
  const cloneCard = (card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    return clone;
  };
  const previousClones = cards.slice(-cloneCount).map(cloneCard);
  const nextClones = cards.slice(0, cloneCount).map(cloneCard);

  track.prepend(...previousClones);
  track.append(...nextClones);

  let activeIndex = 0;
  let trackIndex = cloneCount;
  let resetPosition = null;
  let timer;
  let hovering = false;
  let focused = false;
  let inView = true;

  function getStep() {
    const first = track.children[0].getBoundingClientRect();
    const second = track.children[1].getBoundingClientRect();
    return second.left - first.left;
  }

  function setActiveIndex(index) {
    activeIndex = (index + cards.length) % cards.length;
    dots.forEach((dot, dotIndex) => {
      if (dotIndex === activeIndex) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function moveTo(position, index, resetTo = null) {
    trackIndex = position;
    resetPosition = resetTo;
    setActiveIndex(index);
    track.style.transform = `translateX(${-getStep() * trackIndex}px)`;
  }

  function showNext() {
    if (activeIndex === cards.length - 1) {
      moveTo(cloneCount + cards.length, 0, cloneCount);
      return;
    }

    const nextIndex = activeIndex + 1;
    moveTo(cloneCount + nextIndex, nextIndex);
  }

  function showPrevious() {
    if (activeIndex === 0) {
      moveTo(cloneCount - 1, cards.length - 1, cloneCount + cards.length - 1);
      return;
    }

    const previousIndex = activeIndex - 1;
    moveTo(cloneCount + previousIndex, previousIndex);
  }

  function showSelected(index) {
    if (index === activeIndex) {
      return;
    }

    moveTo(cloneCount + index, index);
  }

  function scheduleRotation() {
    window.clearInterval(timer);

    if (!reducedMotion.matches && !hovering && !focused && inView && !document.hidden) {
      timer = window.setInterval(showNext, 4000);
    }
  }

  track.addEventListener("transitionend", (event) => {
    if (event.target !== track || resetPosition === null) {
      return;
    }

    track.style.transition = "none";
    trackIndex = resetPosition;
    resetPosition = null;
    track.style.transform = `translateX(${-getStep() * trackIndex}px)`;
    track.offsetHeight;
    track.style.transition = "";
  });

  previousButton?.addEventListener("click", () => {
    showPrevious();
    scheduleRotation();
  });
  nextButton?.addEventListener("click", () => {
    showNext();
    scheduleRotation();
  });
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      showSelected(Number(dot.dataset.carouselTo));
      scheduleRotation();
    });
  });

  carousel.addEventListener("mouseenter", () => {
    hovering = true;
    scheduleRotation();
  });

  carousel.addEventListener("mouseleave", () => {
    hovering = false;
    scheduleRotation();
  });

  carousel.addEventListener("focusin", () => {
    focused = true;
    scheduleRotation();
  });

  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) {
      focused = false;
      scheduleRotation();
    }
  });

  window.addEventListener("resize", () => {
    resetPosition = null;
    trackIndex = cloneCount + activeIndex;
    track.style.transition = "none";
    track.style.transform = `translateX(${-getStep() * trackIndex}px)`;
    track.offsetHeight;
    track.style.transition = "";
  });

  document.addEventListener("visibilitychange", scheduleRotation);
  reducedMotion.addEventListener("change", scheduleRotation);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      scheduleRotation();
    }, { threshold: 0.15 });

    observer.observe(carousel);
  }

  setActiveIndex(0);
  track.style.transform = `translateX(${-getStep() * trackIndex}px)`;
  scheduleRotation();
})();
