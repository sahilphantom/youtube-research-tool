# YouTube Research Tool Backend

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables:**
   - Copy `.env.example` to `.env` and add your YouTube Data API key.
   - Example:
     ```env
     YOUTUBE_API_KEY=your_youtube_api_key_here
     PORT=5000
     ```

3. **Run the server:**
   ```bash
   npm start
   ```

4. **Test the server:**
   - Visit [http://localhost:5000/api/health](http://localhost:5000/api/health) to check if the backend is running. 