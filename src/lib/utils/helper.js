import { browser } from "$app/environment";
import { goto } from "$app/navigation";

// Create a question object from API result and payload (for dynamic qn addition )
export function createQuestionFromSubmission(result, payload) {
  const options = ["A", "B", "C", "D"].map((id, idx) => ({
    id,
    text: payload[`option${idx + 1}`] ?? "",
    is_correct: payload.correct_answer === id,
    

  }));

  const isImagebasedQn =
    result?.question?.qmt_question_text_media ||
    result?.question?.qmt_option1_media ||
    result?.question?.qmt_option2_media ||
    result?.question?.qmt_option3_media ||
    result?.question?.qmt_option4_media;

  const base = {
    id: result.question_code,
    q_code: result.question_code,
    text: payload.question_text ?? "",
    options,
    correct_answer: payload.correct_answer,
    design_code:result.exam_code,
    paper_code:result.paper_code,
  };

  if (isImagebasedQn) {
    if (result.question.qmt_question_text_media)
      base.qmt_question_text_media = result.question.qmt_question_text_media;
    if (result.question.qmt_option1_media)
      base.qmt_option1_media = result.question.qmt_option1_media;
    if (result.question.qmt_option2_media)
      base.qmt_option2_media = result.question.qmt_option2_media;
    if (result.question.qmt_option3_media)
      base.qmt_option3_media = result.question.qmt_option3_media;
    if (result.question.qmt_option4_media)
      base.qmt_option4_media = result.question.qmt_option4_media;
  }
  return { ...base };
}
// UTILITY TO GET HEADERS
export function getHeaders(cookies, contentType = "application/json") {
  const authToken = cookies.get("access_token");
  if (authToken) {
    const headers = {
      "Content-Type": contentType,
      Authorization: `Bearer ${authToken}`,
    };
    return headers;
  }
  return {};
}

// UTILITY FOR CONVERTING DATE AND TIME
export function formatDDMMYYYY(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "2-digit",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "N/A";
  }
}

// Helper: convert route pattern to regex (e.g. '/quiz/:exam_code/attempt')
export function routePatternToRegex(route) {
  // Escape regex special chars except for :param
  let regexStr = route
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:([a-zA-Z0-9_]+)/g, "[^/]+");
  return new RegExp("^" + regexStr + "$");
}

export function checkSidebarRules(rules, url) {
  // Helper: convert route pattern to regex (e.g. '/quiz/:exam_code/attempt')
  function routePatternToRegex(route) {
    let regexStr = route
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/:([a-zA-Z0-9_]+)/g, "[^/]+");
    return new RegExp("^" + regexStr + "$");
  }
  // Map rules to add regex, then check
  return rules.some((rule) => {
    const pathRegex = routePatternToRegex(rule.route);
    if (!pathRegex.test(url.pathname)) return false;
    if (rule.query) {
      return Object.entries(rule.query).every(
        ([key, val]) => url.searchParams.get(key) === val
      );
    }
    return true;
  });
}

export function buildPreviewData(qp, examdata) {
  const metadata = {
    // exam_name: qp?.exam_name || "",
    // total_questions: qp?.no_of_qns || 0,
    // total_time: qp?.total_time || 0,
    // subject: qp?.subject || "",
    // medium: qp?.medium || "",
    // exam_type: qp?.exam_type || "",
    ...examdata,
    chapters_topics: examdata.chapters_topics
      ? examdata.chapters_topics
      : examdata.chapter_topics,
  };
  const questions = (qp?.qns || []).map((q, idx) => {
    const correctOption = q.options.find((opt) => opt.is_correct);
    const isImagebasedQn =
      q.qmt_question_text_media ||
      q.qmt_option1_media ||
      q.qmt_option2_media ||
      q.qmt_option3_media ||
      q.qmt_option4_media;

    const base = {
      id: q.id,
      question_number: idx + 1,
      text: q.text,
      options: q.options,
      correct_answer: correctOption ? correctOption.id : "",
      chapter: "", // Placeholder, update if available
      topic: "", // Placeholder, update if available
      explanation: "", // Placeholder, update if available
    };

    if (isImagebasedQn) {
      if (q.qmt_question_text_media)
        base.qmt_question_text_media = q.qmt_question_text_media;
      if (q.qmt_option1_media) base.qmt_option1_media = q.qmt_option1_media;
      if (q.qmt_option2_media) base.qmt_option2_media = q.qmt_option2_media;
      if (q.qmt_option3_media) base.qmt_option3_media = q.qmt_option3_media;
      if (q.qmt_option4_media) base.qmt_option4_media = q.qmt_option4_media;
    }
    return base;
  });
  return { metadata, questions };
}

// Helper function to get subject icon
export function getSubjectIcon(subject) {
  const icons = {
    "Social Science": "🌍",
    Science: "🔬",
    Mathematics: "📐",
    English: "📚",
    Hindi: "📖",
    "Computer Science": "💻",
    Biology: "🧬",
    Physics: "⚛️",
    Chemistry: "🧪",
    History: "🏺",
    Geography: "🗺️",
    Economics: "💹",
    Accountancy: "📊",
    "Political Science": "🏛️",
    Psychology: "🧠",
    "General Knowledge": "🧠",
  };

  return icons[subject] || "📘";
}

