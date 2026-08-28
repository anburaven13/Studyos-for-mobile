<div align="center">
  <img src="public/studyos_banner.png" alt="StudyOS Banner" width="100%" style="border-radius: 12px; margin-bottom: 20px;">
  
  <h1 align="center">StudyOS Mobile</h1>
  <p align="center">
    <strong>The ultimate all-in-one productivity operating system for students, now in your pocket.</strong>
    <br />
    <br />
    <a href="https://studyos-snowy.vercel.app" target="_blank"><strong>View Live Web Demo »</strong></a>
    <br />
    <br />
    <a href="#features">Explore Features</a>
    ·
    <a href="#tech-stack">Tech Stack</a>
    ·
    <a href="#getting-started">Getting Started</a>
  </p>

  <p align="center">
    <a href="https://github.com/anburaven13/Studyos-Mobile/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge&color=4F46E5" alt="License"></a>
    <img src="https://img.shields.io/badge/React_Native-Ready-blue?style=for-the-badge&logo=react&logoColor=white&color=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript&logoColor=white&color=3178C6" alt="TypeScript">
    <img src="https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge&logo=google-gemini&logoColor=white&color=FF6B6B" alt="AI Powered">
  </p>
</div>

---

## ⚡ Overview

**StudyOS Mobile** is the companion app to the comprehensive StudyOS student dashboard. It centralizes and supercharges your academic life right from your smartphone. 

Stop switching between five different apps to get your homework done. Welcome to the future of studying. 🚀

<br/>

## ✨ Features

### 🎓 **Smart Dashboard**
Get a powerful, at-a-glance view of your academic day on the go. See your next classes, pending assignments, and a dynamic countdown to your most pressing upcoming exam.

### 📝 **Persistent, Cloud-Synced Notes**
Access your rich-text notes anywhere. Everything syncs instantly with the web dashboard.

### 🧠 **AI Tutor & Flashcard Generator**
StudyOS integrates deeply with **Google's Gemini 3.7 Flash** model.
- **AI Chat:** Get instant explanations directly in your pocket.
- **Vision AI:** Snap photos of your worksheets with your phone camera and get instant AI analysis.
- **Smart Flashcards:** Swipe through flashcards while commuting or waiting in line.

### ⏰ **Planner & Pomodoro Timer**
Stay focused anywhere with the built-in mobile Pomodoro timer.

<br/>

## 🛠 Tech Stack

StudyOS Mobile is built with modern web-to-mobile technologies:

| Category | Technology |
|---|---|
| **Mobile Framework** | Capacitor / React Native / Ionic (depending on build) |
| **Frontend Ecosystem** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend & Database** | Connects to StudyOS Vercel Serverless API |
| **AI Integration** | Google GenAI SDK (Gemini 3.7 Flash) |

<br/>

## 🚀 Getting Started

Follow these instructions to set up StudyOS Mobile locally.

### 1. Prerequisites
- Node.js (v18+)
- Android Studio / iOS SDK for building
- The running backend from the main [StudyOS Repository](https://github.com/anburaven13/Studyos)

### 2. Clone the Repository
```bash
git clone https://github.com/anburaven13/Studyos-Mobile.git
cd "Studyos for mobile"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Build & Run
```bash
npm run dev
# or sync to mobile projects
npx cap sync
```

<br/>

## 🛡️ Security Architecture

- **Server-Side AI Integration:** All AI processing is securely handled by the backend. No API keys are bundled in the mobile app.
- **Secured Endpoints:** Communicates using JWT Bearer tokens securely stored on device.

<br/>

## 📄 License
This project is licensed under the MIT License.
