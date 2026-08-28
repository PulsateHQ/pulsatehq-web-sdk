import { UTCTimestamp } from "./types/lib.js";

export function isInViewport(el: Element) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function getTimestampInSeconds(): UTCTimestamp {
  return Math.floor(Date.now() / 1000).toString();
}

export function timeSince(timeStamp: Date) {
  const now = new Date();
  const secondsPast = (now.getTime() - timeStamp.getTime()) / 1000;
  if (secondsPast < 60) return Math.floor(secondsPast) + " sec ago";
  if (secondsPast < 3600) return Math.floor(secondsPast / 60) + " min ago";
  if (secondsPast < 86400) return Math.floor(secondsPast / 3600) + " hours ago";
  return Math.floor(secondsPast / 86400) + " days ago";
}
