import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function GET({ params, cookies }) {
  const authToken = cookies.get("access_token");
  const schoolId = params.id;

  try {
    const response = await fetch(
      `${PUBLIC_API_BASE_URL}/v1/schools/${schoolId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return json(
        { error: errorData.message || "Failed to fetch school details" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return json(result, { status: response?.status });
  } catch (error) {
    console.error("Error fetching school details:", error);
    return json(
      { error: "Internal server error while fetching school details" },
      { status: 500 }
    );
  }
}

export async function DELETE({ params, cookies }) {
  const authToken = cookies.get("access_token");
  const schoolId = params.id;

  try {
    const response = await fetch(
      `${PUBLIC_API_BASE_URL}/v1/schools/${schoolId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message ||
        (typeof errorData?.detail === "string"
          ? errorData.detail
          : "Failed to delete school.");
      return json({ error: errorMessage }, { status: response.status });
    }

    return json(
      { message: "School deleted successfully" },
      { status: response?.status }
    );
  } catch (error) {
    console.error("Error deleting school:", error);
    return json(
      { error: "Failed to delete school." },
      { status: 500 }
    );
  }
}

export async function PUT({ params, cookies, request }) {
  const authToken = cookies.get("access_token");
  const schoolId = params.id;

  try {
    const data = await request.json();

    const response = await fetch(
      `${PUBLIC_API_BASE_URL}/v1/schools/${schoolId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      }
    );

  if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message ||
        (typeof errorData?.detail === "string"
          ? errorData.detail
          : "Failed to update school.");
      return json({ error: errorMessage }, { status: response.status });
    }

    const result = await response.json();
    return json(result, { status: response?.status });
  } catch (error) {
    console.error("Error updating school:", error);
    return json(
      { error: "Failed to update school." },
      { status: 500 }
    );
  }
}
