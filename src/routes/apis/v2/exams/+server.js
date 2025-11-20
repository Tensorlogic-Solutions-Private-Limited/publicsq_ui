
import { json } from "@sveltejs/kit";
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";


export async function POST({ request, cookies, fetch: eventFetch }) {
  let res;
  try {
    // Get the request body
    const requestData = await request.json();

    // Get auth headers from helper
    const authHeader = getHeaders(cookies);

    const endpoint = `${PUBLIC_API_BASE_URL}/v2/exams`;

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
      let exam = await res.json();
      return json(exam, res.status);
    }

    return new Response(res.body, { status: res.status });
  } catch (err) {
    console.error("Error in exam creation:", err);
    return json(
      {
        error: err.message || "An unexpected error occurred",
        details: err.stack,
      },
      { status: 500 }
    );
  }
}

export async function GET({ params, request, cookies, fetch: eventFetch }) {
  let res;
  try {

    // changed part 
    const authHeader = getHeaders(cookies);
    
    let endpoint = PUBLIC_API_BASE_URL + "/v2/exams";

    let queryparams = request.url.split("?");

    if (queryparams?.length > 1) {
      endpoint += "?" + queryparams[1];
    }
    const options = {
      method: "GET",
      headers: { ...authHeader },
    };

    res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 200) {
      let exams = await res.json();
      return json(exams, res.status);
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.log(err);
    return new Response(undefined, { status: 500 });
  }
}
