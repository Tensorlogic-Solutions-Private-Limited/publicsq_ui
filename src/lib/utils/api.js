import { authStore } from "$lib/stores/authStore";

export const API_BASE_URL = "dummyurl" ; 

/**
 * Get the authentication token from localStorage
 * @returns {string|null}
 */
// Store token variable - can be set either from session or localStorage
let authToken = null;

/**
 * Set the authentication token
 * @param {string} token - The authentication token
 */
export function setAuthToken(token) {
  
  authToken = token;
}

/**
 * Get the authentication token
 * @returns {string|null}
 */
const getAuthToken = () => {
  // First check if we have an in-memory token
  if (authToken) return authToken;
  return null;
};


/**
 * Generic API call utility function
 * @param {string} endpoint - API endpoint without base URL
 * @param {object} options - Request options
 * @returns {Promise<any>}
 */
export async function apiCall(endpoint, options = {}) {
  try {
    const token = localStorage.getItem("token");
    //  const token = options.token || getAuthToken();
    
      if (!token) {
      console.warn('API call attempted without authentication token');
    }
    
    
   
    const acceptHeader = options.headers?.Accept || "application/json";

    const defaultHeaders = {
      Accept: acceptHeader,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    

    const response = await fetch(fullUrl, config);

    // Handle non-JSON responses (like PDF)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/pdf")) {
      const blob = await response.blob();
      return { data: blob, error: null };
    }

    // Handle JSON responses
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response format");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || `HTTP error! status: ${response.status}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("API call failed:", error);
    return {
      data: null,
      error: error.message || "Failed to complete request",
    };
  }
}

/**
 * API endpoints configuration
 */
export const endpoints = {
  subjects: "/subjects",
  mediums: "/mediums",
  question_formats: "/question_formats",
  chapterTopics: "/chapters_topics",
  questions: "/questions",
  question_types: "/question_types",
  question_papers: "/exams",
  register: "/register",
  login: "/login",
  viewPapers: "/exams",
  adminQuestionPaper: '/admin/qn_papers',
  userQuestionPaper : '/qn_papers',
  adminListUsers : '/users',
  adminUpdatePasswords: (userId) => `/users/${userId}/password`, 
};

/**
 * Query parameter builder
 * @param {Object} params - Object containing query parameters
 * @returns {string} - URL encoded query string
 */
const buildQueryString = (params) => {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
};

/**
 * Predefined API methods for common operations
 */
