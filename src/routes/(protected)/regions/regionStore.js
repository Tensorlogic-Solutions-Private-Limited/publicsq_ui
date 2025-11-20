import { writable } from 'svelte/store';

export const message = writable('')
export const msgType=writable('')
export const showAddAdminBtn=writable(false)
export const addAdminBtnText=writable('')
export const addAdminBtnQueryParams = writable('')