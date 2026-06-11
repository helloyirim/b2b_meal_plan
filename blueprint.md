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
- **Day Selection:** Ability to choose specific days of the week (Mon-Sun) to display in the meal plan grid.
- **Menu Library Management:** Menu registration (Admin only), search and filter options, image placeholder generation.
- **Group Delivery Calendar:** Monthly delivery schedule management, KPI dashboard (total quantity, sales), data entry modal, and color-coded event bars.
- **Reporting/Exporting:** Print/PDF meal plan.

## Plan for Current Change: Implement Group Delivery Calendar

### Steps

1.  **Implement Calendar UI:** Added a dashboard layout for the group calendar with monthly navigation and KPI summaries.
2.  **Develop Calendar Logic:** Implemented grid generation for monthly views, event placement logic (lanes), and date normalization.
3.  **Integrate API:** Added functions for fetching, saving, and deleting delivery events from the backend server.
4.  **Add Data Entry Modal:** Created a comprehensive form for entering event details (date, company, quantity, price, etc.) with automatic sales calculation.
5.  **Update Documentation:** Updated `blueprint.md` to reflect the new functionality.
6.  **Commit and Push:** Stage changes and push to the remote repository.

### Next Steps (Proposed)

- Implement dynamic generation of the meal plan grid based on week length and start date.
- Develop functionality for the menu library, including dynamic loading of menu items, search, and filter.
- Implement actual user authentication logic for the login modal.
- Add features for saving, loading, and resetting the meal plan data.
- Integrate iconography into the sidebar navigation and other UI elements for enhanced visual communication.
- Further refine responsive design for specific breakpoints and elements as needed.
