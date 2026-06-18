export function requestBrowserNotificationPermission() {
  if (typeof Notification === "undefined") {
    return
  }

  void Notification.requestPermission()
}
