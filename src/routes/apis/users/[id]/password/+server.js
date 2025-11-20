import { json } from '@sveltejs/kit';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { getHeaders } from '$lib/utils/helper.js';

/**
 * PATCH handler to update a user's password
 */
export async function PATCH({ request, params, cookies, fetch: eventFetch }) {
  try {
    // Get authentication headers
    const headers = getHeaders(cookies);
    
    // Extract the user UUID from path parameters
    const userUuid = params.id;
    
    if (!userUuid) {
      return json(
        { error: 'User UUID is required' },
        { status: 400 }
      );
    }
    
    // Parse request body to get the new password
    const requestData = await request.json();
    const { new_password } = requestData;
    
    if (!new_password) {
      return json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }
    
    console.log(`Attempting to update password for user ${userUuid}`);
    
    // Build the API endpoint URL
    const apiEndpoint = `${PUBLIC_API_BASE_URL}/v1/users/${userUuid}/password`;
    console.log('API endpoint:', apiEndpoint);
    
    // Send request to the backend API
    const response = await fetch(apiEndpoint, {
      method: 'PATCH', 
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ new_password })
    });
    
    console.log(`Password update response status: ${response.status}`);
    
    // Handle different response statuses properly
    if (response.status === 404) {
      return json({ error: 'User not found' }, { status: 404 });
    } else if (response.status === 403) {
      return json({ error: 'Insufficient permissions to update this password' }, { status: 403 });
    } else if (response.status === 400) {
      return json({ error: 'Invalid password format' }, { status: 400 });
    } else if (!response.ok) {
      return json({ error: 'Failed to update password' }, { status: response.status });
    }
    
    // For successful responses, try to parse the JSON
    try {
      const responseData = await response.json();
      return json(responseData);
    } catch (e) {
      // If JSON parsing fails, just return a simple success message
      return json({ message: 'Password updated successfully' });
    }
    
  } catch (error) {
    console.error('Error in password update API endpoint:', error);
    return json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}