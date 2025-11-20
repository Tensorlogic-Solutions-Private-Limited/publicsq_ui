import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";
import { getHeaders } from "$lib/utils/helper.js";

export async function DELETE({ params, cookies, fetch: eventFetch }) {
  try {
    const design_code = params.design_code;
    
    if (!design_code) {
      return json(
        { error: "Design code is required" },
        { status: 400 }
      );
    }

    const authHeader = getHeaders(cookies);
    const endpoint = `${PUBLIC_API_BASE_URL}/v1/designs/${design_code}`;

    const response = await eventFetch(endpoint, {
      method: "DELETE",
      headers: authHeader,
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || 
        (typeof errorData?.detail === 'string' ? errorData.detail : "Failed to delete design.");
      return json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Handle 204 No Content response properly
    if (response.status === 204) {
      return new Response(null, { status: 204 });
    }

    const result = await response.json();
    return json(result, { status: response.status });
    
  } catch (error) {
    console.error("Error deleting design:", error);
    return json(
      { error: "Failed to delete design." },
      { status: 500 }
    );
  }
}
