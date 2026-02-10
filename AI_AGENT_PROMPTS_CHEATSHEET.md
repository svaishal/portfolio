# 🚀 QUICK START: AI Agent Prompts Cheat Sheet

Use these ready-to-go prompts with Copilot, Antigravity, or any AI coding assistant.

---

## 🎯 GETTING STARTED

### 1️⃣ Initial Setup Prompt
```
Create a modern portfolio website with the following structure:

TECH STACK:
- HTML5, CSS3 (with CSS variables), Vanilla JavaScript
- No frameworks or build tools
- Mobile-first responsive design

CREATE THESE FILES:
1. index.html - main page
2. css/variables.css - design tokens (colors, spacing, fonts)
3. css/global.css - base styles and resets
4. css/components.css - reusable component styles
5. js/main.js - interactive features

DESIGN SYSTEM:
Colors:
- Primary: #6366F1 (indigo)
- Accent: #10B981 (green)  
- Black: #000000
- Grays: #F9FAFB to #111827 (50-900 scale)

Typography:
- Font: Inter (from Google Fonts)
- Sizes: 12px to 72px scale
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

Spacing (8px base):
- Use 8px, 16px, 24px, 32px, 48px, 64px, 96px

Start by creating the file structure and the variables.css file.
```

---

## 🧩 COMPONENT PROMPTS

### 2️⃣ Navigation Bar
```
Create a fixed navigation bar with these specs:

DESIGN:
- Fixed position at top
- White background with 80% opacity
- Backdrop blur effect (10px)
- Border bottom: 1px solid light gray
- Height: auto with 16px vertical padding

LAYOUT:
- Container with max-width 1200px
- Flex layout: logo left, menu center, button right
- Logo: 24px text with icon
- Menu items: 16px, medium weight, gray color
- CTA button: primary color, rounded

STATES:
- Default: semi-transparent
- Scrolled (>50px): solid background with shadow
- Menu hover: text color changes to black

RESPONSIVE:
- Desktop: full menu visible
- Mobile (<768px): hamburger menu icon, hide menu items

Include HTML, CSS, and JavaScript for scroll detection.
```

### 3️⃣ Hero Section
```
Create a hero section with this layout:

STRUCTURE:
- Two-column grid (text left, image right)
- Badge at top ("NEW: Portfolio 2025")
- Large headline (72px on desktop, 36px mobile)
- Subheadline (20px, gray color)
- Two CTA buttons (primary + secondary)
- Hero image with rounded corners and shadow

DESIGN DETAILS:
- Gradient text effect on key phrase
- Buttons: 16px padding, 12px border radius
- Generous spacing between elements (24-32px)
- Background: subtle gradient from white to light gray

RESPONSIVE:
- Desktop: 2 columns, 50/50 split
- Tablet: still 2 columns but tighter
- Mobile: stack vertically, image below text

ANIMATIONS:
- Fade in on page load
- Buttons hover: lift up 2px with shadow

Provide complete HTML and CSS.
```

### 4️⃣ Feature Cards Grid
```
Create a feature cards section:

GRID LAYOUT:
- 4 cards in a grid
- Desktop: 2x2 grid
- Tablet: 2x2 grid  
- Mobile: 1 column stack
- Gap between cards: 32px

CARD DESIGN:
- Light gray background (#F9FAFB)
- Padding: 32px
- Border radius: 16px
- Icon at top (64px circle, primary color background)
- Title: 20px, semibold
- Description: 16px, gray, 1.6 line height

HOVER EFFECT:
- Background changes to white
- Card lifts up 4px
- Shadow appears
- Transition: 300ms ease

Include section header above grid:
- Label: "FEATURES" (small, uppercase, primary color)
- Title: "Supercharge your portfolio" (48px, bold)

Give me the HTML structure and CSS.
```

