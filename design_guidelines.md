# Design Guidelines: 결과물 제출 페이지 (Result Submission Platform)

## Design Approach

**Selected Approach**: Reference-Based Design inspired by creative portfolio platforms (Dribbble, Behance, Pinterest)

**Core Principles**:
- Content-first design: User-generated creative work takes center stage
- Clean, gallery-like presentation with breathing room
- Subtle interactions that enhance without distracting
- Dark mode support for reduced eye strain during browsing

## Color Palette

**Dark Mode (Primary)**:
- Background: 217 33% 7% (deep navy-black)
- Surface: 217 28% 12% (elevated cards)
- Surface Hover: 217 25% 16% (card hover state)
- Border: 217 20% 20% (subtle dividers)
- Primary: 217 91% 60% (vibrant blue for CTAs)
- Primary Hover: 217 91% 55%
- Text Primary: 0 0% 98%
- Text Secondary: 217 15% 70%
- Accent (Hearts): 0 84% 60% (warm red)

**Light Mode**:
- Background: 0 0% 100%
- Surface: 0 0% 98%
- Border: 217 20% 90%
- Primary: 217 91% 50%
- Text Primary: 217 33% 7%
- Text Secondary: 217 15% 45%

## Typography

**Font Stack**:
- Primary: 'Inter' (Google Fonts) - clean, modern sans-serif for UI
- Secondary: 'Noto Sans KR' (Google Fonts) - Korean language support

**Type Scale**:
- Hero/Display: text-4xl font-bold (36px)
- Page Title: text-3xl font-semibold (30px)
- Card Title: text-lg font-semibold (18px)
- Body: text-base (16px)
- Caption/Meta: text-sm (14px)
- Tiny: text-xs (12px)

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16, 24 for consistency
- Component padding: p-4, p-6, p-8
- Section gaps: gap-6, gap-8
- Vertical rhythm: space-y-6, space-y-8

**Grid System**:
- Desktop (lg): 4 columns `grid-cols-4 gap-6`
- Tablet (md): 3 columns `grid-cols-3 gap-4`
- Mobile: 2 columns `grid-cols-2 gap-3`
- Container: `max-w-7xl mx-auto px-4 lg:px-8`

## Component Library

### Navigation Header
- Height: h-16
- Sticky positioning: `sticky top-0 z-50`
- Backdrop blur: `backdrop-blur-md bg-background/80`
- Layout: Flexbox with space-between
- Left: Logo/brand
- Right: Sort dropdown, Write button (primary), Profile avatar/Login

### Post Cards (Grid Items)
- Aspect ratio: `aspect-[4/3]` for image
- Border radius: `rounded-xl`
- Shadow: `shadow-sm hover:shadow-xl transition-all duration-300`
- Hover scale: `hover:scale-[1.02]`
- Structure:
  - Image (full bleed at top)
  - Content area with p-4
  - Title (truncate to 1 line)
  - Author with avatar (text-sm)
  - Content preview (2 lines, truncate)
  - Footer: Hearts and Comments count

### Modal (Post Detail)
- Overlay: `bg-black/70 backdrop-blur-sm`
- Modal container: `max-w-4xl w-full mx-auto`
- Layout: Split design
  - Left 60%: Image (full height)
  - Right 40%: Content scroll area
- Close button: Top-right with backdrop blur circle
- Action buttons (Edit/Delete): Bottom of content area

### Buttons
- Primary CTA: `bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-medium`
- Secondary: `border border-border hover:bg-surface text-foreground px-6 py-2.5 rounded-lg`
- Icon buttons: `p-2 rounded-full hover:bg-surface`
- Heart button: Filled red when active, outline when inactive

### Form Elements (Write Post)
- Input fields: `border border-border rounded-lg px-4 py-3 bg-surface focus:ring-2 focus:ring-primary`
- Textarea: Same styling, `min-h-[200px]`
- Image upload: Drag-drop zone with dashed border, `rounded-xl border-2 border-dashed`
- Preview: Show uploaded image with remove button overlay

### Comments Section
- List layout with space-y-4
- Each comment: Flexbox with avatar left, content right
- Comment input: At bottom, sticky position
- Own comments: Edit/delete icons on hover

### Profile Dropdown
- Trigger: Avatar image `rounded-full w-10 h-10`
- Menu: `rounded-lg shadow-lg border border-border p-2 min-w-[200px]`
- Items: `px-4 py-2 rounded-md hover:bg-surface`

## Animations

**Purposeful Motion Only**:
- Card hover: Scale transform + shadow (300ms ease)
- Modal: Fade in overlay + slide up content (200ms ease)
- Dropdown: Fade + slide down (150ms ease)
- Heart animation: Quick scale pulse when clicked
- NO page transitions, NO scroll animations, NO loading spinners beyond essential states

## Images

**Hero Section**: None - This is a utility app, not a marketing page
**Post Images**: 
- User-uploaded creative work as primary visual content
- Aspect ratio maintained, object-fit cover
- Lazy loading for performance
- Placeholder: Subtle gradient background while loading

**Image Specifications**:
- Card thumbnails: Optimized to max 800px width
- Modal view: Original resolution, max 1200px
- Upload limits: Max 5MB per image
- Supported formats: JPG, PNG, WebP

## Accessibility & Dark Mode

- Maintain WCAG AA contrast ratios minimum
- Focus states: `focus:ring-2 focus:ring-primary focus:outline-none`
- Dark mode consistently applied across all components including forms, modals, dropdowns
- No pure black backgrounds - use deep navy tones for reduced eye strain
- Interactive elements minimum 44px touch target

## Unique Design Details

**Korean Language Considerations**:
- Ensure Noto Sans KR loads for proper Hangul rendering
- Line-height slightly increased for mixed content: `leading-relaxed`

**Grid Masonry Effect**:
- Consider CSS Grid auto-flow dense for tighter packing
- Variable card heights based on content length

**Interaction Polish**:
- Heart button: Slight bounce on click with scale animation
- Image zoom in modal: Allow click to expand full screen
- Smooth skeleton loading for grid items on initial load