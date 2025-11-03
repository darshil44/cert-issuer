# 🎓 Certificate Generator API

A simple Node.js app that creates beautiful certificates (PDF + JPG), uploads them to Supabase, and sends them to users via email using SendGrid.

---

## 🚀 Features
- Generate elegant pastel certificates in **PDF** and **JPG**
- Automatically send certificates via **email**
- Upload and store certificates on **Supabase**
- Simple REST API endpoint
- Built with Express, Puppeteer, SendGrid & Supabase

---

## 📁 Folder Structure
```
certificate-generator/
├── server.js
├── routes/
├── controllers/
├── services/
├── middlewares/
├── templates/
└── config/
```

---

## ⚙️ Setup

### 1️⃣ Install dependencies
```bash
npm install
```

### 2️⃣ Create `.env` file
```bash
PORT=3000
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_KEY
SUPABASE_BUCKET=certificates

SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
SENDER_EMAIL=your_verified_email@example.com
SENDER_NAME=Aksharkala Certificates

PUPPETEER_HEADLESS=true
```

### 3️⃣ Start the server
```bash
npm run dev
```

Server will start on:
```
http://localhost:3000
```

---

## 🧠 API Endpoint

### **POST** `/api/v1/certificates/generate`

**Body Example**
```json
{
  "name": "Darshil Dobariya",
  "email": "darshil@example.com",
  "gstNumber": "22AAAAA0000A1Z5",
  "businessName": "Aksharkala Pvt Ltd",
  "businessAddress": "Ahmedabad, Gujarat"
}
```

**Response Example**
```json
{
  "success": true,
  "data": {
    "emailSent": true,
    "pdfUrl": "https://supabase.io/storage/v1/object/public/certificates/Darshil.pdf",
    "imageUrl": "https://supabase.io/storage/v1/object/public/certificates/Darshil.jpg"
  }
}
```

---

## ✅ Notes
- Certificates are generated using **EJS templates + Puppeteer**
- Both PDF and JPG are uploaded to **Supabase**
- Email is sent via **SendGrid**
- Works with any verified SendGrid sender address

---

## 🧑‍💻 Author
**Darshil Dobariya**  
_Aksharkala Certificate Generator_

---

> “Generate certificates with simplicity and elegance.”
