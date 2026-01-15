# Echo Archive

**Echo Archive** is a web application that allows users to record, store, and analyze voice memos. The platform combines **in-browser audio capture**, **real-time speech processing**, and **longitudinal sentiment visualization**, providing a comprehensive tool for personal or research use.

---

## Table of Contents

1. [About](#about)
2. [Core Capabilities](#core-capabilities)
   - [Voice Recording](#voice-recording)
   - [Real-Time Processing](#real-time-processing)
   - [Memo Management](#memo-management)
   - [Analytics & Visualization](#analytics--visualization)
   - [User Experience & UI](#user-experience--ui)
3. [Project Structure](#project-structure)
4. [Screenshots](#screenshots)
5. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Development](#development)
   - [Build](#build)
6. [Usage](#usage)
7. [Configuration](#configuration)
8. [License](#license)

---

## About

Echo Archive provides a **streamlined workflow for capturing and analyzing voice data**.  
It is built with **React** and **Vite**, offering a responsive frontend with modular components for easy extension.  
The system is ideal for tracking mood, sentiment, or other vocal patterns over time.  

---

## Core Capabilities

### Voice Recording

- Record audio directly in the browser.  
- Immediate waveform preview during recording.  
- Controls: **start**, **pause**, **stop**.

### Real-Time Processing

- Live transcription using a speech-to-text engine.  
- Instant sentiment analysis to classify emotional tone.  
- Optional display of confidence scores or word timing.

### Memo Management

Store and manage voice memos with:

- Audio file  
- Transcript  
- Sentiment metadata  
- Timestamp  

Full CRUD operations:

- Replay recordings  
- View transcript and sentiment  
- Edit metadata (optional)  
- Delete or archive entries  

### Analytics & Visualization

- Interactive graphs visualizing sentiment trends over time.  
- Time-scale filters: **daily**, **weekly**, **monthly**, **yearly**.  
- Mood gradient mapping (negative → neutral → positive).  
- Memo markers on the timeline linking back to entries.

### User Experience & UI

- Minimal recording interface with real-time transcription feed.  
- Dashboard for recent recordings.  
- Visualization page with charts and sentiment overlays.

---

## Project Structure

```

/
├─ public/                  # Static assets (HTML, images, icons)
├─ src/                     # Source code (React components, pages)
├─ .env.local               # Environment variables
├─ package.json             # Project dependencies and scripts
├─ vite.config.js           # Vite build configuration
├─ eslint.config.js         # Linting rules
└─ README.md                # Project documentation

```

---

## Screenshots
<img width="932" height="689" alt="Echo Archive Home" src="https://github.com/user-attachments/assets/9d0903e4-5b38-44fe-a7d6-4a586323124b" />
<br />
- The initial landing page of the application. All relevant information about the app can be found here.
<br />
<br />
<img width="939" height="462" alt="Echo Archive Record" src="https://github.com/user-attachments/assets/a53465e2-83b3-4587-9239-9e4bdc09ca33" />
<br />
- The record page allows the user to record voice memos in the local session and then save them to the server.
<br />
<br />
<img width="939" height="462" alt="Echo Archive Archive" src="https://github.com/user-attachments/assets/e1ee64a0-5443-418c-a3dd-cafad8b7f1a3" />
<br />
- The archive page pulls all the available recordings from the server and displays them here. They are also available for playback and review.
<br />
<br />
<img width="932" height="625" alt="Echo Archive Timeline" src="https://github.com/user-attachments/assets/99e80a5e-69a9-4d3e-aa92-b2173fe53e41" />
<br />
- The timeline page graphs the relationship between different memos' sentiment and duration to better visualize the memos over time.
<br />
<br />


---

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)  
- npm

---

### Installation

Clone the repository:

```bash
git clone https://github.com/mhmdbakkour/echoarchive.git
cd echoarchive
````

Install dependencies:

```bash
npm install
```

---

### Development

Start the development server with hot reload:

```bash
npm run dev
```

Open your browser at the URL displayed in the terminal (usually `http://localhost:3000`).

---

### Build

Generate a production-ready build:

```bash
npm run build
```

The output is located in the `dist/` directory.

---

## Usage

Once the server is running or the build is deployed:

* Record, review, and manage voice memos.
* View real-time transcription and sentiment.
* Explore analytics and visualize sentiment trends over time.

The interface is designed to be **intuitive and responsive** for personal or professional use.

---

## Configuration

* **Environment Variables**: `.env.local` can override runtime or build settings. Keep sensitive information out of version control.
* **Linting**: ESLint is configured. Auto-fix issues with:

```bash
npm run lint
```

---

## License

This project is licensed under the MIT License.
