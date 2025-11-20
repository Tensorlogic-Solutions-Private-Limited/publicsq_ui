import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";
import { getHeaders } from "$lib/utils/helper.js";

export async function DELETE({ params, request, cookies, fetch }) {
  try {
    const { id, qp_code, ques_code } = params;
    const authHeader = getHeaders(cookies);

    const endpoint = `${PUBLIC_API_BASE_URL}/v1/exams/${id}/qn_papers/${qp_code}/questions/${ques_code}`;
    
    const options = {
      method: "DELETE",
      headers: { ...authHeader },
    };

    // Use eventFetch instead of fetch
    const res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 200) {
      
      let deleteResp = await res.json();
      return json(deleteResp, res.status);
    }

    return new Response(res.body, { status: res.status });
  } catch (err) {
    // Always return a Response in case of errors
    console.log("err", err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
