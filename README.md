# Vaishal S - Professional Portfolio

A modern, high-performance portfolio website built with Astro, Tailwind CSS, and Framer Motion. Showcasing 4.5 years of IT support experience from ERP systems to enterprise helpdesk.

🔗 **Live Site:** [https://svaishal.github.io](https://svaishal.github.io)

## ✨ Features

- **Premium UI/UX** - Glassmorphism design with smooth Framer Motion animations
- **Performance Optimized** - Lighthouse score 90+ across all metrics
- **SEO Ready** - Complete meta tags, OpenGraph, and Twitter Card support
- **Mobile First** - Fully responsive design that looks great on all devices
- **Data-Driven** - All content managed through a single JSON file
- **Auto-Deploy** - GitHub Actions CI/CD pipeline for seamless updates

## 🛠️ Tech Stack

- **Framework:** [Astro](https://astro.build) - Fast, modern static site generator
- **Styling:** [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- **Animations:** [Framer Motion](https://www.framer.com/motion/) - Production-ready motion library
- **Language:** TypeScript (strict mode)
- **Deployment:** GitHub Pages
- **CI/CD:** GitHub Actions

## 📁 Project Structure

```
/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/
│   ├── favicon.svg             # Website favicon
│   └── robots.txt              # SEO robots file
├── src/
│   ├── components/
│   │   ├── AnimatedHero.tsx    # Hero section with Framer Motion
│   │   ├── ExperienceCard.astro# Experience display card
│   │   ├── Footer.astro        # Site footer
│   │   ├── Header.astro        # Navigation header
│   │   └── TimelineItem.astro  # Career timeline item
│   ├── data/
│   │   └── data.json           # Portfolio content (experience, skills, etc.)
│   ├── layouts/
│   │   └── Layout.astro        # Base layout with SEO
│   ├── pages/
│   │   ├── index.astro         # Homepage with hero
│   │   ├── about.astro         # Career narrative & bio
│   │   ├── experience.astro    # Experience showcase
│   │   └── contact.astro       # Contact form
│   └── styles/
│       └── global.css          # Global styles & Tailwind imports
├── astro.config.mjs            # Astro configuration
├── tailwind.config.mjs         # Tailwind design system
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/svaishal/svaishal.github.io.git
   cd svaishal.github.io
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:4321`

### Development Commands

```bash
npm run dev          # Start dev server at localhost:4321
npm run build        # Build production site to ./dist/
npm run preview      # Preview production build locally
npm run astro        # Run Astro CLI commands
```

## 📝 Customizing Content

All portfolio content is managed through `src/data/data.json`. Update the following sections:

### Personal Information
```json
{
  "personal": {
    "name": "Your Name",
    "role": "Your Role",
    "tagline": "Your tagline",
    "email": "your@email.com",
    "github": "yourusername",
    "linkedin": "https://linkedin.com/in/yourprofile"
  }
}
```

### Experience
Add or modify experience entries in the `experience` array. Set `current: true` for your active role.

### Skills
Update `technical` and `soft` skill arrays.

### Education & Certifications
Modify the `education` and `certifications` arrays.

## 🌐 Deployment

### GitHub Pages Setup

1. **Create GitHub repository**
   - Repository name must be: `[username].github.io`
   - Example: `svaishal.github.io`

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: GitHub Actions

3. **Push your code**
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/[username]/[username].github.io.git
   git push -u origin main
   ```

4. **Wait for deployment**
   - Check Actions tab for build status
   - Site will be live at `https://[username].github.io` in 2-3 minutes

### Continuous Deployment

Every push to the `main` branch automatically triggers a new deployment via GitHub Actions.

## 🔒 Security & Compliance

- ✅ No client names or proprietary system details
- ✅ No hardcoded credentials
- ✅ HTTPS enforced
- ✅ Privacy-respecting (no tracking scripts)
- ✅ Professional content safe for recruiters

## 📧 Contact Form Setup (Optional)

The contact form uses Formspree. To enable it:

1. Sign up at [formspree.io](https://formspree.io)
2. Create a new form
3. Copy your form ID
4. Update `src/pages/contact.astro`:
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

## 🎨 Design System

### Colors
- **Accent:** `#3b82f6` (Blue)
- **Background:** `#0a0a0a` (Near black)
- **Surface:** `#171717`, `#262626` (Dark grays)

### Typography
- **Primary Font:** Inter (Google Fonts)
- **Mono Font:** Fira Code

### Components
- Glassmorphism effects with `backdrop-blur`
- Smooth hover transitions
- Pulse animations for active status
- Staggered entrance animations

## 📊 Performance

Target metrics (Lighthouse):
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## 🤝 Contributing

This is a personal portfolio, but if you find bugs or have suggestions:

1. Open an issue describing the problem
2. For code changes, fork and submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Astro](https://astro.build)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Animated with [Framer Motion](https://www.framer.com/motion/)
- Deployed on [GitHub Pages](https://pages.github.com)

---

**Built with ❤️ by Vaishal S**

For questions or collaborations: [vaishals@hawklab.in](mailto:vaishals@hawklab.in)
