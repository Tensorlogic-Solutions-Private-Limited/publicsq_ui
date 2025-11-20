import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function GET({ params, cookies, request }) {
  const authToken = cookies.get("access_token");
  let response;
  try {
    let queryparams = request.url.split("?");
    let endPoint = `${PUBLIC_API_BASE_URL}/v1/jobs`;
    if (queryparams?.length > 1) {
      endPoint += "?" + queryparams[1];
    }
    response = await fetch(endPoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch job status");
    }

    const data = await response.json();
    return json(data, { status: response?.status });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return json({ error: error.message }, { status: response?.status });
  }
}
