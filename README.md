# Smart Question Paper Generator (SmartQP)

A SvelteKit application for creating and managing exam question papers with authentication and dynamic question generation.

## 🚀 Tech Stack

- **Framework:** SvelteKit
- **Styling:** TailwindCSS
- **State Management:** Svelte Stores
- **Authentication:** JWT-based
- **API Integration:** REST API

## 🌐 API Configuration

### Base URL
```
http://13.126.201.63:8000/v1
```

### API Endpoints

```javascript
// Authentication
POST /login              // User login
POST /register          // User registration

// Question Management
GET /questions          // Get all questions
GET /questions/:id      // Get question by ID
GET /question_types     // Get question types
POST /question_papers   // Create question paper

// Subject & Chapter Management
GET /subjects          // Get all subjects
GET /mediums          // Get all mediums
GET /chapters_topics  // Get chapters and topics
```

## 📚 Project Structure

```bash
src/
├── lib/
│   ├── components/
│   │   ├── ActionBar.svelte
│   │   ├── Card.svelte
│   │   ├── ChapterSelector.svelte
│   │   ├── DifficultyDistribution.svelte
│   │   ├── ExamConfig.svelte
│   │   ├── Header.svelte
│   │   ├── QuestionsList.svelte
│   │   └── ReviewPage.svelte
│   ├── stores/
│   │   ├── authStore.js      # Authentication state
│   │   ├── paperStore.js     # Paper management
│   │   └── questionStore.js  # Question state
│   └── utils/
│       └── api.js           # API integration
├── routes/
│   ├── +layout.svelte      # Root layout
│   ├── +page.svelte       # Landing page
│   ├── login/
│   │   └── +page.svelte
│   ├── register/
│   │   └── +page.svelte
│   └── (protected)/       # Protected routes
│       ├── +layout.svelte
│       ├── create-paper/
│       └── papers/
```

## 🔐 Authentication

Uses JWT-based authentication with token storage in:
- localStorage for persistence
- cookie for SSR support

```javascript
// Example auth configuration
const authConfig = {
  tokenKey: 'token',
  cookieOptions: {
    path: '/',
    maxAge: 86400
  }
};
```

## 🔧 Development Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_BASE_URL=http://13.126.201.63:8000/v1
```

4. Start development server:
```bash
npm run dev
```

## 📡 API Integration

The project uses a proxy configuration for API calls:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/v1': {
        target: 'http://13.126.201.63:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

new deployed url - https://13.232.204.43/docs#/Users/login_v1_login_post 


forms