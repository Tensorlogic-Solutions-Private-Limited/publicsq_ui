export const cognitiveLearning = [
  { id: "1", name: "Knowledge" },
  { id: "2", name: "Application" },
  { id: "3", name: "Understanding" },
];

export const difficultyLevels = [
  { id: "1", name: "Easy" },
  { id: "2", name: "Medium" },
  { id: "3", name: "Hard" },
];

export const localGovtOptions = [
  { id: "1", name: "Corporation" },
  { id: "2", name: "Municipality" },
  { id: "3", name: "Panchayath" },
  { id: "4", name: "Other" },
];

export const boardOptions = [
  { id: 1, name: "CBSE" },
  { id: 2, name: "ICSE" },
  { id: 3, name: "IB" },
  { id: 4, name: "State Board - Kerala" },
  { id: 5, name: "State Board - Tamil Nadu" },
  { id: 6, name: "State Board - Karnataka" },
  { id: 7, name: "State Board - Andhra Pradesh" },
  { id: 8, name: "Other" }
];

export const states = [
  { id: "1", name: "Andhra Pradesh" },
  { id: "2", name: "Arunachal Pradesh" },
  { id: "3", name: "Assam" },
  { id: "4", name: "Bihar" },
  { id: "5", name: "Chhattisgarh" },
  { id: "6", name: "Goa" },
  { id: "7", name: "Gujarat" },
  { id: "8", name: "Haryana" },
  { id: "9", name: "Himachal Pradesh" },
  { id: "10", name: "Jharkhand" },
  { id: "11", name: "Karnataka" },
  { id: "12", name: "Kerala" },
  { id: "13", name: "Madhya Pradesh" },
  { id: "14", name: "Maharashtra" },
  { id: "15", name: "Manipur" },
  { id: "16", name: "Meghalaya" },
  { id: "17", name: "Mizoram" },
  { id: "18", name: "Nagaland" },
  { id: "19", name: "Odisha" },
  { id: "20", name: "Punjab" },
  { id: "21", name: "Rajasthan" },
  { id: "22", name: "Sikkim" },
  { id: "23", name: "Tamil Nadu" },
  { id: "24", name: "Telangana" },
  { id: "25", name: "Tripura" },
  { id: "26", name: "Uttar Pradesh" },
  { id: "27", name: "Uttarakhand" },
  { id: "28", name: "West Bengal" },
  { id: "29", name: "Andaman and Nicobar Islands" },
  { id: "30", name: "Chandigarh" },
  { id: "31", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { id: "32", name: "Delhi" },
  { id: "33", name: "Jammu and Kashmir" },
  { id: "34", name: "Ladakh" },
  { id: "35", name: "Lakshadweep" },
  { id: "36", name: "Puducherry" },
];

export const USER_ROLES = {
  1: {
    id: 1,
    role_code: "super_admin",
    role_name: "Super Admin",
  },
  2: {
    id: 2,
    role_code: "admin",
    role_name: "Admin",
  },
  3: {
    id: 3,
    role_code: "admin_user",
    role_name: "Admin-User",
  },
  4: {
    id: 4,
    role_code: "block_admin",
    role_name: "Block Admin",
  },
  5: {
    id: 5,
    role_code: "teacher",
    role_name: "Teacher",
  },
};

// for RBAC - in the same format as route names
export const menuItems = {
	DASHBOARD: 'dashboard',
	ORGANIZATIONS: 'organizations',
	REGIONS: 'regions',
	SCHOOLS: 'schools',
	USERS: 'users',
	QUESTIONS: 'questions',
	QUIZZES: 'quiz',
	UPLOAD_HISTORY: 'upload_history'
};
