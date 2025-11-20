import { redirect } from '@sveltejs/kit';
import { roles } from '$lib/config.js'; // Import roles object
import { normalizeRoute } from '$lib/utils/helper.js'; // Import route normalizer

export async function handle({ event, resolve }) {
  const token = event.cookies.get("access_token");
  const username = event.cookies.get("username");
  const userId = event.cookies.get("user_id");
  const roleName = event.cookies.get("role_name");
  const roleCode = event.cookies.get("role_code");
  const orgId = event.cookies.get("orgId");
  const blockId = event.cookies.get("blockId");
  const blockName = event.cookies.get("blockName");
  const orgName = event.cookies.get("orgName");

  let sessionData = {
    isAuthenticated: token ? true : false,
    token,
    username,
    userId,
    roleName,
    roleCode,
    orgId,
    blockId,
    blockName,
    orgName,
  };
  event.locals.sessionData = sessionData;

  if (!sessionData?.isAuthenticated) {
    // User is NOT authenticated
    if (!event.url.pathname.startsWith("/apis") && event.url.pathname !== "/") {
      // Redirect to the login page if not authenticated and trying to access protected route
      const fromUrl = `${event.url.pathname}${event.url.search}`;
      console.log("Redirecting to login from:", fromUrl);
      throw redirect(302, `/?redirectTo=${fromUrl}`);
    }
    // If user is not authenticated and visits "/", let them stay (show login page)
  } else {
    // Normalize the current route for RBAC
    const normalizedRoute = await normalizeRoute(event.url.pathname);

    // Check if the user role is restricted from accessing the route
    if (!event.url.pathname.startsWith("/apis") &&roleCode && roles[roleCode]?.restrictedRoutes?.includes(normalizedRoute)) {
      console.log(
        `Access denied for role "${roleCode}" to route "${normalizedRoute}"`
      );
      throw redirect(302, "/unauthorized"); // Redirect to an unauthorized page
    }
    // User IS authenticated
    if (
      event.url.pathname === "/" &&
      !event.url.searchParams.has("redirectTo")
    ) {
      // Redirect authenticated user from login page to home only if no redirectTo param
      throw redirect(302, "/home");
    }
  }

  const response = await resolve(event);
  return response;
}
