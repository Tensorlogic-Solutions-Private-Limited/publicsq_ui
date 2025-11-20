/**
 * Formats a date into a readable string format
 * @param {Date|string} date - Date object or date string to format
 * @param {string} format - Format pattern (e.g., 'MMM d, yyyy')
 * @returns {string} - Formatted date string or 'N/A' if invalid date
 */
export function formatDate(date, format = 'MMM d, yyyy') {
  if (!date) return 'N/A';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthShortNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const seconds = dateObj.getSeconds();
    const dayOfWeek = dateObj.getDay();
    
    // Replace format patterns
    return format
      .replace(/yyyy/g, year)
      .replace(/yy/g, String(year).slice(-2))
      .replace(/MMMM/g, monthNames[month])
      .replace(/MMM/g, monthShortNames[month])  // This line correctly uses monthShortNames array
      .replace(/MM/g, (month + 1).toString().padStart(2, '0'))
      .replace(/M/g, month + 1)
      .replace(/dd/g, day.toString().padStart(2, '0'))
      .replace(/d/g, day)
      .replace(/EEEE/g, dayNames[dayOfWeek])
      .replace(/EEE/g, dayShortNames[dayOfWeek])
      .replace(/HH/g, hours.toString().padStart(2, '0'))
      .replace(/H/g, hours)
      .replace(/hh/g, (hours % 12 || 12).toString().padStart(2, '0'))
      .replace(/h/g, hours % 12 || 12)
      .replace(/mm/g, minutes.toString().padStart(2, '0'))
      .replace(/m/g, minutes)
      .replace(/ss/g, seconds.toString().padStart(2, '0'))
      .replace(/s/g, seconds)
      .replace(/a/g, hours < 12 ? 'AM' : 'PM')
      .replace(/p/g, hours < 12 ? 'am' : 'pm');
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'N/A';
  }
}