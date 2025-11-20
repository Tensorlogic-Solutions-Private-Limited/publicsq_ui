import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";
import { getHeaders } from "$lib/utils/helper.js";

export async function POST({ params, request, cookies, fetch: eventFetch }) {
  let res;
  try {
    const exam_code = params.exam_code;

    const requestData = await request.json();

    // Get auth headers from helper
    const authHeader = getHeaders(cookies);

    // Endpoint for creating a design
    const endpoint = `${PUBLIC_API_BASE_URL}/v2/exams/${exam_code}/designs`;

    
    // Make the API request
    res = await eventFetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify(requestData),
    });
    
   

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
