import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";
import { getHeaders } from "$lib/utils/helper.js";

export async function GET({ params, request, cookies }) {
  let res;
  try {
    const authHeader = getHeaders(cookies);

    let endpoint = PUBLIC_API_BASE_URL + "/v1/exams";

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
      let qpapers = await res.json();
      return json(qpapers.exams);
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.log(err);
    return new Response(undefined, { status: 500 });
  }
}

export async function POST({ params, request, cookies, fetch }) {
  try {
    const body = await request.json();
    const authHeader = getHeaders(cookies);

    const endpoint = PUBLIC_API_BASE_URL + "/v1/exams";

    const options = {
      method: "POST",
      headers: { ...authHeader },
      body: JSON.stringify(body),
    };

    // Use eventFetch instead of fetch
    const res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 201) {
      let examData = await res.json();
      return json(examData.data, res.status);
    }

    return new Response(res.body, { status: res.status });
  } catch (err) {
    // Always return a Response in case of errors
    console.log("err".err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
