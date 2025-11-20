import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function DELETE({ params, cookies, request }) {
  const authToken = cookies.get("access_token");
  const questionId = params.id;
  let response

  try {
    const body = await request?.json();

     response = await fetch(
      `${PUBLIC_API_BASE_URL}/v1/questions/${questionId}/images`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message ||
        (typeof errorData?.detail === "string"
          ? errorData.detail
          : "Failed to delete question image.");
      return json({ error: errorMessage }, { status: response.status });
    }

    return json(
      { message: "Successfully deleted question image." },
      { status: response?.status }
    );
  } catch (error) {
    console.error("Error deleting question image:", error);
    return json({ error: "Failed to delete question image." }, { status: response?.status || 500 });
  }
}



