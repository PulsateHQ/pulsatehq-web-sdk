declare global {
  interface Window {
    PulsateSDK: any;
  }
}

import PulsateSDKModel from "./PulsateSDK.js";
import { setApiUrl } from "./apiUrl.js";
import "./styles/preview.css";

(function (p) {
  // Supplied at build time so the stage and production bundles can target
  // different middleware hosts. Falls back to production when unset.
  setApiUrl(import.meta.env.VITE_API_URL);

  var Pulsate = new PulsateSDKModel(p.PulsateSDK.q);
  p.PulsateSDK.init = Pulsate.addUser;
  p.PulsateSDK.addUser = Pulsate.addUser;
  p.PulsateSDK.endSession = Pulsate.endSession;
  p.PulsateSDK.showFeed = Pulsate.showFeed;
  p.PulsateSDK.getUnreadCount = Pulsate.getUnreadCount;
  p.PulsateSDK.saveEvent = Pulsate.saveEvent;
  p.PulsateSDK.setErrorHandler = Pulsate.setErrorHandler;
  p.PulsateSDK.getInappNotification = Pulsate.getInappNotification;
})(window);