### 5️⃣ Pricing Cards
```
Create pricing section with 3 cards (Starter, Pro, Enterprise):

CARD STRUCTURE:
- Plan name (24px, bold)
- Description (gray text)
- Price (60px number with small currency symbol)
- Feature list (checkmarks, gray text)
- CTA button (full width)

FEATURED CARD (Pro):
- "POPULAR" badge at top
- Highlighted border (primary color)
- Scale up by 5%
- Different button style

RESPONSIVE:
- Desktop: 3 cards in a row
- Tablet: 3 cards (smaller)
- Mobile: stack vertically

EXTRAS:
- Monthly/Yearly toggle switch
- Smooth transitions
- Hover effects on cards

Provide HTML and CSS for all three cards.
```

### 6️⃣ Testimonial Slider
```
Build a testimonial carousel with:

CARD CONTENT:
- 5-star rating display
- Quote text (italic, 18px)
- Avatar image (56px circle)
- Name and title

SLIDER FUNCTIONALITY:
- Show 3 cards on desktop, 1 on mobile
- Auto-advance every 5 seconds
- Navigation dots below
- Smooth slide transition (500ms)

DESIGN:
- Card background: light gray
- Rounded corners: 24px
- Padding: 40px
- Quote in italic style

Include JavaScript for:
- Auto-play functionality
- Dot navigation
- Touch swipe support (optional)

Generate HTML, CSS, and JavaScript.
```

---

## 🎨 STYLING PROMPTS

### 7️⃣ Add Scroll Animations
```
Add scroll-triggered animations using Intersection Observer:

REQUIREMENTS:
- Elements fade in and slide up when visible
- Animation triggers at 10% visibility
- Smooth transition (600ms ease-out)
- Stagger effect for multiple items (100ms delay each)

ELEMENTS TO ANIMATE:
- Section titles
- Feature cards
- Project cards
- Any element with class "animate"

INITIAL STATE:
- opacity: 0
- transform: translateY(30px)

FINAL STATE (when visible):
- opacity: 1
- transform: translateY(0)

Provide JavaScript code and CSS classes.
```

### 8️⃣ Make Fully Responsive
```
Make the entire site responsive with these breakpoints:

BREAKPOINTS:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

ADJUSTMENTS NEEDED:
Mobile:
- Font sizes reduced by ~30%
- Padding: 16px
- Single column layouts
- Stack navigation
- Hide decorative elements

Tablet:
- Font sizes reduced by ~15%
- Padding: 24px
- 2-column grids where applicable

Desktop:
- Full size fonts
- Padding: 32px+
- Multi-column layouts
- All animations enabled

Update all existing CSS with proper media queries.
```

---

## 🔧 FUNCTIONALITY PROMPTS

### 9️⃣ Add Contact Form
```
Create a working contact form with:

FIELDS:
- Name (required)
- Email (required, validated)
- Subject (optional)
- Message (required, textarea)
- Submit button

VALIDATION:
- Check required fields
- Validate email format
- Show error messages in red below fields
- Disable submit until valid

DESIGN:
- Inputs: 48px height, 12px border radius
- Spacing: 16px between fields
- Button: primary color, full width
- Focus state: blue border highlight

SUBMISSION:
- Show loading spinner on button
- Success message after submit
- Clear form after success
- Error handling for failures

Include HTML, CSS, and JavaScript for validation and form handling.
```

### 🔟 Mobile Hamburger Menu
```
Create mobile navigation with hamburger menu:

REQUIREMENTS:
- Hamburger icon (3 lines)
- Animates to X when open
- Full-screen overlay menu
- Smooth slide-in animation (300ms)
- Close on link click or outside click

DESIGN:
- Overlay: full screen, primary color background
- Menu items: large text (24px), centered
- Fade in animation
- Links change color on hover

FUNCTIONALITY:
- Toggle on hamburger click
- Close on link click
- Close on ESC key
- Prevent body scroll when open

Provide HTML, CSS, and JavaScript.
```

---

## 🎯 ADVANCED PROMPTS

### 1️⃣1️⃣ Add Simple Admin Panel
```
Create a basic admin interface for editing content:

STRUCTURE:
admin/
- login.html (password protection)
- dashboard.html (edit interface)
- data/content.json (stores all content)

FEATURES:
- Password-protected login (password: admin123)
- Edit sections: Hero, About, Projects
- Text inputs for all editable content
- Save to JSON file
- Success confirmation message

SECURITY:
- Basic password check (client-side for now)
- Save data via POST request
- Load existing data on page load

Keep it simple - focus on functionality over design.

Include HTML for login and dashboard, plus JavaScript for data handling.
```

