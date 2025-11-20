import { error } from "@sveltejs/kit";

export async function load({ params, fetch }) {
  try {
    const { exam_code } = params;

    // Fetch exam details
    const response = await fetch(`/apis/v2/exams/${exam_code}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw error(404, "Exam not found");
      }
      throw error(response.status, "Failed to load exam");
    }

    const examDetails = await response.json();

    return {
      examDetails,
      status: examDetails.status,
    };
  } catch (err) {
    console.error("Error loading exam attempt page:", err);
    throw error(500, err.message || "Failed to load exam");
  }
}
