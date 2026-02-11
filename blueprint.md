# B2B Meal Plan Editor - Blueprint

## Overview
This document outlines the design and implementation of the B2B Meal Plan Editor, a web application for managing meal plans for B2B sales teams. The application features user authentication, role-based access control, efficient data entry for meal plans, and comprehensive menu library management.

## Project Outline

### Initial Version (Current State)
- **Files:** `index.html`, `style.css`, `main.js`, `.gitignore`, `GEMINI.md`, `README.md`, `firebase-debug.log`, `.idx/dev.nix`, `.idx/mcp.json`, `.vscode/settings.json`
- **Git Integration:** Local repository connected to `https://github.com/helloyirim/b2b_meal_plan.git` with `.gitignore` configured.

### Style, Design, and Features

#### Aesthetic Goals
- Build beautiful and intuitive user interfaces that follow modern design guidelines.
- Ensure the app is mobile responsive and adapts to different screen sizes.
- Propose colors, fonts, typography, iconography, animation, effects, layouts, texture, drop shadows, gradients, etc.
- Use modern, interactive iconography, images, and UI components like buttons, text fields, animation, effects, gestures, sliders, carousels, navigation, etc.

#### Core Design Principles
- **Layout:** Clear organization with distinct sections for the meal plan editor and menu library. Modals for login and menu registration.
- **Typography:** Expressive and relevant typography with emphasis on hero text, section headlines, and list headlines.
- **Color:** A wide range of color concentrations and hues to create a vibrant and energetic look and feel.
- **Texture:** Subtle noise texture on the main background for a premium, tactile feel.
- **Visual Effects:** Multi-layered drop shadows for depth, soft deep shadows for cards.
- **Iconography:** Incorporate icons to enhance understanding and navigation.
- **Interactivity:** Interactive elements (buttons, checkboxes, sliders) with shadow and color "glow" effects.

### Features
- **User Authentication & Authorization:** Login/Logout, role-based access (Guest, Admin).
- **Meal Plan Editor:** Dynamic date generation, efficient data entry with keyboard navigation, save/load/reset functionality, project name, week length configuration.
- **Menu Library Management:** Menu registration (Admin only), search and filter options, image placeholder generation.
- **Reporting/Exporting:** Print/PDF meal plan.
- **Accessibility (A11y):** Implement accessibility features for diverse users.

## Plan for Current Change: Recreate Website `https://2eafc56a.b2b-schedule-test.pages.dev/`

### Steps
1.  **Modify `index.html`:** *Completed.* Created the basic HTML layout, including a header, main content area (for meal plan and menu library), and placeholders for modals.
2.  **Modify `style.css`:** *Completed.* Added basic styling for layout, typography, and a modern aesthetic, based on the analysis of the target website.
3.  **Modify `main.js`:** *Completed.* Initialized a basic JavaScript file for interactivity, event listeners to show/hide modals.
4.  **Implement Header:** *Completed.* Created the header section with the title, user role, and global actions (Login, Logout, Print/PDF).
5.  **Implement Meal Plan Section:** *Completed.* Designed the layout for the meal plan editor, including action buttons, configuration section, and the interactive grid placeholder.
6.  **Implement Menu Library Section:** *Completed.* Designed the layout for the menu library, including action buttons, search, and filter options.
7.  **Implement Modals:** *Completed.* Created the HTML structure for the Login and Menu Registration modals, initially hidden, and added JS to control their visibility.
8.  **Add Responsive Design:** *Partially Completed.* Basic responsive adjustments added in CSS. Further refinement may be needed.
9.  **Basic Interactivity:** *Completed.* Added JavaScript to handle simple UI interactions like showing/hiding modals.

### Next Steps (Proposed)
- Implement dynamic generation of the meal plan grid based on week length and start date.
- Develop functionality for the menu library, including dynamic loading of menu items, search, and filter.
- Implement actual user authentication logic for the login modal.
- Add features for saving, loading, and resetting the meal plan data.
- Refine responsive design and add more detailed styling.