### 1️⃣2️⃣ Optimize Performance
```
Optimize the website for performance:

TASKS:
1. Lazy load images below the fold
2. Add loading="lazy" to images
3. Preload critical resources (fonts, hero image)
4. Defer non-critical JavaScript
5. Add blur-up effect for images while loading
6. Minify CSS (combine into one file)

IMAGE OPTIMIZATION:
- Use Intersection Observer for lazy loading
- Add srcset for responsive images
- Convert to WebP format
- Add loading skeleton/placeholder

CRITICAL RESOURCES:
- Preload hero image
- Preload fonts
- Inline critical CSS

Provide updated HTML and JavaScript for optimizations.
```

---

## 💡 DEBUGGING PROMPTS

### When Something Doesn't Work:
```
The [component name] isn't working correctly. Here's what's happening:
[describe the issue]

Current code:
[paste the code]

Expected behavior:
[what should happen]

Please debug and provide the corrected code with explanation.
```

### When You Need to Understand:
```
Explain this code in simple terms:
[paste code]

What does each part do?
How does it work?
Are there better ways to write this?
```

---

## 📋 STEP-BY-STEP BUILD ORDER

**Copy/paste these in order:**

1. ✅ Initial Setup Prompt (#1)
2. ✅ Navigation Bar (#2)
3. ✅ Hero Section (#3)
4. ✅ Feature Cards (#4)
5. ✅ Pricing Cards (#5)
6. ✅ Testimonial Slider (#6)
7. ✅ Contact Form (#9)
8. ✅ Scroll Animations (#7)
9. ✅ Make Responsive (#8)
10. ✅ Mobile Menu (#10)
11. ✅ Admin Panel (#11) - Optional
12. ✅ Optimize (#12)

---

## 🎨 CUSTOMIZATION PROMPTS

### Change Colors:
```
Update the color scheme to:
- Primary: [your color]
- Accent: [your color]
- Replace all instances in the CSS variables file
- Update gradient text effects
```

### Change Fonts:
```
Change the font to [font name] from Google Fonts:
- Update the import link
- Replace font-family in CSS variables
- Adjust any font-specific settings
```

### Add New Section:
```
Add a new section called [section name] with:
- [describe content and layout]
- Match the existing design system
- Use the same spacing and colors
- Make it responsive
```

---

## 💻 TESTING PROMPTS

```
Create a testing checklist for:
- Mobile responsiveness (test at 375px, 768px, 1024px)
- Browser compatibility (Chrome, Firefox, Safari)
- Accessibility (ARIA labels, keyboard navigation)
- Performance (Lighthouse score)
- Form validation
- Link functionality

Provide a markdown checklist I can copy.
```

---

## 🚨 EMERGENCY FIXES

### Site Broken After Changes:
```
My website was working, but after adding [what you added], 
now [what's broken]. Here's the code:
[paste relevant code]

Please help me fix it and explain what went wrong.
```

### Need to Rollback:
```
I want to remove [feature/section] and restore the site 
to how it was before. Here's the current code:
[paste code]

Please provide the cleaned-up version.
```

---

## 📱 MOBILE-SPECIFIC PROMPTS

```
The mobile version has these issues:
1. [issue 1]
2. [issue 2]

Current mobile CSS:
[paste media queries]

Please fix and ensure:
- Text is readable (min 16px)
- Buttons are tappable (min 44px)
- Images don't overflow
- Spacing is appropriate
```

---

## 🎓 LEARNING PROMPTS

```
Teach me about [concept]:
- What is it?
- Why is it important?
- Show me a simple example
- How is it used in modern websites?
- What are the alternatives?
```

---

**Pro Tip:** Save this file and reference specific prompt numbers when talking to AI agents. For example: "Use prompt #3 from my cheat sheet to create the hero section."

Good luck! 🚀
