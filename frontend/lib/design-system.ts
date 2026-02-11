/**
 * Design System Configuration
 * Centralized design tokens and utilities for consistent UI across the application
 */

// Workflow Node Type Colors
export const nodeTypeColors = {
  trigger: {
    light: "hsl(142, 71%, 45%)",
    dark: "hsl(142, 71%, 55%)",
    className:
      "text-workflow-trigger bg-workflow-trigger/10 border-workflow-trigger/30",
  },
  action: {
    light: "hsl(221, 83%, 53%)",
    dark: "hsl(221, 83%, 63%)",
    className:
      "text-workflow-action bg-workflow-action/10 border-workflow-action/30",
  },
  condition: {
    light: "hsl(45, 93%, 47%)",
    dark: "hsl(45, 93%, 57%)",
    className:
      "text-workflow-condition bg-workflow-condition/10 border-workflow-condition/30",
  },
  loop: {
    light: "hsl(280, 75%, 60%)",
    dark: "hsl(280, 75%, 70%)",
    className: "text-workflow-loop bg-workflow-loop/10 border-workflow-loop/30",
  },
  initial: {
    light: "hsl(142, 71%, 45%)",
    dark: "hsl(142, 71%, 55%)",
    className: "text-node-initial bg-node-initial/10 border-node-initial/30",
  },
  processing: {
    light: "hsl(221, 83%, 53%)",
    dark: "hsl(221, 83%, 63%)",
    className:
      "text-node-processing bg-node-processing/10 border-node-processing/30",
  },
  terminal: {
    light: "hsl(280, 75%, 60%)",
    dark: "hsl(280, 75%, 70%)",
    className: "text-node-terminal bg-node-terminal/10 border-node-terminal/30",
  },
} as const;

// Status Colors
export const statusColors = {
  success: {
    className:
      "bg-workflow-success/10 text-workflow-success border-workflow-success/30",
    iconClassName: "text-workflow-success",
  },
  error: {
    className:
      "bg-workflow-error/10 text-workflow-error border-workflow-error/30",
    iconClassName: "text-workflow-error",
  },
  processing: {
    className:
      "bg-workflow-action/10 text-workflow-action border-workflow-action/30",
    iconClassName: "text-workflow-action",
  },
  pending: {
    className: "bg-muted text-muted-foreground border-border",
    iconClassName: "text-muted-foreground",
  },
} as const;

// Component Variants
export const cardVariants = {
  default: "bg-card border-border hover:border-primary/30",
  workflow: "workflow-card",
  elevated: "shadow-workflow-card hover:shadow-workflow-card-hover",
  glass: "glass",
} as const;

export const buttonVariants = {
  workflow: {
    trigger: "bg-workflow-trigger hover:bg-workflow-trigger/90 text-white",
    action: "bg-workflow-action hover:bg-workflow-action/90 text-white",
    condition:
      "bg-workflow-condition hover:bg-workflow-condition/90 text-white",
  },
} as const;

// Spacing & Sizing
export const spacing = {
  section: "py-8 sm:py-12 lg:py-16",
  container: "container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl",
  cardPadding: "p-6",
  cardPaddingLg: "p-8",
} as const;

// Animation Durations
export const durations = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
} as const;

// Border Radius
export const radius = {
  sm: "calc(var(--radius) - 4px)",
  md: "calc(var(--radius) - 2px)",
  lg: "var(--radius)",
  xl: "calc(var(--radius) + 4px)",
  "2xl": "calc(var(--radius) + 8px)",
} as const;

// Helper Functions
export const getNodeTypeColor = (type: keyof typeof nodeTypeColors) => {
  return nodeTypeColors[type] || nodeTypeColors.action;
};

export const getStatusColor = (status: keyof typeof statusColors) => {
  return statusColors[status] || statusColors.pending;
};

// Utility Classes
export const utilityClasses = {
  // Focus states
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",

  // Transitions
  transition: "transition-all duration-200",
  transitionFast: "transition-all duration-150",
  transitionSlow: "transition-all duration-300",

  // Text
  textGradientPrimary:
    "bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent",
  textGradientWorkflow:
    "bg-gradient-to-r from-workflow-trigger via-workflow-action to-workflow-loop bg-clip-text text-transparent",

  // Loading
  skeleton: "animate-pulse bg-muted rounded",
  spinner:
    "animate-spin rounded-full border-2 border-current border-t-transparent",

  // Hover effects
  hoverLift: "hover:scale-[1.02] transition-transform duration-200",
  hoverGlow: "hover:shadow-lg transition-shadow duration-200",
} as const;

// Responsive Breakpoints (matches Tailwind defaults)
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Z-Index Layers
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  max: 100,
} as const;

const designSystem = {
  nodeTypeColors,
  statusColors,
  cardVariants,
  buttonVariants,
  spacing,
  durations,
  radius,
  getNodeTypeColor,
  getStatusColor,
  utilityClasses,
  breakpoints,
  zIndex,
};

export default designSystem;
