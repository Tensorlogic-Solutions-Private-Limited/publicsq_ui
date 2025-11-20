import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function GET({ params, cookies, request }) {
  const authToken = cookies.get("access_token");
  let response;
  try {
    let queryparams = request.url.split("?");
    let endPoint = `${PUBLIC_API_BASE_URL}/v1/schools/codes`;
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
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        (typeof errorData?.detail === "string"
          ? errorData.detail
          : "Failed to fetch udise codes");
      return json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return json(data, { status: response?.status });
  } catch (error) {
    console.error("Error fetching udise codes:", error);
    return json({ error: error.message }, { status: response?.status});
  }
}
