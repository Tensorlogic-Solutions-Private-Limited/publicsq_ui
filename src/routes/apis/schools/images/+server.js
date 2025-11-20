import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function POST({ request, cookies }) {
  const authToken = cookies.get("access_token");
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Forward the request to the main API
    const response = await fetch(`${PUBLIC_API_BASE_URL}/v1/schools/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      // Pass the form data directly
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message ||
        (typeof errorData?.detail === "string"
          ? errorData.detail
          : "Failed to upload school images.");
      return json({ error: errorMessage }, { status: response.status });
    }

    const result = await response.json();
    return json(result, { status: response?.status });
  } catch (error) {
    console.error("Error uploading school images:", error);
    return json({ error: "Failed to upload school images." }, { status: 500 });
  }
}