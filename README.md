# Smart Quiz Generator UI

A comprehensive web application for educational institutions to create, manage, and conduct online examinations with automatically generated exams/quizzes from a centralized question bank.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

## 🎯 Overview

This application is designed for educational organizations to streamline the examination process. It enables administrators and educators to:
- Manage organizational hierarchy (Organization → Region/Block → School)
- Bulk upload questions to create question bank 
- Create multi-subject examinations with customizable parameters
- Generate question papers based on requirements
- Conduct online exams with a student-friendly interface


## ✨ Key Features

### Exam Management
- **Question Bank Integration**: Bulk upload and manage questions via API
- **Multi-Subject Exams**: Create exams with multiple subject sections
- **Flexible Configuration**: Set exam type, mode (online/offline), duration, and organizational scope
- **Hierarchical Content Selection**: Choose content at chapter and topic level
- **Automatic Question Fetching**: Questions automatically pulled from question bank based on selections

### Exam Lifecycle
The application manages exams through four distinct states:

1. **Draft** - Initial creation, fully editable
2. **Saved** - Configuration finalized, ready to conduct
3. **Started** - Exam is live/in progress
4. **Completed (Conducted)** - Exam finished, results available

### Preview & Validation
- **Full Exam Preview**: View complete question paper with all subjects
- **Subject-wise Preview**: Preview individual subject sections
- **Question Management**: Delete questions from generated papers
- **Real-time Updates**: Question counts and metadata update automatically

### Exam Attempt Interface
- **Student-Friendly UI**: Clean, distraction-free exam interface
- **Question Navigation**: Easy movement between questions
- **Accessibility Features**: Font size adjustment for better readability
- **Answer Review**: View correct answers in preview mode

### Role-Based Access Control (RBAC)
- **Route Protection**: Restrict access to routes based on user roles
- **Action-Level Permissions**: Control visibility of add/edit/delete actions
- **Organizational Hierarchy**: Scope data based on user's organization/region/school


