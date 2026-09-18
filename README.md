# Caleb's Library

> A free, open-source library for students by students. Share notes. Study together. No accounts. No paywalls.

**Caleb's Library** is a community-run digital library designed for students at Bel University to contribute and access a growing collection of study notes, past exams, lecture notes, essays, study guides, and more—completely free and open.

## 🎓 What is Caleb's Library?

Caleb's Library is an open-source project built to solve a simple problem: great study materials should be shared, not hoarded. Started in 2019 as a shared folder between friends, it has grown into a thriving repository of student-created knowledge.

**Key features:**

- **Free & Open** — No accounts required. Read or contribute in just a few clicks.
- **Community-Driven** — Students upload their notes, professors' materials, and study guides. Other students benefit.
- **Organized by Subject** — Browse materials by department (Math, Computer Science, English, etc.) or search across the entire library.
- **Peer Reviewed** — Community moderators ensure quality and appropriateness before content goes live.
- **No Paywalls** — Everything is accessible to anyone, anywhere.
- **Easy to Contribute** — Upload a PDF, add details, submit. A moderator reviews within 24–48 hours.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/mars-shal/CalebsLibrary.git
cd CalebsLibrary

# Install dependencies
npm install
```

### Development

```bash
# Start the dev server
npm run dev
```

The app will open at `http://localhost:5173` (or the port shown in your terminal).

### Build for Production

```bash
# Build and minify
npm run build
```

### Lint & Format

```bash
# Check code quality
npm run lint
```

## 📚 Core Features

### Browse the Library
- Explore papers by subject, type (notes, exams, essays, guides), or year
- Shelf view and grid view to suit your browsing style
- Filter by subject and paper type

### Search
- Full-text search across titles and descriptions
- Filter by subject, type, year, and more
- Sort by relevance, newest, most upvoted, or most downloaded

### Upload Your Work
- **No signup required** — just provide your name and email each time you contribute
- Supported formats: PDF, DOCX, PPTX, images
- Add metadata: title, subject, course, professor, semester
- Choose a license (CC BY-NC 4.0 recommended)
- Community moderators review submissions within 24–48 hours

### Contribute & Engage
- Upvote papers you found helpful
- Save favorite papers to a personal list
- Discuss papers and leave comments
- View contributor profiles and their collections

### Moderation
- Passphrase-gated review queue for trusted moderators
- Check for plagiarism, AI-generated content, and duplicates
- Accept, request changes, or reject submissions

## 🛠 Tech Stack

The project is built with modern, beginner-friendly technologies:

- **Frontend:** Vue 3 + Vite for a fast development experience
- **Styling:** CSS (design tokens system for consistency) + Tailwind
- **Scripting:** TypeScript (+ Zod-shared schemas with the backend)
- **Backend:** Convex (database, server functions, crons) synced from Google Drive
- **State:** Pinia stores + localStorage persistence (bookmarks, votes, theme)
- **Mobile:** Expo + React Native app in `mobile/` sharing the same Convex backend

## 📖 Project Structure

```
CalebsLibrary/
├── src/                # Web app (Vue 3 + Vite)
│   ├── components/     # Reusable Vue components
│   ├── views/          # Page components (Home, Browse, Search, etc.)
│   ├── stores/         # Pinia stores (catalogue, metrics overlay)
│   ├── schema/         # Shared Zod catalogue schema
│   ├── composables/    # Shared logic (search autocomplete)
│   ├── script/         # Design data, Convex client, trends
│   ├── assets/         # Tokens, styles, icons
│   ├── App.vue         # Root component
│   ├── main.ts         # Entry point
│   └── router/         # 11 routes
├── convex/             # Backend (tables, sync, moderation, trends, links)
├── mobile/             # Expo + React Native app (same backend)
├── shared/             # Framework-free shared core
├── design_handoff_calebs_library/  # Design reference and specifications
├── public/             # Static files
├── vite.config.ts      # Build configuration
├── package.json
└── README.md           # This file
```

## 🎨 Design & UX

The app is designed around simplicity and accessibility:

- **Search-first landing** — Get to studying immediately
- **No friction** — Contribute without creating an account
- **Visual hierarchy** — Find what you need quickly
- **Responsive design** — Works on desktop, tablet, and mobile

See the full design specification in `design_handoff_calebs_library/README.md`.

## 👥 Contributing

We'd love your help! Whether you're a developer, designer, or student, there are many ways to contribute:

### For Developers
- Fork the repository
- Create a feature branch (`git checkout -b feature/your-feature`)
- Make your changes and test thoroughly
- Submit a pull request with a clear description

### For Students
- **Share your notes** — Upload study materials directly through the app
- **Improve content** — Suggest corrections or additions to existing papers
- **Contribute translations** — Help make materials accessible in other languages
- **Report bugs** — Found an issue? Let us know in the Issues tab

### For Everyone
- **Spread the word** — Tell your classmates about the library
- **Provide feedback** — Help us improve the experience

## 📋 Code of Conduct

Caleb's Library is a welcoming, inclusive community. We expect all contributors to:

- Respect others' intellectual property
- Ensure materials are original work or properly licensed
- Provide constructive feedback
- Report inappropriate content to moderators

## 📝 License

This project and all contributed materials are shared under the **Creative Commons Attribution-NonCommercial 4.0 International License** (CC BY-NC 4.0). This means:

- ✅ You can read, share, and adapt materials
- ❌ Not for commercial use
- ✅ Must credit the original author
- ❌ Cannot sell materials without explicit permission

Individual papers may have different licenses—check each paper's details.

## 🤝 Moderators

Moderation is handled by trusted community members behind a rotating passphrase. Interested in becoming a moderator? Reach out to an existing moderator or open an issue with your interest.

## 🐛 Reporting Issues

Found a bug or have a feature request? Please open an issue with:

- A clear title and description
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Your environment (browser, OS, etc.)

## 💬 Questions?

- Check the **About** page in the app for FAQs
- Open a **Discussion** in this repository
- Contact the Caleb's Library team

## 🎉 Acknowledgments

**Caleb's Library** was founded by Caleb H. in 2019 and is maintained by students and volunteers who believe in open access to education. Every contributor—from note-takers to moderators—makes this project possible.

---

**Ready to contribute?** [Start uploading](https://github.com/mars-shal/CalebsLibrary) or [browse the library](https://github.com/mars-shal/CalebsLibrary).

Made with care. Kept alive by contributors. 📚
