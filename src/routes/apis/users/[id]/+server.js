import { json } from '@sveltejs/kit';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { getHeaders } from '$lib/utils/helper.js';

/**
 * GET handler to retrieve a specific user by UUID
 */
export async function GET({ params, cookies, fetch: eventFetch }) {
  try {
    // Get authentication headers
    const authHeader = getHeaders(cookies);
    
    // Extract the user UUID from path parameters
    const userUuid = params.id; // Note: params.id contains the UUID from the URL
    
    if (!userUuid) {
      return json(
        { error: 'User UUID is required' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Build API URL for getting a specific user - updated to use user_uuid
    const endpoint = `${PUBLIC_API_BASE_URL}/v1/users/${userUuid}`;
    
    const response = await eventFetch(endpoint, {
      method: 'GET',
      headers: authHeader,
    });
    
    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => null);
      console.error(`API error ${response.status}: ${errorText}`);
      
      // Map common error codes to appropriate messages
      let errorMessage = 'Failed to fetch user details';
      let status = response.status;
      
      if (status === 403) {
        errorMessage = 'You do not have permission to view this user';
      } else if (status === 404) {
        errorMessage = 'User not found';
      }
      
      return json(
        { 
          error: errorMessage,
          details: errorText
        },
        { 
          status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Process successful response
    const data = await response.json();
    
    // Return the user data
    return json(data);
    
  } catch (err) {
    console.error('Error in get user API endpoint:', err);
    
    return json(
      { 
        error: err.message || 'Internal server error'
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * PUT handler to update a user's information
 */
export async function PUT({ request, params, cookies, fetch: eventFetch }) {
  try {
    // Get authentication headers
    const authHeader = getHeaders(cookies);
    
    // Extract the user UUID from path parameters
    const userUuid = params.id; // Note: params.id contains the UUID from the URL
    
    if (!userUuid) {
      return json(
        { error: 'User UUID is required' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Parse request body
    const updateData = await request.json();
    console.log('update data', updateData) ; 
    // Build API URL for updating a specific user - updated to use user_uuid
    const endpoint = `${PUBLIC_API_BASE_URL}/v1/users/${userUuid}`;
    
    const response = await eventFetch(endpoint, {
      method: 'PUT',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    // Handle error responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: await response.text() };
      }
      
      console.error(`API error ${response.status}:`, errorData);
      
      // Map common error codes to appropriate messages
      let errorMessage = errorData.error || 'Failed to update user';
      let status = response.status;
      
      if (status === 400) {
        errorMessage = errorData.error || 'Invalid user data provided';
      } else if (status === 403) {
        errorMessage = 'You do not have permission to update this user';
      } else if (status === 404) {
        errorMessage = 'User not found';
      }
      
      return json(
        { 
          error: errorMessage,
          details: errorData.details || null
        },
        { 
          status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Process successful response
    const data = await response.json();
    
    // Return the updated user data
    return json(data);
    
  } catch (err) {
    console.error('Error in update user API endpoint:', err);
    
    return json(
      { 
        error: err.message || 'Internal server error'
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * DELETE handler to deactivate a user
 * This simply sets is_active to false via the update endpoint
 */
export async function DELETE({ params, cookies, fetch: eventFetch }) {
  try {
    // Get authentication headers
    const authHeader = getHeaders(cookies);
    
    // Extract the user UUID from path parameters
    const userUuid = params.id; // Note: params.id contains the UUID from the URL
    
    if (!userUuid) {
      return json(
        { error: 'User UUID is required' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Build API URL for updating a specific user - updated to use user_uuid
    const endpoint = `${PUBLIC_API_BASE_URL}/v1/users/${userUuid}`;
    
    // To deactivate, we just set is_active to false
    const response = await eventFetch(endpoint, {
      method: 'PUT',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_active: false
      })
    });
    
    // Handle error responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: await response.text() };
      }
      
      console.error(`API error ${response.status}:`, errorData);
      
      return json(
        { 
          error: errorData.error || `Failed to deactivate user: ${response.status}`,
          details: errorData.details || null
        },
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Process successful response
    const data = await response.json();
    
    // Return the updated user data
    return json({
      ...data,
      message: 'User successfully deactivated'
    });
    
  } catch (err) {
    console.error('Error in deactivate user API endpoint:', err);
    
    return json(
      { 
        error: err.message || 'Internal server error'
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

