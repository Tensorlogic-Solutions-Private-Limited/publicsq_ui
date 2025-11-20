import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";
import { getHeaders } from "$lib/utils/helper.js";

/**
 * GET handler to retrieve a specific user by UUID
 */
export async function GET({ params, cookies, fetch: eventFetch }) {
  try {
    // Get authentication headers
    const authHeader = getHeaders(cookies);

    // Extract the user UUID from path parameters
    const userUuid = params.id; // Note: params.id contains the UUID from the URL

    if (!userUuid) {
      return json(
        { error: "User UUID is required" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build API URL for getting a specific user - updated to use user_uuid
    const endpoint = `${PUBLIC_API_BASE_URL}/v1/users/${userUuid}`;

    const response = await eventFetch(endpoint, {
      method: "GET",
      headers: authHeader,
    });

    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => null);
      console.error(`API error ${response.status}: ${errorText}`);

      // Map common error codes to appropriate messages
      let errorMessage = "Failed to fetch user details";
      let status = response.status;

      if (status === 403) {
        errorMessage = "You do not have permission to view this user";
      } else if (status === 404) {
        errorMessage = "User not found";
      }

      return json(
        {
          error: errorMessage,
          details: errorText,
        },
        {
          status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process successful response
    const data = await response.json();

    // If organization uuid is present, store in cookies as orgId
    if (data?.organization?.uuid) {
      cookies.set("orgId", data.organization.uuid, {
        httpOnly: true,
        sameSite: "strict",
        // secure: process.env.NODE_ENV === "production",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    // If block uuid is present, store in cookies as blockId
    if (data?.block?.uuid) {
      cookies.set("blockId", data.block.uuid, {
        httpOnly: true,
        sameSite: "strict",
        // secure: process.env.NODE_ENV === "production",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    if (data?.block?.block_name) {
      cookies.set("blockName", data.block.block_name, {
        httpOnly: true,
        sameSite: "strict",
        // secure: process.env.NODE_ENV === "production",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    if (data?.organization?.org_name) {
      cookies.set("orgName", data.organization.org_name, {
        httpOnly: true,
        sameSite: "strict",
        // secure: process.env.NODE_ENV === "production",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    // Return the user data
    return json(data);
  } catch (err) {
    console.error("Error in get user API endpoint:", err);

    return json(
      {
        error: err.message || "Internal server error",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
