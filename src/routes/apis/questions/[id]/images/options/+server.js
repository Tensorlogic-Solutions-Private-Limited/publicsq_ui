import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function DELETE(event) {
  const { params, cookies, request, url } = event;
  const authToken = cookies.get("access_token");
  const questionId = params.id;

  let response;
  let endpoint =
    PUBLIC_API_BASE_URL + `/v1/questions/${questionId}/images/options`;

  try {
    let body = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    // parse event.url (URL instance) to extract 'option' and move it to path
    const reqUrl = url;
    const optionParam = reqUrl.searchParams.get("option");

    if (optionParam) {
      reqUrl.searchParams.delete("option");
      endpoint += `/${encodeURIComponent(optionParam)}`;

      const remaining = reqUrl.searchParams.toString();
      if (remaining) {
        endpoint += `?${remaining}`;
      }
    }

    const fetchOptions = {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    };

    if (body !== null) {
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(body);
    }

    response = await fetch(endpoint, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        (typeof errorData?.detail === "string"
          ? errorData.detail
          : "Failed to delete option image.");
      return json({ error: errorMessage }, { status: response.status });
    }

    return json(
      { message: "Successfully deleted option image." },
      { status: response.status }
    );
  } catch (error) {
    console.error("Error deleting option image:", error);
    return json(
      { error: "Failed to delete option image." },
      { status: response?.status || 500 }
    );
  }
}

