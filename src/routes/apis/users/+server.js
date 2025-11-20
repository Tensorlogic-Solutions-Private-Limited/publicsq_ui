import { json } from '@sveltejs/kit';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { getHeaders } from '$lib/utils/helper.js';



// Users lsiting api ( GET users) and user creation (POST) can be written here


export async function GET({ url, cookies, fetch: eventFetch }) {
  try {
    // Get authentication headers
    const authHeader = getHeaders(cookies);
    
    // Extract query parameters
    const page = url.searchParams.get('page') || '1';
    const perPage = url.searchParams.get('per_page') || '10';
    const search = url.searchParams.get('search');
    const roleCode = url.searchParams.get('role_code');
    const isActive = url.searchParams.get('is_active');
    
    // Build API URL with query parameters
    let endpoint = `${PUBLIC_API_BASE_URL}/v1/users`;
    const params = new URLSearchParams();
    
    // Add all query parameters
    params.append('page', page);
    params.append('per_page', perPage);
    
    if (search) params.append('search', search);
    if (roleCode) params.append('role_code', roleCode);
    if (isActive !== null && isActive !== undefined) params.append('is_active', isActive);
    
    // Append query string to endpoint
    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
    
    
    
    const response = await eventFetch(endpoint, {
      method: 'GET',
      headers: authHeader,
    });
    
    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => null);
      console.error(`API error ${response.status}: ${errorText}`);
      
      return json({ 
        error: `Failed to fetch users: ${response.status}`,
        details: errorText,
        users: [],
        total: 0,
        total_pages: 0,
        page: parseInt(page)
      }, { status: response.status });
    }
    
    // Process successful response
    const data = await response.json();
    
    // Return the API response
    return json(data);
    
  } catch (err) {
    console.error('Error in users API endpoint:', err);
    
    return json({ 
      error: err.message || 'Internal server error',
      users: [],
      total: 0,
      total_pages: 0,
      page: 1
    }, { status: 500 });
  }
}

export async function POST({ request, cookies, fetch: eventFetch, url }) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Get query parameters that might override body values
    const organizationId = url.searchParams.get("organization_id");
    const blockId = url.searchParams.get("block_id");
    const schoolId = url.searchParams.get("school_id");
    
    // Create a new request body with potential overrides
    const requestData = {
      ...body,
      ...(organizationId && { organization_id: parseInt(organizationId) }),
      ...(blockId && { block_id: parseInt(blockId) }),
      ...(schoolId && { school_id: parseInt(schoolId) })
    };

    // Get auth headers from helper
    const authHeader = getHeaders(cookies);
    
    // Endpoint for creating a user
    const endpoint = `${PUBLIC_API_BASE_URL}/v1/users/`;
    
    
    
    // Make the API request
    const res = await eventFetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader
      },
      body: JSON.stringify(requestData)
    });
    
    // Get the response body
    const responseText = await res.text();
    let responseData = {};
    
    try {
      // Try to parse the response as JSON
      responseData = JSON.parse(responseText);
    } catch (e) {
      // If parsing fails, use the raw text
      responseData = { message: responseText };
    }
    
    // Handle response based on status code
    if (res.ok) {
      // Successfully created user
      return json(responseData, { status: res.status });
    } else {
      // Error response with proper status code
      console.error("Error creating user:", res.status, responseData);
      
      return json({
        error: responseData.detail || "Failed to create user",
        details: responseData
      }, { status: res.status });
    }
  } catch (err) {
    return json({
      error: err.message || "An unexpected error occurred",
      details: err.stack
    }, { status: 500 });
  }
}
