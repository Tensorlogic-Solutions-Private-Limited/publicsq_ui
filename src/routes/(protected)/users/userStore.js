import { writable } from "svelte/store";



const initialValue  = { 
    visible : false, 
    type : 'success', 
    message : '', 
    action : null, // holds the object 
}

// store holds the single object 

export const userNotification = writable(initialValue) ; 

// Helper function 
export function showUserNotification(type, message, action = null ) { 
    userNotification.set({
        visible : true, 
        type, 
        message,
        action
    }) ;
}

// helper function to hide notif 
export function hideUserNotification() {
    userNotification.update(n => ({ ...n, visible: false }));
}