### Tech Stack
- **Framework**: [SvelteKit](https://kit.svelte.dev/) - Full-stack web framework
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Icons**: [Lucide Icons](https://lucide.dev/) 
- **Language**: JavaScript/Svelte

### Project Structure
```
src/
├── hooks.server.js          # Server-side request handling & RBAC
├── lib/
│   ├── components/
│   │   ├── reusable/       # Shared UI components
│   │   
│   │   
│   ├── stores/             # Svelte stores for state management
│   ├── utils/              # Utility functions
│   └── config.js           # App configuration & RBAC rules
├── routes/                 # File-based routing
│   ├── +layout.svelte      # Root layout
│   ├── +page.svelte        # Landing page
│   ├── login/
│   │   └── +page.svelte    # Login page
│   ├── unauthorized/
│   │   └── +page.svelte    # Access denied page
│   └── (protected)/        # Protected routes group
│       ├── +layout.svelte  # Protected layout with auth check
│       ├── home/           # Dashboard
│       │   └── +page.svelte
│       └── exams/          # Exam management
│           ├── +page.svelte        # Exams list
│           ├── create/             # Create exam
│           └── [exam_code]/
│               ├── details/        # Exam details & subjects
│               └── attempt/        # Student exam interface
│       
└── static/                 # Static assets (logos, fonts)
```

### Technical Patterns & Best Practices

#### Data Loading Strategy
1. **Page Load Functions (`+page.js`)**: Load prerequisite data before page renders
2. **Layout Load Functions (`+layout.js`)**: Cache data needed across multiple routes
3. **On-Mount API Calls**: Non-critical data fetched after page mounts
4. **Dependency Tracking**: Using SvelteKit's `depends()` for targeted invalidation

```javascript
// Example: Targeted data invalidation
export const load = async ({ params, fetch, depends }) => {
  depends('exam:details'); // Mark dependency
  // ... fetch data
};

// Later, invalidate only this specific data
await invalidate('exam:details');
```

#### Authentication & Session Management
- **Server-Side Cookies**: Secure, HTTP-only cookies for session persistence
- **Handle Hook**: `hooks.server.js` intercepts all requests for authentication
- **Auth Store**: Client-side store populated with user credentials from page load functions

```javascript
// Session data available in event.locals
const sessionData = {
  isAuthenticated: true,
  username,
  userId,
  roleName,
  roleCode,
  orgId,
  blockId,
  orgName,
  blockName
};
```

#### Role-Based Access Control (RBAC)

**Route Protection** (in `hooks.server.js`):
```javascript
// Normalize route for consistent matching
const normalizedRoute = await normalizeRoute(event.url.pathname);

// Check if role is restricted from accessing route
if (roles[roleCode]?.restrictedRoutes?.includes(normalizedRoute)) {
  throw redirect(302, "/unauthorized");
}
```

**Action-Level Permissions** (in components):
```svelte
{#if modifiableExamStates.includes(examStatus)}
  <Button on:click={handleEdit}>Edit</Button>
  <Button on:click={handleDelete}>Delete</Button>
{/if}
```

#### Component Architecture
- **Composition with Slots**: Flexible, reusable components
- **Event Dispatching**: Child-to-parent communication
- **Reactive Declarations**: Auto-updating derived state using `$:`
- **Portal Pattern**: Modals rendered at document root
- **Skeleton Loaders**: Enhanced perceived performance

#### State Management
- **Local Component State**: For UI-specific state
- **Svelte Stores**: For shared state across components
- **URL State**: For bookmarkable/shareable state
- **Server State**: Via load functions with automatic revalidation

#### API Integration
- **API Client Wrapper**: Centralized API calls with error handling
- **Retry Logic**: Automatic retries for failed requests
- **Parallel Fetching**: Multiple API calls with `Promise.allSettled()`
- **Optimistic Updates**: UI updates immediately, syncs in background

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API server running

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Tensorlogic-Solutions-Private-Limited/publicsq_ui.git
cd publicsq_ui
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Backend API Base URL
PUBLIC_API_BASE_URL=https://your-api-server.com

```

**Environment Variables:**

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PUBLIC_API_BASE_URL` | Base URL for backend API server | Yes | `https://api.example.com` |

> **Note**: Variables prefixed with `PUBLIC_` are exposed to the browser.

4. **Run development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 📖 Usage Guide

### Creating & Conducting Exams

#### 1. Create a New Exam
1. Navigate to the exams page
2. Click "Create New Exam" button
3. Fill in exam details:
   - Exam name
   - Organization, Block/Region, School
   - Duration
4. Save as **Draft** 

#### 2. Configure Exam Design
1. Add subjects with section configurations
2. For each subject/section:
   - Fetch chapter topics of the requried class subject
   - Generate and Prevuew


#### 3. Generate Subject quizzes from Question Bank
1. Click "Preview Exam" on any subject section
2. System automatically generates questions based on:
   - Chapter topcis selected
   - Question types (MCQ, Short Answer, Long Answer, etc.)
   - Difficulty levels
   - Subject/chapter mapping
3. Review generated questions in the preview modal
4. Questions are pulled from your organization's question bank


#### 4. Conduct Exam
1. Students access the live exam via unique exam code
2. Questions are presented according to configured sections
3. Answers are automatically saved

#### 5. Complete Exam
- Exam results become available for evaluation after final submission


### Role-Based Features

**Super Admin**:
- Full system access
- Manage all organizations, blocks, schools
- View all exams across the platform

**Block Admin**:
- Manage schools within their block/region
- View exams within their block/region
- Manage block-level question bank

**School Admin**:
- Create and manage exams for their school
- Conduct exams
- Access school's question bank

**Principal/Teacher/Examiner**:
- Create and conduct exams
- View assigned exams
- Limited question bank access

## ⚙️ Configuration

### RBAC Configuration

Role-based access control is configured in `src/lib/config.js`:

```javascript
export const roles = {
   super_admin: {
    restrictedRoutes: [], // Admin has full access, no restrictions
    restrictedActions: {}, // No action restrictions for admin
    restrictedMenuList: [],
  },
};
```

### API Endpoints

All API calls use the `PUBLIC_API_BASE_URL` environment variable:

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Test your changes thoroughly
4. **Commit with descriptive messages**
   ```bash
   git commit -m "feat: add student answer submission feature"
   ```
5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines
- Use Prettier for formatting (config included)
- Follow SvelteKit best practices
- Write semantic HTML
- Use Tailwind utility classes consistently
- Document complex functions with JSDoc comments

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide Icons](https://lucide.dev/)

## 📧 Support

For support, please open an issue in the GitHub repository or contact the development team


---

**Made with ❤️ for edu-reach.in**