import { json } from '@sveltejs/kit';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { getHeaders } from '$lib/utils/helper.js';

/**
 * GET handler to retrieve a specific organization by UUID
 */
export async function GET({ params, url, cookies, fetch: eventFetch }) {
  try {
    // Get authentication headers
    const authHeader = getHeaders(cookies);
    
    // Extract the organization UUID from path parameters
    const organizationUuid = params.id; // Note: params.id contains the UUID from the URL
    
    if (!organizationUuid) {
      return json(
        { error: 'Organization UUID is required' },
        { status: 400 }
      );
    }
    
    // Check if include_relationships was requested
    const includeRelationships = url.searchParams.get('include_relationships') === 'false';
    
    // Build API URL for getting organization details - updated to use uuid
    const endpoint = `${PUBLIC_API_BASE_URL}/v1/organizations/${organizationUuid}${includeRelationships ? '?include_relationships=true' : ''}`;
    
    
    
    const response = await eventFetch(endpoint, {
      method: 'GET',
      headers: authHeader,
    });
    
    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error ${response.status}: ${errorText}`);
      
      return json(
        { 
          error: `Failed to fetch organization: ${response.status}`,
          details: errorText
        },
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Process successful response
    const data = await response.json();
    
    // Return the organization data
    return json(data);
    
  } catch (err) {
    console.error('Error in get organization API endpoint:', err);
    
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
 * PUT handler to update an organization's information
 */
export async function PUT({ request, params, cookies, fetch: eventFetch }) {
  try {
    // Get authentication headers
    const authHeader = getHeaders(cookies);
    
    // Extract the organization UUID from path parameters
    const organizationUuid = params.id; // Note: params.id contains the UUID from the URL
    
    if (!organizationUuid) {
      return json(
        { error: 'Organization UUID is required' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const updateData = await request.json();
    
    // Build API URL for updating organization - updated to use uuid
    const endpoint = `${PUBLIC_API_BASE_URL}/v1/organizations/${organizationUuid}`;
    
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
      
      return json(
        { 
          error: errorData.error || 'Failed to update organization',
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
    
    // Return the updated organization data
    return json(data);
    
  } catch (err) {
    console.error('Error in update organization API endpoint:', err);
    
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
 * DELETE handler to delete an organization
 */
export async function DELETE({ params, cookies, fetch: eventFetch }) {
  try {
    // Get authentication headers
    const authHeader = getHeaders(cookies);
    
    // Extract the organization UUID from path parameters
    const organizationUuid = params.id; // Note: params.id contains the UUID from the URL
    
    if (!organizationUuid) {
      return json(
        { error: 'Organization UUID is required' },
        { status: 400 }
      );
    }
    
    // Build API URL for deleting organization - updated to use uuid
    const endpoint = `${PUBLIC_API_BASE_URL}/v1/organizations/${organizationUuid}`;
    
    const response = await eventFetch(endpoint, {
      method: 'DELETE',
      headers: authHeader,
    });
    
    // Handle error responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: await response.text() };
      }
      
      return json(
        { 
          error: errorData.error || `Failed to delete organization: ${response.status}`,
          details: errorData.details || null
        },
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return success message
    return json({
      message: 'Organization successfully deleted'
    });
    
  } catch (err) {
    console.error('Error in delete organization API endpoint:', err);
    
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