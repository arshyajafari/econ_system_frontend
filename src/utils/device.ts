const DEVICE_ID_KEY = "econ_device_id";

export function getDeviceId(): string {
  const existingDeviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const deviceId = crypto.randomUUID();

  localStorage.setItem(DEVICE_ID_KEY, deviceId);

  return deviceId;
}
