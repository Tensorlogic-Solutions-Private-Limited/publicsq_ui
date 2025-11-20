export async function load({ fetch }) {
	// this load fn is required to pass all page requests through hooks.server.js,
	//which handles the route protection for RBAC 
	return {
	
	};
}
