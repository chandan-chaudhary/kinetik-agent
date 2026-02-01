# Design System Documentation

## Overview

This application uses a comprehensive, reusable design system built with Tailwind CSS and custom tokens. All design configurations are centralized and can be easily customized.

## Configuration Files

### 1. `tailwind.config.ts`

Central Tailwind configuration with extended theme tokens:

- **Workflow Colors**: Custom colors for triggers, actions, conditions, loops
- **Node Colors**: Colors for different node states (initial, processing, terminal)
- **Animations**: Custom keyframes and animation utilities
- **Box Shadows**: Specialized shadows for nodes and cards
- **Custom Spacing**: Additional spacing values beyond Tailwind defaults

### 2. `app/globals.css`

Global styles with CSS custom properties:

- **CSS Variables**: All colors defined as CSS variables for light/dark mode
- **Utility Classes**: Pre-built component classes
- **Custom Scrollbar**: Styled scrollbar matching the theme
- **Layer Utilities**: Workflow-specific utility classes

### 3. `lib/design-system.ts`

Reusable design tokens and helper functions:

```typescript
import {
  getNodeTypeColor,
  getStatusColor,
  utilityClasses,
} from "@/lib/design-system";

// Use in components
const nodeColor = getNodeTypeColor("trigger");
const statusColor = getStatusColor("success");
```

## Color System

### Workflow Colors

```typescript
// Trigger nodes - Green
--workflow-trigger: 142 71% 45% (light) / 142 71% 55% (dark)

// Action nodes - Blue
--workflow-action: 221 83% 53% (light) / 221 83% 63% (dark)

// Condition nodes - Yellow
--workflow-condition: 45 93% 47% (light) / 45 93% 57% (dark)

// Loop nodes - Purple
--workflow-loop: 280 75% 60% (light) / 280 75% 70% (dark)

// Error state - Red
--workflow-error: 0 84% 60% (light) / 0 84% 70% (dark)

// Success state - Green
--workflow-success: 142 71% 45% (light) / 142 71% 55% (dark)
```

### Usage in Components

#### Tailwind Classes

```tsx
<div className="bg-workflow-trigger/10 text-workflow-trigger border-workflow-trigger/30">
  Trigger Node
</div>
```

#### Using the Design System

```tsx
import { nodeTypeColors } from "@/lib/design-system";

<div className={nodeTypeColors.trigger.className}>Trigger Node</div>;
```

## Utility Classes

### Pre-built Workflow Components

```css
/* Workflow node base */
.workflow-node-base
  - Rounded corners, border, shadow
  - Smooth transitions

/* Specific node types */
.workflow-node-trigger
.workflow-node-action
.workflow-node-condition

/* Card hover effect */
.workflow-card
  - Smooth transitions
  - Border color change on hover
  - Shadow elevation

/* Glass morphism */
.glass
  - Semi-transparent background
  - Backdrop blur effect
  - Subtle border
```

### Text Gradients

```tsx
{
  /* Primary gradient */
}
<h1 className="text-gradient-primary">Nodebase</h1>;

{
  /* Workflow rainbow gradient */
}
<h2 className="text-gradient-workflow">Visual Workflows</h2>;
```

### Status Badges

```tsx
import { statusColors } from '@/lib/design-system';

<span className={statusColors.success.className}>
  Success
</span>

<span className={statusColors.error.className}>
  Error
</span>

<span className={statusColors.processing.className}>
  Processing
</span>
```

## Animations

### Available Animations

```typescript
// Fade
animate-fade-in
animate-fade-out

// Scale
animate-scale-in
animate-scale-out

// Slide
animate-slide-in
animate-slide-out

// Pulse
animate-pulse
animate-pulse-fast

// Spin
animate-spin
animate-spin-slow

// Node glow effect
animate-node-glow
```

### Usage

```tsx
<div className="animate-fade-in">
  Fading in...
</div>

<div className="animate-pulse">
  Pulsing...
</div>
```

## Custom Shadows

```css
/* Node shadows */
shadow-node-sm    /* Subtle node shadow */
shadow-node       /* Default node shadow */
shadow-node-lg    /* Large node shadow */
shadow-node-selected  /* Selection ring */

/* Workflow card shadows */
shadow-workflow-card  /* Card shadow */
shadow-workflow-card-hover  /* Card hover shadow */
```

## Spacing & Layout

### Container

```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
  {/* Centered container with responsive padding */}
</div>
```

### Section Spacing

```typescript
import { spacing } from '@/lib/design-system';

<section className={spacing.section}>
  {/* py-8 sm:py-12 lg:py-16 */}
</section>
```

## Responsive Design

All components follow mobile-first responsive design:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>
```

## Dark Mode

Dark mode is fully supported via the `.dark` class:

```tsx
{
  /* Automatically adjusts in dark mode */
}
<div className="bg-card text-card-foreground border-border">
  Content adapts to theme
</div>;
```

All CSS variables automatically switch values in dark mode.

## Component Examples

### Workflow Card

```tsx
<Card className="workflow-card group">
  <CardContent className="p-6">
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-3 group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
        <Workflow className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold">Workflow Name</h3>
        <p className="text-sm text-muted-foreground">Description</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### Status Badge

```tsx
<span className="status-badge status-success">Active</span>
```

### Node Component

```tsx
<div className="workflow-node-trigger workflow-node-selected">
  <div className="p-4">Node Content</div>
</div>
```

## Customization

### Changing Colors

Edit `app/globals.css`:

```css
:root {
  --workflow-trigger: 142 71% 45%; /* Change to your color */
}
```

### Adding New Utilities

Edit `app/globals.css` under `@layer utilities`:

```css
@layer utilities {
  .my-custom-class {
    @apply bg-primary text-primary-foreground rounded-lg;
  }
}
```

### Extending Tailwind

Edit `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        myColor: "hsl(var(--my-color))",
      },
    },
  },
};
```

## Best Practices

1. **Use design tokens** instead of hardcoded values
2. **Import from design-system.ts** for reusable constants
3. **Use utility classes** for common patterns
4. **Follow the naming convention** for consistency
5. **Test in both light and dark mode**
6. **Use semantic color names** (e.g., `workflow-trigger` not `green-500`)

## Browser Support

- Modern browsers with CSS custom properties support
- Backdrop filter support for glass effects
- CSS Grid and Flexbox

## Performance

- Utility classes are purged in production
- CSS variables enable dynamic theming without JavaScript
- Animations use GPU-accelerated properties

## Accessibility

- All colors meet WCAG AA contrast requirements
- Focus states are clearly visible
- Animations respect `prefers-reduced-motion`
- Semantic HTML structure
