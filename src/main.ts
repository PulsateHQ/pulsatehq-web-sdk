declare global {
  interface Window {
    PulsateSDK: any;
  }
}

import PulsateSDKModel from "./PulsateSDK";
import "./styles/preview.css";

(function (p) {
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
