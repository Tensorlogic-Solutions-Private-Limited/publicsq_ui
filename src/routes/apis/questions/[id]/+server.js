
import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function GET({ params, cookies }) {
  const authToken = cookies.get("access_token");
  const questionId = params.id;

  try {
    const response = await fetch(`${PUBLIC_API_BASE_URL}/v1/questions/${questionId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
     if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || 
        (typeof errorData?.detail === 'string' ? errorData.detail : "Failed to fetch question details.");
      return json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const result = await response.json();
    return json(result, { status: response?.status });
  } catch (error) {
    console.error("Error fetching question details:", error);
    return json(
      { error: "Failed to fetch question details" },
      { status: 500 }
    );
  }
}

export async function DELETE({ params, cookies }) {
  const authToken = cookies.get("access_token");
  const questionId = params.id;

  try {
    const response = await fetch(`${PUBLIC_API_BASE_URL}/v1/questions/${questionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || 
        (typeof errorData?.detail === 'string' ? errorData.detail : "Failed to delete question.");
      return json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    return json({ message: "Question deleted successfully" }, { status: response?.status });
  } catch (error) {
    console.error("Error deleting question:", error);
    return json(
      { error: "Failed to delete question." },
      { status: 500 }
    );
  }
}



