import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";
import { getHeaders } from "$lib/utils/helper.js";

export async function POST({ params, request, cookies, fetch }) {
  try {
    const authToken = cookies.get("access_token");
    const { design_code, paper_code } = params;

   
    const contentType = request.headers.get("content-type") || "";

    let response;

        // const options = {
    //   method: "POST",
    //   headers: { ...authHeader },
    //   body: JSON.stringify(body),
    // };

    // // Use eventFetch instead of fetch
    // const res = await fetch(endpoint, options);

    // if (!res.ok) {
    //   return res;
    // }
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      response = await fetch(`${PUBLIC_API_BASE_URL}/v1/designs/${design_code}/qn_papers/${paper_code}/images/question`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });
    } else {
      // JSON
      const payload = await request.json();

      response = await fetch(`${PUBLIC_API_BASE_URL}/v1/designs/${design_code}/qn_papers/${paper_code}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
    }

    // if (res.status == 201) {
    //   let examData = await res.json();
    //   return json(examData.data, res.status);
    // }

    if (!response.ok) {
      let errorMessage = "Failed to add question.";
      try {
        const errorData = await response.json();
        console.log("errorData", errorData);
        errorMessage =
          errorData.message ||
          (typeof errorData?.detail === "string"
            ? errorData.detail
            : errorMessage);
      } catch {}
      return json({ error: errorMessage }, { status: response.status });
    }

    const result = await response.json();
    return json(result);
  } catch (err) {
    // Always return a Response in case of errors
    console.log("err of image based qn  in SERVER JS", err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
