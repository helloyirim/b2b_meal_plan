# B2B Meal Plan Editor - Blueprint

## Overview
This document outlines the design and implementation of the B2B Meal Plan Editor, a web application for managing meal plans for B2B sales teams. The application features user authentication, role-based access control, efficient data entry for meal plans, and comprehensive menu library management. The application now features a dashboard layout with a persistent sidebar navigation and a main content area organized into distinct card sections.

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
- **Layout:** Dashboard layout with a left-aligned sidebar containing primary navigation and a main content area. The main content is organized into independent, card-based sections for "식단 설정", "식단표 그리드", and "메뉴 라이브러리". Modals are used for login and menu registration.
- **Typography:** The base font is set to 'Inter', providing a clean and modern sans-serif style. Headings and text elements use appropriate weights for hierarchy and readability.
- **Color:** A refined palette including a very light grey background (`#f4f7fe`), a dark navy/grey sidebar (`#2c3e50`), white card backgrounds, and blue hues for primary (`#3b82f6`) and secondary (`#60a5fa`) actions, creating a vibrant and energetic look.
- **Texture:** Subtle noise texture on the main background for a premium, tactile feel.
- **Visual Effects:** Soft, multi-layered drop shadows (`0 4px 12px rgba(0, 0, 0, 0.08)`) are applied to cards for depth, and slightly stronger shadows for the sidebar and header.
- **Iconography:** Incorporate icons to enhance understanding and navigation. (Not explicitly added in CSS, but the design accounts for it).
- **Interactivity:** Interactive elements like buttons feature rounded corners (`8px`), blue accent colors, and subtle hover effects (`transform: translateY(-1px);`) for a polished and engaging user experience. Sufficient padding and margin ensure a spacious and clean dashboard feel.

### Features
- **User Authentication & Authorization:** Login/Logout, role-based access (Guest, Admin).
- **Meal Plan Editor:** Dynamic date generation, efficient data entry with keyboard navigation, save/load/reset functionality, project name, week length configuration.
- **Menu Library Management:** Menu registration (Admin only), search and filter options, image placeholder generation.
- **Reporting/Exporting:** Print/PDF meal plan.
- **Accessibility (A11y):** Implement accessibility features for diverse users.

## Plan for Current Change: Recreate Website `https://2eafc56a.b2b-schedule-test.pages.dev/` (Dashboard Layout Implementation & Styling)

### Steps
1.  **Modify `index.html` for Dashboard Layout & Cache Busting:** *Completed.* The `index.html` file has been refactored to implement a dashboard layout. This includes adding a `<div class="dashboard-container">` that holds a `<aside class="sidebar">` for navigation and a `<div class="main-content">` for the primary application area. The previous `app-main` content has been reorganized into card sections (`meal-setting-card`, `meal-grid-card`, `menu-library-card`) within a `<div class="card-layout">`. A cache-busting query parameter (`?v=1.1`) has been added to the `style.css` link to ensure the latest stylesheet is loaded by the browser.
2.  **Modify `style.css` for Dashboard Layout and Aesthetic (with fixes):** *Completed.* The `style.css` has been completely revised to implement the requested aesthetic. To address persistent styling issues (e.g., "연두색 폰트"), `!important` flags were added to the `color` properties of `.app-header h1` and `.card h2` to ensure they correctly apply the intended dark color and primary blue color respectively, overriding any less specific or cached styles. This includes:
    *   Importing 'Inter' font.
    *   Setting a very light grey background (`#f4f7fe`) for the entire page.
    *   Styling the sidebar with a dark navy/grey tone (`#2c3e50`), generous padding, and subtle shadows.
    *   Designing card sections with white backgrounds, rounded corners, and soft box-shadows.
    *   Applying rounded corners (`8px`) to buttons, with blue accent colors for primary actions and hover effects.
    *   Ensuring ample padding and margin throughout the layout for a spacious dashboard feel.
    *   Adjusting existing styles (e.g., `.app-header`, `h2`) for consistency with the new design.
    *   Refining responsive adjustments for various screen sizes, including the sidebar and card layouts.
3.  **Review `main.js` for Compatibility:** *Completed.* `main.js` was reviewed. Since its primary function is modal handling, and the modal elements and their trigger buttons remain in the DOM with their original IDs, no changes were required for `main.js` to function with the new layout.
4.  **Implement Header (Integrated into new layout):** *Completed.* The existing header content was moved into the `main-content` area, retaining its original functionality and appearance within the new layout, with updated styling.
5.  **Implement Meal Plan Section (Integrated into new layout as cards):** *Completed.* The previous `meal-plan-section` content was divided into "식단 설정" and "식단표 그리드" cards within the `card-layout`, maintaining their input fields and controls, with updated styling.
6.  **Implement Menu Library Section (Integrated into new layout as a card):** *Completed.* The previous `menu-library-section` content was transformed into a "메뉴 라이브러리" card within the `card-layout`, preserving its search, filter, and registration functionalities, with updated styling.
7.  **Implement Modals:** *Completed.* The HTML structure for the Login and Menu Registration modals remains unchanged and functions as before, with updated styling for a more modern look (e.g., more padding, rounded corners, softer shadows).
8.  **Add Responsive Design:** *Completed.* Comprehensive responsive adjustments for the dashboard layout have been implemented in `style.css`, ensuring the layout adapts gracefully to different screen sizes, including collapsing the sidebar and stacking cards on smaller viewports.
9.  **Basic Interactivity:** *Completed.* JavaScript event listeners for showing/hiding modals are confirmed to be working correctly with the updated HTML structure.

### Next Steps (Proposed)
- Implement dynamic generation of the meal plan grid based on week length and start date.
- Develop functionality for the menu library, including dynamic loading of menu items, search, and filter.
- Implement actual user authentication logic for the login modal.
- Add features for saving, loading, and resetting the meal plan data.
- Integrate iconography into the sidebar navigation and other UI elements for enhanced visual communication.
- Further refine responsive design for specific breakpoints and elements as needed.
