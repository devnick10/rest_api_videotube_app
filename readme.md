# 🎥 Video Streaming App (Backend) - TypeScript

This is a **TypeScript-powered REST API** for a **Video Streaming App**, providing users with a platform to **upload, watch, and share videos**. Additionally, it includes a **small tweet feature**, allowing users to post short messages and interact with the community.

---

## 🚀 Features

✅ **Video Streaming** – Browse, search, and watch videos uploaded by users.  
✅ **Upload Videos** – Securely upload and manage video content.  
✅ **Community Interaction** – Post tweets, comment on videos, and like/share content.  
✅ **User Authentication** – JWT-based authentication & authorization.  
✅ **Cloud Storage** – Store videos using Cloudinary for optimized performance.  
✅ **Responsive API** – Fully documented REST API supporting frontend integration.  
✅ **Secure & Scalable** – Built with TypeScript for type safety and maintainability.  

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js (with TypeScript)  
- **Database:** MongoDB (Mongoose ORM)  
- **Authentication:** JSON Web Tokens (JWT)  
- **Cloud Storage:** Cloudinary (for video uploads & streaming)  
- **Environment Configuration:** dotenv  

---

## 🔧 Installation & Setup

### 1️⃣ Clone the repository
```sh
git clone <repository-url>
```

### 2️⃣ Navigate to the project directory
```sh
cd backendproject
```

### 3️⃣ Install dependencies
```sh
npm install
```

### 4️⃣ Configure environment variables
Create a `.env` file in the root directory and add the following:
```env
PORT=5000
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
```

### 5️⃣ Start the development server
```sh
npm run dev
```

---

## 📖 API Endpoints

### 🔹 **User Authentication**
- `POST /api/auth/signup` – Register a new user  
- `POST /api/auth/login` – Log in and receive JWT  

### 🔹 **Video Management**
- `GET /api/videos` – Fetch all videos  
- `POST /api/videos/upload` – Upload a new video (authenticated users only)  
- `GET /api/videos/:id` – Fetch a specific video by ID  

### 🔹 **Tweet Feature**
- `POST /api/tweets` – Create a tweet (authenticated users only)  
- `GET /api/tweets` – Fetch all tweets  

---

## 📜 License
This project is licensed under the **MIT License**.

---

## 💡 Contributing
Contributions are welcome! Feel free to fork this repository, create a branch, and submit a pull request.

For any issues or suggestions, open an issue in the repository.

---

## ✨ Contact
📧 **Email:** [bhoyarnikhil683@gmail.com](mailto:bhoyarnikhil683@gmail.com)  
🖥️ **GitHub:** [devnick10](https://github.com/devnick10)  

