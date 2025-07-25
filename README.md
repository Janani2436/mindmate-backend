🧠 MindMate Backend

  -This is the Node.js/Express backend for the MindMate emotional support chatbot.
  -It now delivers real-time emotional well-being support with several important enhancements and integrations, all built for a seamless, secure, and multilingual user experience.

🌐 Live API

  🔗 https://mindmate-backend-6m2j.onrender.com

✨ Features

  -JWT-based authentication: Secure register/login and user sessions.
  -AI-driven emotional support chat: Integrate OpenRouter API for natural, empathetic responses.
  -Emotion detection from user input: Analyzes messages in real time to provide mood-based guidance.
  -Multilingual support through LibreTranslate: Real-time message translation, now supporting both Hindi and English easily.
  -MongoDB chat and mood history: Saves all chats and mood information for each user.
  -RESTful API organization: Organized, modular endpoints for scalability.
  -Session summaries: Creates and saves post-chat summaries with wellness resources.
  -Role-based access: Separation between peer support and admin capabilities.
  -API for chat analytics: Exposes endpoint(s) for basic analytics (e.g., counts by emotion or session recency).
  -Rate limiting & security hardening: Stops abuse with reasonable API throttling.
  -User feedback endpoint: Stores and accepts feedback for continuous service improvement.

⚡️ Recent Enhancements

  -Enhanced Hindi translation: Quicker, more trustworthy LibreTranslate processing.
  -Session summary generator: Users are provided with a summary at the end of each chat along with useful resources.
  -Role support: API identifies and protects routes for user, peer supporter, and administrator.
  -API analytics endpoints: To visualize mood trends and usage for team dashboards/monitoring.
  -General security improvements: Implemented CORS, helmet integration, enhanced input validation, and improved .env example.

⚙️ Tech Stack

  -Node.js (18.x+ is recommended)
  -Express.js
  -MongoDB & Mongoose for schema-based storage
  -JWT authentication (with refresh tokens)
  -OpenRouter (LLM API integration)
  -LibreTranslate API
  -CORS, Helmet, and Express-rate-limit for security

📦 Getting Started

-bash

  -Clone the repository
    git clone https://github.com/Janani2436mindmate-backend.git
    cd mindmate-backend
  -Install dependencies
    npm install
    Create a .env file from the example
    cp .env.example .env
  -(Insert keys for MongoDB, JWT, OpenRouter,    LibreTranslate, etc.)
  -Start the development server
    npm start

🧩 Contributing

  -Pull requests are accepted! Please open an issue for significant changes.
  -Follow code style in place and commit with clear messages.

📝 License

  -Distributed under the MIT License.