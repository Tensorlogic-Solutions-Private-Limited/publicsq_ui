import { writable } from "svelte/store";

// export const message = writable('') ; 
// export const msgType = writable('') ; 
// export const showAddAdminBtn = writable(false) ; 
// export const addAdminBtnText=writable('') ; 

const initialValue = { 
    visible : false, 
    type : 'success', 
    message : '', 
    action : null, 

}

// store 
export const organizationNotification = writable(initialValue) ; 

// helper function 
export function showOrganizationNotification(type, message, action = null ) { 
    organizationNotification.set({
        visible : true, 
        type,
        message, 
        action,
    }) ;
}
export function hideOrganizationNotification(){
    organizationNotification.set(initialValue) ;
}
