export const load = async ({ params, fetch, depends }) => {
  const { exam_code } = params;

  // Mark this load function with a dependency key for targeted invalidation
  depends('exam:details');

  try {
    const response = await fetch(`/apis/v2/exams/${exam_code}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        examDetails: null,
        error: error.error || "Failed to fetch exam details",
      };
    }

    const examDetailsResp = await response.json();
    examDetailsResp.designs = examDetailsResp?.designs?.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    return {
      examDetails: examDetailsResp,
      error: null,
    };
  } catch (error) {
    console.error("Error loading exam details:", error);
    return {
      examDetails: null,
      error: "An unexpected error occurred while loading exam details",
    };
  }
};
