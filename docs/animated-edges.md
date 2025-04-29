# Animated Edges in Flow Canvas

This documentation explains how to use the animated edges feature in the application's flow canvas.

## Overview

Animated edges provide visual feedback on the connections between nodes in your flow. They can display different statuses through colors and animations, making it easier to understand the flow's execution state.

## Features

- **Animated Flow**: Edges have flowing animations to indicate data movement
- **Status Indication**: Edges change color based on their status (idle, loading, success, error)
- **Gradient Styling**: Edges use gradient colors for a modern look
- **Custom Labels**: Edges can display labels to indicate their purpose

## How to Use

### Creating Connections with Animated Edges

When connecting nodes in the flow canvas, connections automatically use the animated edge type. The animation indicates the direction of data flow.

### Edge States

Edges can have different visual states depending on the status of connected nodes:

- **Idle** (Default): Cyan color with slow animation
- **Loading**: Amber color with pulsing animation
- **Success**: Green color with fast animation
- **Error**: Red color with reverse animation

### Programmatic Control

You can programmatically control edge statuses using the `setEdgeStatus` method from the flow store:

```typescript
import { useFlowStore } from '@/store/flow-store';

// In your component
const { setEdgeStatus } = useFlowStore();

// Update an edge status
setEdgeStatus('edge-id', 'success'); // Options: 'idle', 'loading', 'success', 'error'
```

## Implementation Details

The animated edges feature is implemented with the following components:

1. **AnimatedEdge Component**: A custom edge component in `src/components/edges/animated-edge.tsx`
2. **CSS Animations**: Defined in `src/app/globals.css`
3. **Edge Types Registration**: In `src/components/flow-canvas.tsx`
4. **Status Management**: Through the flow store in `src/store/flow-store.ts`

## Customization

To customize the animated edges:

### Changing Colors

Edit the CSS classes in `src/app/globals.css`:

```css
.react-flow__edge[data-type="animated"] .react-flow__edge-path {
  @apply stroke-cyan-500; /* Change to your preferred color */
}

.status-success .react-flow__edge-path {
  @apply stroke-lime-500; /* Change success color */
}
```

### Modifying Animations

Adjust the animation parameters in the keyframes:

```css
@keyframes flowAnimation {
  0% {
    stroke-dashoffset: 100; /* Adjust for animation speed */
  }
  100% {
    stroke-dashoffset: 0;
  }
}
```

### Changing Gradient Colors

Edit the gradient colors in the `AnimatedEdge` component:

```jsx
<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.8" />
</linearGradient>
```

## Example

When executing a flow, the edges will automatically update their appearance based on the execution status, providing real-time visual feedback of the data flow through your pipeline. 