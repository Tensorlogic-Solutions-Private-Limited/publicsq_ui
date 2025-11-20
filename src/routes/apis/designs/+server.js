import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";
import { getHeaders } from "$lib/utils/helper.js";

export async function GET({ url, cookies, fetch: eventFetch }) {
  try {
    // Get authentication headers
    const authHeader = getHeaders(cookies);

    // Extract query parameters
    const page = url.searchParams.get('page') || '1';
    const status = url.searchParams.get('status') || 'draft';
    const limit = url.searchParams.get('limit') || '20';
    const pageSize = url.searchParams.get('page_size') || '20';
    const exam_name = url.searchParams.get('exam_name');

    // Build API URL with query parameters
    let endpoint = `${PUBLIC_API_BASE_URL}/v1/designs`;
    const params = new URLSearchParams();

    // Add query parameters
    params.append('page', page);
    params.append('page_size', pageSize);
    params.append('limit', limit);
    params.append('status', status);

    if (exam_name && exam_name.trim()) {
      params.append('exam_name', exam_name.trim());
    }

    // Append query string to endpoint
    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }

    const response = await eventFetch(endpoint, {
      method: 'GET',
      headers: authHeader,
    });

    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => null);
      console.error(`API error ${response.status}: ${errorText}`);

      return json({
        error: `Failed to fetch designs: ${response.status}`,
        details: errorText,
        data: [],
        total: 0,
        page: parseInt(page)
      }, { status: response.status });
    }

    // Return the API response directly since it matches our structure
    const data = await response.json();
    return json(data);

  } catch (err) {
    console.error('Error in designs API endpoint:', err);

    return json({
      error: err.message || 'Internal server error',
      data: [],
      total: 0,
      page: 1
    }, { status: 500 });
  }
}

export async function POST({ request, cookies, fetch: eventFetch }) {
  let res;
  try {
    // Get the request body
    const requestData = await request.json();

    // Get auth headers from helper
    const authHeader = getHeaders(cookies);

    // Endpoint for creating a design
    const endpoint = `${PUBLIC_API_BASE_URL}/v1/designs`;

    // Make the API request
    res = await eventFetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify(requestData),
    });

    res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 201) {
      let exams = await res.json();
      return json(exams.data, res.status);
    }

    return new Response(res.body, { status: res.status });
  } catch (err) {
    console.error("Error in create design endpoint:", err);
    return json(
      {
        error: err.message || "An unexpected error occurred",
        details: err.stack,
      },
      { status: 500 }
    );
  }
}
