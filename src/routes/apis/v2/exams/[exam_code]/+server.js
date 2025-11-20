import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";
import { getHeaders } from "$lib/utils/helper.js";

export async function GET({ params, cookies, fetch: eventFetch }) {
  try {
    const { exam_code } = params;
    if (!exam_code) {
      return json(
        {
          error: "Exam code is required",
        },
        { status: 400 }
      );
    }

    // TODO: Replace with actual API call once backend is ready
    // Hardcoded response for development
    // const hardcodedResponse = {
    //   exam_code: "EXAM00001",
    //   exam_name: "Mid-Term Examination 2025",
    //   board_id: 7,
    //   state_id: 9,
    //   medium_id: 3,
    //   standard: "10",
    //   total_time: 180,
    //   exam_mode: "online",
    //   status: "draft",
    //   created_at: "2025-11-06T10:30:00Z",
    //   updated_at: "2025-11-06T10:30:00Z",
    //   designs: [
    //     // {
    //     //   "exam_name": "Mathematics - Class 10",
    //     //   "exam_code": "QP00001",
    //     //   "exam_type": "MCQ",
    //     //   "exam_mode": "online",
    //     //   "standard": "10",
    //     //   "division": "A",
    //     //   "subject": "Maths",
    //     //   "medium": "English",
    //     //   "status": "draft",
    //     //   "number_of_sets": 1,
    //     //   "number_of_versions": 1,
    //     //   "total_questions": 50,
    //     //   "board_id": 7,
    //     //   "board_name": "State",
    //     //   "state_id": 9,
    //     //   "state_name": "Tamil Nadu",
    //     //   "medium_code": "2000",
    //     //   "subject_code": "3007",
    //     //   "created_at": "2025-11-06T10:30:00Z",
    //     //   "qtn_codes_to_exclude": [],
    //     //   "chapters_topics": [
    //     //     {
    //     //       "type": "chapter",
    //     //       "codes": [
    //     //         {
    //     //           "code": "C001",
    //     //           "name": "Algebra",
    //     //           "qn_count": null
    //     //         }
    //     //       ]
    //     //     }
    //     //   ],
    //     //   "papers": [
    //     //     "QP001S01V01"
    //     //   ]
    //     // }
    //   ],
    // };

    // return json(hardcodedResponse);

    //  Uncomment when API is ready
    // Get authentication headers
    const authHeader = getHeaders(cookies);
   
    const endpoint = `${PUBLIC_API_BASE_URL}/v2/exams/${exam_code}`;
    

    const response = await eventFetch(endpoint, {
      method: "GET",
      headers: authHeader,
    });

    // Handle error responses
    if (!response.ok) {
      let errorText = null;
      try {
        errorText = await response.json();
      } catch (err) {
        console.error("Failed to read error response:", err);
      }
      console.error(`API error ${response.status}: ${errorText}`);

      return json(
        {
          error: `Failed to fetch exam details: ${response.status}`,
          details: errorText.details,
        },
        { status: response.status }
      );
    }

    // Return the API response
    const data = await response.json();
  
    return json(data);
  } catch (err) {
    console.error("Error in exam details API endpoint:", err);

    return json(
      {
        error: err.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function PUT({ params, cookies, request, fetch: eventFetch }) {
  try {
    const exam_code = params.exam_code;

    const authHeader = getHeaders(cookies);

    const payload = await request.json();

    const endpoint = `${PUBLIC_API_BASE_URL}/v2/exams/${exam_code}`;

    const response = await eventFetch(endpoint, {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message ||
        (typeof errorData?.detail === "string"
          ? errorData.detail
          : "Failed to add quiz to exam.");
      return json({ error: errorMessage }, { status: response.status });
    }

    const result = await response.json();
    return json(result, { status: response?.status });
  } catch (error) {
    console.error("Error updating exam:", error);
    return json({ error: "Failed to add quiz to exam." }, { status: 500 });
  }
}

export async function DELETE({ params, cookies }) {
  const authToken = cookies.get("access_token");
  const exam_code = params.exam_code;
  let response;

  try {
     response = await fetch(`${PUBLIC_API_BASE_URL}/v2/exams/${exam_code}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

   if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || 
        (typeof errorData?.detail === 'string' ? errorData.detail : "Failed to delete exam.");
      return json(
        { error: errorMessage },
        { status: response.status }
      );
      
    }

    // Handle 204 No Content response properly
    if (response.status === 204) {
      return new Response(null, { status: 204 });
    }

  } catch (error) {
    console.error("Error deleting exam:", error);
    return json(
      { error: "Failed to delete exam." },
      { status: response?.status || 500 }
    );
  }
}