export const api = {
  // Subject related endpoint
  subjects: {
    getAll: async () => {
      const response = await apiCall(endpoints.subjects);
      if (response.error) {
        console.error("Failed to fetch subjects:", response.error);
      }
      return response;
    },
  },

  auth: {
    register: async (userData) => {
      try {
        const response = await apiCall(endpoints.register, {
          method: "POST",
          body: JSON.stringify(userData),
        });
        return response;
      } catch (error) {
        console.error("Registration failed:", error);
        return {
          data: null,
          error: error.message || "Registration failed",
        };
      }
    },

    login: async (credentials) => {
      try {
        const response = await apiCall(endpoints.login, {
          method: "POST",
          body: JSON.stringify(credentials),
        });

        console.log("Raw login response:", response);

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data && response.data.access_token) {
          const {
            access_token,
            token_type = "bearer",
            username = "",
            role = "user",
            role_code = "",
            user_id = "",
            role_name = "",
          } = response.data;

          console.log("Extracted login data:", {
            access_token,
            token_type,
            username,
            role,
            role_code,
            user_id,
            role_name,
          });

          localStorage.setItem("token", access_token);

          await authStore.login({
            token: access_token,
            role: role || "user",
            roleCode: role_code || "1000",
            username: username || "",
            userId: user_id || "",
            roleName: role_name || "",
          });

          return {
            data: response.data,
            error: null,
          };
        } else {
          throw new Error("Invalid login response format");
        }
      } catch (error) {
        console.error("Login failed:", error);
        return {
          data: null,
          error: error.message || "Login failed",
        };
      }
    },

    logout: async () => {
      try {
        await authStore.logout();
        return { data: true, error: null };
      } catch (error) {
        console.error("Logout failed:", error);
        return {
          data: null,
          error: error.message || "Logout failed",
        };
      }
    },
  },

  mediums: {
    getAll: async () => {
      const response = await apiCall(endpoints.mediums);
      if (response.error) {
        console.error("Failed to fetch mediums:", response.error);
      }
      return response;
    },

    getByCode: async (code) => {
      return await apiCall(`${endpoints.mediums}/${code}`);
    },

    getWithFilters: async (filters = {}) => {
      const queryString = buildQueryString(filters);
      return await apiCall(
        `${endpoints.mediums}${queryString ? `?${queryString}` : ""}`
      );
    },
  },

  // Chapter related endpoints
  chapters: {
    getAll: (params = {}) =>
      apiCall(`${endpoints.chapters}?${buildQueryString(params)}`),
    getById: (id) => apiCall(`${endpoints.chapters}/${id}`),
    getBySubject: (subjectId) =>
      apiCall(`${endpoints.chapters}?subject_id=${subjectId}`),
  },

  // Question related endpoints
  questions: {
    getAll: (params = {}) =>
      apiCall(`${endpoints.questions}?${buildQueryString(params)}`),
    getById: (id) => apiCall(`${endpoints.questions}/${id}`),
    getByTopic: (topicId) =>
      apiCall(`${endpoints.questions}?topic_id=${topicId}`),
    getByFormat: (formatId) =>
      apiCall(`${endpoints.questions}?format_id=${formatId}`),
    create: (questionData) =>
      apiCall(endpoints.questions, {
        method: "POST",
        body: JSON.stringify(questionData),
      }),
    update: (id, questionData) =>
      apiCall(`${endpoints.questions}/${id}`, {
        method: "PUT",
        body: JSON.stringify(questionData),
      }),
    delete: (id) =>
      apiCall(`${endpoints.questions}/${id}`, {
        method: "DELETE",
      }),
  },

  // Question format related endpoints
  questionFormats: {
    getAll: async () => {
      const response = await apiCall(endpoints.question_formats);
      if (response.error) {
        console.error("Failed to fetch question formats:", response.error);
      }
      return response;
    },

    getByCode: async (code) => {
      return await apiCall(`${endpoints.question_formats}/${code}`);
    },

    getWithFilters: async (filters = {}) => {
      const queryString = buildQueryString(filters);
      return await apiCall(
        `${endpoints.question_formats}${queryString ? `?${queryString}` : ""}`
      );
    },
  },

  chapterTopics: {
    getAll: async (params) => {
      const queryString = buildQueryString(params);
      const response = await apiCall(
        `${endpoints.chapterTopics}?${queryString}`
      );

      if (response.error) {
        console.error("Failed to fetch chapter topics:", response.error);
      }

      return {
        data: response.data || [],
        error: response.error,
      };
    },
  },

  // Questions related endpoints (extended)
  questions: {
    getByGroupCodes: async (params) => {
      const queryString = new URLSearchParams({
        type: params.type.toLowerCase(),
        codes: params.codes,
      }).toString();

      return await apiCall(`${endpoints.questions}?${queryString}`);
    },
  },

  // Question Types related endpoints
  questionTypes: {
    getAll: async () => {
      const response = await apiCall(endpoints.question_types);
      if (response.error) {
        console.error("Failed to fetch question types:", response.error);
      }
      return response;
    },
  },

  // Question papers related endpoint
  questionPapers: {
    create: async (payload) => {
      try {
        console.log("Creating exam design with payload:", payload);

        const response = await apiCall(endpoints.question_papers, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (response.error) {
          throw new Error(response.error);
        }

        const { data } = response;
        const statusText = payload.status === 1 ? "draft" : "finalized";
        console.log(`Exam design ${statusText} created successfully:`, {
          exam_name: data.data?.exam_name,
          exam_code: data.data?.exam_code,
          status: data.data?.status,
          message: data.message,
        });

        return {
          data: response.data,
          error: null,
        };
      } catch (error) {
        console.error("Failed to create exam design:", error);
        return {
          data: null,
          error: error.message || "Failed to create exam design",
        };
      }
    },
update: async (examCode, payload) => {
  try {
    console.log(`Updating exam design ${examCode} with payload:`, payload);

    // Make the API call
    const response = await apiCall(
      `${endpoints.question_papers}/${examCode}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    console.log(`Exam design ${examCode} updated successfully:`, response.data);

    return {
      data: response.data,
      error: null,
    };
  } catch (error) {
    console.error(`Failed to update exam design ${examCode}:`, error);

    return {
      data: null,
      error: error.message || "Failed to update exam design",
    };
  }
},

    createDraft: async (basicInfo) => {
      return await api.questionPapers.create({
        ...basicInfo,
        status: 1,
      });
    },

    finalize: async (completeInfo) => {
      return await api.questionPapers.create({
        ...completeInfo,
        status: 2,
      });
    },
  },

  viewPapers: {
    getAll: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const response = await apiCall(
          `${endpoints.viewPapers}?${queryString}`
        );

        if (response.error) {
          console.error("Failed to fetch exam papers", response.error);
        }
        return response;
      } catch (error) {
        console.error("An unexpected error occurred in getAll:", error);
        return {
          data: null,
          error: error.message || "Failed to fetch exam papers.",
        };
      }
    },

    getByCode: async (examCode) => {
      try {
        console.log(`Fetching exam design for code: ${examCode}`);

        const response = await apiCall(
          `${endpoints.viewPapers}/${examCode}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("The response for the logs for exambyCode", response);

        if (response.error) {
          throw new Error(response.error);
        }

        if (!response.data || !response.data.design) {
          throw new Error("Invalid response: missing design data");
        }

        const { design } = response.data;

        if (!Array.isArray(design.papers)) {
          console.warn("Papers field is not an array, defaulting to empty array");
          design.papers = [];
        }

        console.log(
          `Successfully fetched exam design: ${design.exam_name} (${design.exam_code})`
        );
        console.log(`Associated papers: ${design.papers.length} papers`);

        return {
          data: response.data,
          error: null,
        };
      } catch (error) {
        console.error("Failed to fetch exam design:", error);
        return {
          data: null,
          error: error.message || "Failed to fetch exam details",
        };
      }
    },

    delete: async (examCode) => {
      try {
        const response = await apiCall(`${endpoints.viewPapers}/${examCode}`, {
          method: "DELETE",
        });

        if (response.error) {
          throw new Error(response.error);
        }

        return {
          data: response.data,
          error: null,
        };
      } catch (error) {
        console.error("Failed to delete exam:", error);
        return {
          data: null,
          error: error.message || "Failed to delete exam",
        };
      }
    },
  },

  adminPapers: {
    getDetails: async ({
      paperCode,
      paperId,
      format = "json",
      questionsOnly = false,
    }) => {
      try {
        const queryParams = new URLSearchParams({
          paper_id: paperId,
          format: format,
          questions_only: questionsOnly.toString(),
        });

        const response = await apiCall(
          `${endpoints.adminQuestionPaper}/${paperCode}?${queryParams}`,
          {
            method: "GET",
            headers: {
              Accept:
                format === "json" ? "application/json" : "application/pdf",
            },
          }
        );

        console.log("testing this api", paperId, paperCode);

        if (response.error) {
          throw new Error(response.error);
        }

        if (format === "pdf" && response.data instanceof Blob) {
          return {
            data: response.data,
            filename: `${paperId}.pdf`,
            error: null,
          };
        }

        return {
          data: response.data,
          error: null,
        };
      } catch (error) {
        console.error("Failed to fetch question paper details:", error);
        return {
          data: null,
          error: error.message || "Failed to fetch question paper details",
        };
      }
    },
  },

  adminListUsers: {
    getAll: async (params = {}) => {
      try {
        const { page = 1, limit = 10 } = params;

        const queryParams = {
          page: page,
          limit: limit,
        };

        const queryString = buildQueryString(queryParams);

        console.log(`Fetching users with parameters:`, queryParams);

        const response = await apiCall(
          `${endpoints.adminListUsers}?${queryString}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Raw API response:", response);

        if (response && response.error) {
          throw new Error(response.error);
        }

        if (!response) {
          throw new Error("No response received from server");
        }

        let responseData;
        if (response.data) {
          responseData = response.data;
        } else if (response.users && Array.isArray(response.users)) {
          responseData = response;
        } else {
          console.warn("Unexpected response structure:", response);
          throw new Error("Invalid response structure from server");
        }

        // Provide defaults for missing fields
        if (!responseData.page) responseData.page = page;
        if (!responseData.limit) responseData.limit = limit;
        if (!responseData.total_users)
          responseData.total_users = responseData.users
            ? responseData.users.length
            : 0;

        if (!Array.isArray(responseData.users)) {
          console.warn("Users field is not an array, defaulting to empty array");
          responseData.users = [];
        }

        console.log(
          `Successfully fetched ${responseData.users.length} users (Page ${
            responseData.page
          } of ${Math.ceil(responseData.total_users / responseData.limit)})`
        );
        console.log(`Total users in system: ${responseData.total_users}`);

        return {
          data: responseData,
          error: null,
        };
      } catch (error) {
        console.error("Failed to fetch users:", error);
        return {
          data: null,
          error: error.message || "Failed to fetch users",
        };
      }
    },

    getById: async (userId) => {
      try {
        console.log(`Fetching user with ID: ${userId}`);

        const response = await apiCall(
          `${endpoints.adminListUsers}/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.error) {
          throw new Error(response.error);
        }

        if (!response.data) {
          throw new Error("Invalid response: missing data");
        }

        const userData = response.data;

        console.log(
          `Successfully fetched user: ${userData.username} (ID: ${userData.id})`
        );

        return {
          data: userData,
          error: null,
        };
      } catch (error) {
        console.error("Failed to fetch user:", error);
        return {
          data: null,
          error: error.message || "Failed to fetch user",
        };
      }
    },

    update: async (userId, updateData) => {
      try {
        console.log(`Updating user ${userId} with data:`, updateData);

        const response = await apiCall(
          `${endpoints.adminListUsers}/${userId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          }
        );

        if (response.error) {
          throw new Error(response.error);
        }

        if (!response.data) {
          throw new Error("Invalid response: missing data");
        }

        const userData = response.data;

        console.log(
          `Successfully updated user: ${userData.username} (ID: ${userData.id})`
        );

        return {
          data: userData,
          error: null,
        };
      } catch (error) {
        console.error(`Failed to update user ${userId}:`, error);
        return {
          data: null,
          error: error.message || "Failed to update user",
        };
      }
    },

    formatUser: (user) => {
      if (!user) return null;

      return {
        ...user,
        created_at_formatted: user.created_at
          ? new Date(user.created_at).toLocaleString()
          : "N/A",
        updated_at_formatted: user.updated_at
          ? new Date(user.updated_at).toLocaleString()
          : "N/A",
        status_text: user.is_active ? "Active" : "Inactive",
        status_color: user.is_active ? "green" : "red",
        status_badge: user.is_active
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800",
      };
    },
  },

  adminUpdatePassword: {
    update: async (userId, passwordData) => {
      try {
        console.log(`Updating password for user ID: ${userId}`);

        const response = await apiCall(endpoints.adminUpdatePasswords(userId), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(passwordData),
        });

        if (response.error) {
          throw new Error(response.error);
        }

        if (!response.data) {
          throw new Error("Invalid response: missing data");
        }

        const responseData = response.data;

        console.log(`Successfully updated password for user ID: ${userId}`);

        return {
          data: {
            message: responseData.message || "Password updated successfully",
            user_id: userId,
          },
          error: null,
        };
      } catch (error) {
        console.error(`Failed to update password for user ${userId}:`, error);
        return {
          data: null,
          error: error.message || "Failed to update password",
        };
      }
    },

    generateStrongPassword: (length = 12) => {
      const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
      const numberChars = "0123456789";
      const specialChars = '!@#$%^&*(),.?":{}|<>';

      const allChars =
        uppercaseChars + lowercaseChars + numberChars + specialChars;

      let password = "";

      password +=
        uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
      password +=
        lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
      password += numberChars[Math.floor(Math.random() * numberChars.length)];
      password += specialChars[Math.floor(Math.random() * specialChars.length)];

      for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }

      return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
    },
  },

  userQuestionPaper: {
    getByCode: async (paperCode, options = {}) => {
      try {
        const { format = 'json' } = options;

        const queryParams = new URLSearchParams();
        queryParams.append('paper_id', paperCode);
        
        if (format !== 'json') {
          queryParams.append('format', format);
        }

        const queryString = queryParams.toString();
        const endpoint = `${endpoints.userQuestionPaper}/${paperCode}?${queryString}`;

        console.log(`Fetching question paper: ${paperCode} in ${format} format`);
        console.log(`Full endpoint: ${endpoint}`);

        const response = await apiCall(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: format === 'pdf' ? "application/pdf" : "application/json",
          },
        });
        
        if (response.error) {
          throw new Error(response.error);
        }

        if (format === 'pdf' && response.data instanceof Blob) {
          console.log(`Successfully fetched PDF for paper: ${paperCode}`);
          return {
            data: response.data,
            filename: `${paperCode}.pdf`,
            error: null,
          };
        }

        if (format === 'json') {
          if (!response.data) {
            throw new Error("Invalid response: missing question paper data");
          }

          const paperData = response.data;

          if (!Array.isArray(paperData.questions)) {
            console.warn("Questions field is not an array, defaulting to empty array");
            paperData.questions = [];
          }

          console.log(`Successfully fetched question paper: ${paperData.exam_name} (${paperCode})`);
          console.log(`Questions count: ${paperData.questions.length}`);

          return {
            data: paperData,
            error: null,
          };
        }

        throw new Error("Unexpected response format from server");

      } catch (error) {
        console.error("Error fetching question paper:", error);
        return {
          data: null,
          error: error.message || "Failed to fetch question paper"
        };
      }
    },

    downloadPDF: async (paperCode) => {
      return await api.userQuestionPaper.getByCode(paperCode, { format: 'pdf' });
    },

    getJSON: async (paperCode) => {
      return await api.userQuestionPaper.getByCode(paperCode, { format: 'json' });
    },
  },
};

export default api;