// Helper function to get background color
export function getSubjectBgColor(subject) {
  const colors = {
    "Social Science": "bg-blue-50",
    Science: "bg-green-50",
    Mathematics: "bg-purple-50",
    English: "bg-indigo-50",
    Hindi: "bg-orange-50",
    "Computer Science": "bg-gray-50",
    Biology: "bg-emerald-50",
    Physics: "bg-cyan-50",
    Chemistry: "bg-yellow-50",
    History: "bg-amber-50",
    Geography: "bg-teal-50",
    Economics: "bg-pink-50",
    "Political Science": "bg-red-50",
  };

  return colors[subject] || "bg-gray-50";
}

// Helper function to get border color
export function getSubjectBorderColor(subject) {
  const colors = {
    "Social Science": "border-blue-200",
    Science: "border-green-200",
    Mathematics: "border-purple-200",
    English: "border-indigo-200",
    Hindi: "border-orange-200",
    "Computer Science": "border-gray-200",
    Biology: "border-emerald-200",
    Physics: "border-cyan-200",
    Chemistry: "border-yellow-200",
    History: "border-amber-200",
    Geography: "border-teal-200",
    Economics: "border-pink-200",
    "Political Science": "border-red-200",
  };

  return colors[subject] || "border-gray-200";
}

// Helper function to get text color
export function getSubjectTextColor(subject) {
  const colors = {
    "Social Science": "text-blue-700",
    Science: "text-green-700",
    Mathematics: "text-purple-700",
    English: "text-indigo-700",
    Hindi: "text-orange-700",
    "Computer Science": "text-gray-700",
    Biology: "text-emerald-700",
    Physics: "text-cyan-700",
    Chemistry: "text-yellow-700",
    History: "text-amber-700",
    Geography: "text-teal-700",
    Economics: "text-pink-700",
    "Political Science": "text-red-700",
  };

  return colors[subject] || "text-gray-700";
}

// Helper function to get selected border color
export function getSubjectSelectedBorderColor(subject) {
  const colors = {
    "Social Science": "border-blue-500",
    Science: "border-green-500",
    Mathematics: "border-purple-500",
    English: "border-indigo-500",
    Hindi: "border-orange-500",
    "Computer Science": "border-gray-500",
    Biology: "border-emerald-500",
    Physics: "border-cyan-500",
    Chemistry: "border-yellow-500",
    History: "border-amber-500",
    Geography: "border-teal-500",
    Economics: "border-pink-500",
    "Political Science": "border-red-500",
  };

  return colors[subject] || "border-gray-500";
}

export async function handleRedirection(status, url, params) {
  if (browser) {
    const fromUrl = url + params;
    switch (status) {
      case 401:
        await goto(`/?redirectTo=${fromUrl}`);
        break;
      case 403:
        // await goto(`/unauthorized?redirectTo=${fromUrl}`);
        break;
      default:
        break;
    }
  }
}

/**
 * Helper to batch API calls with Promise.all.
 * If any call returns 401/403, handleRedirection is called and the rest are not awaited.
 * Returns an array of results (null for failed/redirected calls).
 * Usage: await apiBatch([url1, url2, ...], params, url)
 */
export async function apiBatch(urls, params = "", pageUrl = "") {
  let redirected = false;
  const results = await Promise.all(
    urls.map(async (url) => {
      if (redirected) return null;
      try {
        const res = await fetch(url);
        if (!res || !res.ok) {
          if (res?.status === 401 || res?.status === 403) {
            redirected = true;
            await handleRedirection(
              res.status,
              pageUrl?.pathname || "",
              pageUrl?.search || "",
              params
            );
            return null;
          }
          return null;
        }
        return await res.json();
      } catch (err) {
        return null;
      }
    })
  );
  console.log("results", results);
  return results;
}

// Normalize dynamic routes for consistency ---- this converts uuid and AlphaNumeric IDs starting with Q like Q1234 to ':id'
export function normalizeRoute(route) {
  return route
    ?.replace(
      /\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}(?=$|[/?])/gi,
      "/:id"
    )
    .replace(/\/Q\d+(?=$|[/?])/gi, "/:id");
}

export function mapApiError(status, resource = "resource") {
  switch (status) {
    case 401:
      return "You are not authenticated.";
    case 403:
      return "You are not authorized to do this action.";
    case 404:
      return `The ${resource} you are looking for could not be found.`;
    case 409:
      return `Error-409. The ${resource} you are trying to create is already present`;
    case 422:
      return `Error-422. Unprocessable request`;
    case 500:
      return "Error-500. Something went wrong on our end.";
    case 502:
      return "Error-502. Received an invalid response from the upstream server.";
    case 504:
      return "Error-504. Server is busy. Please try again after some time.";
    default:
      return "Something went wrong.";
  }
}
