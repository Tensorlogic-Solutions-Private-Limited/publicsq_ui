/**
 * Validates required fields for subject creation
 * @param {string} subjectName - The subject name to validate
 * @param {Object} formData - The form data containing standard and medium_code
 * @returns {Object} - Returns { isValid: boolean, error?: string }
 */
export function validateSubjectCreation(subjectName, formData) {
  // Validate subject name
  if (!subjectName || !subjectName.trim()) {
    return {
      isValid: false,
      error: "Subject name is required."
    };
  }
  
  // Validate standard
  if (!formData.standard) {
    return {
      isValid: false,
      error: "Standard is required to create a subject."
    };
  }
  
  // Validate medium
  if (!formData.medium_code) {
    return {
      isValid: false,
      error: "Medium is required to create a subject."
    };
  }

  return {
    isValid: true
  };
}

/**
 * Validates required fields for taxonomy creation
 * @param {Object} formData - The form data containing required fields
 * @param {Object} newItemData - The new item data with names
 * @returns {Object} - Returns { isValid: boolean, error?: string }
 */
export function validateTaxonomyCreation(formData, newItemData) {
  // Validate basic required fields
  if (!formData.state_id) {
    return {
      isValid: false,
      error: "State is required to create taxonomy items."
    };
  }
  
  if (!formData.board_id) {
    return {
      isValid: false,
      error: "Board is required to create taxonomy items."
    };
  }
  
  if (!formData.medium_code) {
    return {
      isValid: false,
      error: "Medium is required to create taxonomy items."
    };
  }
  
  if (!formData.standard) {
    return {
      isValid: false,
      error: "Standard is required to create taxonomy items."
    };
  }
  
  if (!formData.subject_code) {
    return {
      isValid: false,
      error: "Subject is required to create taxonomy items."
    };
  }

  // Validate that at least one item name is provided
  const hasAnyName = 
    (newItemData.chapter_name && newItemData.chapter_name.trim()) ||
    (newItemData.topic_name && newItemData.topic_name.trim()) ||
    (newItemData.subtopic_name && newItemData.subtopic_name.trim());

  if (!hasAnyName) {
    return {
      isValid: false,
      error: "At least one item name is required."
    };
  }

  return {
    isValid: true
  };
}