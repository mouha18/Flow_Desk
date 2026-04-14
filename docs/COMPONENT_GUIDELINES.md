# FlowDesk Component Guidelines

This document outlines the patterns and best practices for building UI components in FlowDesk.

## Table of Contents

- [Design System Constants](#design-system-constants)
- [Typography](#typography)
- [Spacing](#spacing)
- [Colors](#colors)
- [Component Patterns](#component-patterns)
- [Loading/Error/Empty States](#loadingerrorempty-states)
- [Navigation Routes](#navigation-routes)

---

## Design System Constants

All design tokens are centralized in `src/constants/`:

| File | Purpose |
|------|---------|
| `colors.ts` | Color palette including semantic and role colors |
| `typography.ts` | Font sizes, weights, and line heights |
| `spacing.ts` | Spacing scale, border radius, and shadows |

### Import Pattern

```typescript
import { colors } from "@/constants/colors";
import { fontSizes, fontWeights } from "@/constants/typography";
import { spacing, borderRadius, shadows } from "@/constants/spacing";
```

---

## Typography

FlowDesk provides two typography components:

### Heading

Use for page titles and section headers.

```typescript
import { Heading } from "@/components/ui";

// Levels: h1, h2, h3, h4
<Heading level="h2">Section Title</Heading>
<Heading level="h3" color={colors.gray500}>Subtitle</Heading>
```

| Level | Font Size | Weight | Use Case |
|-------|-----------|--------|----------|
| h1 | 30px | Bold | Page titles |
| h2 | 24px | Bold | Section titles |
| h3 | 20px | Semibold | Card headers |
| h4 | 18px | Semibold | Subsection titles |

### Typography

Use for body text and labels.

```typescript
import { Typography } from "@/components/ui";

// Variants: body, bodySmall, caption, label
<Typography variant="body">Paragraph text</Typography>
<Typography variant="caption" color={colors.gray500}>Helper text</Typography>
<Typography variant="label">Form label</Typography>
```

| Variant | Font Size | Weight | Use Case |
|---------|-----------|--------|----------|
| body | 16px | Regular | Paragraphs |
| bodySmall | 14px | Regular | Secondary text |
| caption | 12px | Regular | Timestamps, metadata |
| label | 14px | Medium | Form labels, badges |

---

## Spacing

Use the spacing scale for consistent padding and margins:

```typescript
import { spacing } from "@/constants/spacing";

// Scale: 0, 1(4px), 2(8px), 3(12px), 4(16px), 5(20px), 6(24px), 8(32px), 10(40px), 12(48px), 16(64px)
<View style={{ padding: spacing[4] }} />
```

### Border Radius

```typescript
// Values: none, sm(4), md(8), lg(12), xl(16), 2xl(24), full(9999)
<View style={{ borderRadius: borderRadius.lg }} />
```

### Shadows

```typescript
// Levels: sm, md, lg
<View style={shadows.md} />
```

---

## Colors

### Color Categories

| Category | Colors | Use Case |
|----------|--------|----------|
| Primary | `primary`, `primaryLight`, `primaryDark` | Main actions, links |
| Secondary | `secondary` | Secondary actions |
| Semantic | `success`, `warning`, `error` | Status indicators |
| Semantic Light | `successLight`, `warningLight`, `errorLight` | Status backgrounds |
| Role | `freelancer`, `client` | Role badges |
| Role Light | `freelancerLight`, `clientLight` | Role backgrounds |
| Neutrals | `gray50` - `gray900` | Text, backgrounds |
| Borders | `border`, `borderDark` | Dividers, outlines |

### Usage Example

```typescript
import { colors } from "@/constants/colors";

// Semantic status
<Badge label="Active" variant="success" />

// Role colors
<Badge label="Freelancer" variant="freelancer" />

// Text hierarchy
<Typography color={colors.gray900}>Primary text</Typography>
<Typography color={colors.gray500}>Secondary text</Typography>
```

---

## Component Patterns

### Variant-Based Components

Components like `Badge` and `Button` use a variant pattern for styling:

```typescript
type BadgeVariant = "default" | "success" | "warning" | "error" | "freelancer" | "client";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

// Usage
<Badge label="Pending" variant="warning" />
```

### Creating a Variant-Based Component

1. Define variant types as a union type
2. Create a `variantStyles` record mapping variants to styles
3. Use the variant prop to select styles

```typescript
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes } from "../../constants/typography";
import { spacing, borderRadius } from "../../constants/spacing";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  // ... other props
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: { color: string } }> = {
  primary: { container: { backgroundColor: colors.primary }, text: { color: colors.white } },
  // ... other variants
};

export function Button({ variant = "primary", ... }: ButtonProps) {
  return (
    <View style={[styles.container, variantStyles[variant].container]}>
      <Text style={variantStyles[variant].text}>{title}</Text>
    </View>
  );
}
```

### Props Destructuring Pattern

Always destructure props with defaults:

```typescript
interface ComponentProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;  // Optional with default
  size?: ButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Component({ title, onPress, variant = "primary", style }: ComponentProps) {
  // Use variant with default value
}
```

---

## Loading/Error/Empty States

### EmptyState Component

Use for lists/screens with no content:

```typescript
import { EmptyState } from "@/components/ui";

<EmptyState
  title="No contracts yet"
  message="Create your first contract to get started"
  action={{
    label: "Create Contract",
    onPress: () => router.push(ROUTES.FREELANCER.CONTRACTS_NEW),
  }}
/>
```

### Loading State Pattern

Use `ActivityIndicator` or `SkeletonLoader` for loading states:

```typescript
import { ActivityIndicator } from "react-native";
import { SkeletonLoader } from "@/components/ui";

{isLoading ? (
  <>
    <ActivityIndicator size="large" color={colors.primary} />
    <SkeletonLoader width={200} height={20} />
  </>
) : (
  <Content />
)}
```

### Error State Pattern

Use `ErrorBoundary` for component-level error handling:

```typescript
import { ErrorBoundary } from "@/components/ui";

<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

---

## Navigation Routes

Use centralized route constants instead of hardcoded strings:

```typescript
import { ROUTES } from "@/constants/routes";

// Auth routes
router.push(ROUTES.AUTH.LOGIN);
router.replace(ROUTES.AUTH.REGISTER);

// Freelancer routes
router.push(ROUTES.FREELANCER.DASHBOARD);
router.push(ROUTES.FREELANCER.CONTRACT_DETAIL(contractId));

// Client routes
router.push(ROUTES.CLIENT.DASHBOARD);
router.push(ROUTES.CLIENT.CONTRACT_DETAIL(contractId));
```

### Route Constants File

See `src/constants/routes.ts` for the complete list of routes.

---

## Layout Components

### PageHeader

Standardized page header with title, subtitle, and actions:

```typescript
import { PageHeader } from "@/components/ui";
import { Button } from "@/components/ui";

<PageHeader
  title="Dashboard"
  subtitle="Welcome back"
  actions={<Button title="Add" size="sm" onPress={handleAdd} />}
/>
```

### Section

Container for grouped content with optional title:

```typescript
import { Section } from "@/components/ui";

<Section title="Contract Details">
  <ContractInfo />
</Section>
```

### CardList

List container for card-based content:

```typescript
import { CardList, CardListItem, CardListItemContent } from "@/components/ui";

<CardList>
  <CardListItem onPress={() => handlePress()}>
    <CardListItemContent label="Client" value="John Doe" />
  </CardListItem>
</CardList>
```

---

## Best Practices

1. **Use design system constants** - Never hardcode colors, spacing, or typography values
2. **Destructure props with defaults** - Make optional props explicit with default values
3. **Use variant patterns** - For components with multiple visual states
4. **Export from index** - Always export new components from the relevant index file
5. **Use centralized routes** - Reference routes from `src/constants/routes.ts`
6. **Handle loading/error/empty states** - Every list screen should handle these states
