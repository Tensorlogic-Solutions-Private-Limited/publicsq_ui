import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function POST({ request, cookies }) {
  const authToken = cookies.get("access_token");
  try {
    const payload = await request.json();

    const response = await fetch(`${PUBLIC_API_BASE_URL}/v1/schools`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message ||
        (typeof errorData?.detail === "string"
          ? errorData.detail
          : "Failed to add school.");
      return json({ error: errorMessage }, { status: response.status });
    }

    const result = await response.json();
    return json(result, { status: response?.status });
  } catch (error) {
    console.error("Error creating school:", error);
    return json({ error: "Failed to add school." }, { status: 500 });
  }
}

export async function GET({ params, cookies, request }) {
  const authToken = cookies.get("access_token");
  let response;
  try {
    let queryparams = request.url.split("?");
    let endPoint = `${PUBLIC_API_BASE_URL}/v1/schools`;
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
      console.log("response of schools GET", response);
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        (typeof errorData?.detail === "string"
          ? errorData.detail
          : "Failed to fetch schools");
      return json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return json(data, { status: response?.status });
  } catch (error) {
    console.error("Error fetching schools:", error);
    return json({ error: error.message }, { status: 500 });
  }
}
