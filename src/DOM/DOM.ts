export function attachStylesheet() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `${import.meta.env.VITE_API_URL}/web-sdk.css`;
  document.head.appendChild(link);
}

function createModal(content: string) {
  const modal = document.createElement("div");
  modal.classList.add("pws-modal");

  modal.innerHTML = content;

  const closeButton = document.createElement("button");
  closeButton.classList.add("pws-close", "pws-close-modal", "pws-dismiss");

  modal.appendChild(closeButton);

  modal.addEventListener("click", (e) => {
    if ((e.target as Element)?.classList.contains("pws-close-modal")) {
      setTimeout(() => clearModal(), 0);
    }
  });

  return modal;
}

function appendModal(modal: HTMLDivElement) {
  const backdrop = document.createElement("div");
  backdrop.classList.add("pws-backdrop");
  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
}

function clearModal() {
  const modal = document.querySelector(".pws-modal");
  const backdrop = document.querySelector(".pws-backdrop");
  if (modal) {
    document.body.removeChild(modal);
  }
  if (backdrop) {
    document.body.removeChild(backdrop);
  }
}

function attachFeed(feed: HTMLDivElement, cID?: string) {
  if (cID) {
    const container = document.getElementById(cID);
    if (container) {
      container.appendChild(feed);
    } else {
      document.body.appendChild(feed);
    }
  } else {
    document.body.appendChild(feed);
  }
}

function createFeed(items: string, cID?: string, classNames?: string[]) {
  const feed = document.createElement("div");
  if (classNames) {
    feed.classList.add(...classNames);
  }

  feed.innerHTML = items;

  attachFeed(feed, cID);
}

function createFeedBack(items: string, cID?: string, classNames?: string[]) {
  const feed = document.createElement("div");

  if (classNames) {
    feed.classList.add(...classNames);
  }

  feed.innerHTML = items;
  attachFeed(feed, cID);

  const back = document.querySelector(".pws-arrow-back");
  back?.addEventListener("click", () => {
    removeFeedBack();
    showFeed();
  });
}

function showFeed() {
  const feed = document.querySelector(".pws-hidden");
  if (feed) {
    feed.classList.remove("pws-hidden");
  }
}

function hideFeed() {
  const feed = document.querySelector(".pws-feed");
  if (feed) {
    feed.classList.add("pws-hidden");
  }
}

function removeFeedBack() {
  const feed = document.querySelector(".pws-feedpost-back");
  if (feed?.parentElement) {
    feed.parentElement.remove();
  }
}

export {
  createModal,
  createFeed,
  showFeed,
  hideFeed,
  createFeedBack,
  removeFeedBack,
  appendModal,
};
