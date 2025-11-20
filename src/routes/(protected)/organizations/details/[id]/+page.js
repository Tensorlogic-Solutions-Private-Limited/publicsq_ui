export async function load({ params, fetch }) {
  const organizationId = params.id;
  
  try {
    // Fetch organization details
    const orgResponse = await fetch(`/apis/organizations/${organizationId}?include_relationships=true`);
    
    if (!orgResponse.ok) {
      const error = await orgResponse.text();
      throw new Error(error || `Failed to load organization with ID ${organizationId}`);
    }
    
    const organization = await orgResponse.json();
    
    return {
      organization,
      blocks: organization.blocks || []
    };
  } catch (error) {
    let details = '';
    try {
      // Try to extract details from error message if it's JSON
      const parsed = JSON.parse(error.message);
      details = parsed.details || parsed.error || error.message;
    } catch {
      details = error.message;
    }
    return {
      organization: null,
      blocks: [],
      error: 'Data not found',
      details
    };
  }
}