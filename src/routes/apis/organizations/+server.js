import { json } from '@sveltejs/kit';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { getHeaders } from '$lib/utils/helper.js';

export async function GET({ url, cookies, fetch: eventFetch }) {
  try {
    // Get authentication headers
    const authHeader = getHeaders(cookies);
    
    // Extract query parameters
    const page = url.searchParams.get('page') || '1';
    const pageSize = url.searchParams.get('page_size') || '50';
    const includeInactive = url.searchParams.get('include_inactive') || 'false';
    const orgName = url.searchParams.get('org_name');

    // Build API URL with query parameters
    let endpoint = `${PUBLIC_API_BASE_URL}/v1/organizations`;
    const params = new URLSearchParams();
    
    // Add query parameters
    params.append('page', page);
    params.append('page_size', pageSize);
    params.append('include_inactive', includeInactive);
    
     if (orgName && orgName.trim()) {
      params.append('org_name', orgName.trim());
    }
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
        error: `Failed to fetch organizations: ${response.status}`,
        details: errorText,
        data: [],
        total: 0,
        page: parseInt(page)
      }, { status: response.status });
    }
    
    // Return the API response directly since it matches our structure
    const data = await response.json();
    return json(data);
    
  } catch (err) {
    console.error('Error in organizations API endpoint:', err);
    
    return json({ 
      error: err.message || 'Internal server error',
      data: [],
      total: 0,
      page: 1
    }, { status: 500 });
  }
}

export async function POST({ request, cookies, fetch: eventFetch }) {
  try {
    // Get the request body
    const requestData = await request.json();
    
    // Get auth headers from helper
    const authHeader = getHeaders(cookies);
    
    // Endpoint for creating an organization
    const endpoint = `${PUBLIC_API_BASE_URL}/v1/organizations`;
    
    // Make the API request
    const res = await eventFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader
      },
      body: JSON.stringify({
        org_code: requestData.org_code,
        org_name: requestData.org_name,
        org_description: requestData.org_description,
        is_active: requestData.is_active ?? true
      })
    });
    
    // Get the response body
    const responseText = await res.text();
    let responseData = {};
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { message: responseText };
    }
    
    // Handle response based on status code
    if (res.ok) {
      // Successfully created organization
      return json(responseData, { status: 201 });
    } else {
      console.error('Error creating organization:', res.status, responseData);
      
      return json({
        error: responseData.detail || 'Failed to create organization',
        details: responseData
      }, { status: res.status });
    }
  } catch (err) {
    console.error('Error in create organization endpoint:', err);
    return json({
      error: err.message || 'An unexpected error occurred',
      details: err.stack
    }, { status: 500 });
  }
}