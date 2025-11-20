import { writable } from "svelte/store";

// { type: 'success' | 'error', message: string, callbackFn?: () => void }
export const notificationStore = writable({
  type: "",
  message: "",
  callbackFn: null,
});

export function showNotification({ type, message, callbackFn = null }) {
  notificationStore.set({ type, message, callbackFn });
}

export function clearNotification() {
  notificationStore.set({ type: "", message: "", callbackFn: null });
}
