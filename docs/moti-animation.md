TITLE: Creating Mount Animations with MotiView in React Native
DESCRIPTION: Shows how to set initial state and animate opacity using MotiView component.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/animations-overview.md#2025-04-15_snippet_1

LANGUAGE: tsx
CODE:

```
<MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} />
```

---

TITLE: Basic MotiPressable Usage Example
DESCRIPTION: A simple example of using MotiPressable to change opacity based on pressed or hovered states. This demonstrates the fundamental usage pattern of the component.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/overview.mdx#2025-04-15_snippet_0

LANGUAGE: jsx
CODE:

```
<MotiPressable
  onPress={onPress}
  animate={({ hovered, pressed }) => {
    'worklet'

    return {
      opacity: hovered || pressed ? 0.5 : 1,
    }
  }}
/>
```

---

TITLE: Building an Interactive Hover Dropdown Menu with Moti and React Native
DESCRIPTION: A complete implementation of a web-focused dropdown menu that responds to hover states using Moti animations. It includes components for menu items, dropdown container, animations, and styling. The implementation uses Moti's pressable interactions API to handle hover states and create smooth transitions.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/examples/dropdown.md#2025-04-15_snippet_0

LANGUAGE: tsx
CODE:

```
import React from 'react'
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  ViewProps,
  Platform,
} from 'react-native'
import {
  MotiPressable,
  useMotiPressable,
  useMotiPressableAnimatedProps,
} from 'moti/interactions'
import { MotiView } from 'moti'
import { Ionicons } from '@expo/vector-icons'

function MenuItemBg() {
  const state = useMotiPressable(
    'item',
    ({ hovered, pressed }) => {
      'worklet'
      return {
        opacity: hovered || pressed ? 0.4 : 0,
      }
    },
    []
  )

  return <MotiView state={state} style={styles.itemBg} />
}

function MenuItemArrow() {
  const state = useMotiPressable(
    'item',
    ({ hovered, pressed }) => {
      'worklet'

      return {
        opacity: hovered || pressed ? 1 : 0,
        translateX: hovered || pressed ? 0 : -10,
      }
    },
    []
  )

  return (
    <MotiView
      transition={{ type: 'timing' }}
      style={styles.itemArrow}
      state={state}
    >
      <Ionicons name="ios-arrow-forward" size={18} color="white" />
    </MotiView>
  )
}

function MenuItem({
  title,
  description,
  color,
  icon,
}: {
  title: string
  description: string
  color: string
  icon: React.ComponentProps<typeof Ionicons>['name']
}) {
  return (
    <MotiPressable onPress={console.log} style={styles.item} id="item">
      <MenuItemBg />
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons size={32} color="black" name={icon} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.titleContainer}>
          <Text style={[styles.text, styles.title]}>{title}</Text>
          <MenuItemArrow />
        </View>
        <Text style={[styles.text, styles.subtitle]}>{description}</Text>
      </View>
    </MotiPressable>
  )
}

function Dropdown() {
  const dropdownState = useMotiPressable(
    'menu',
    ({ hovered, pressed }) => {
      'worklet'

      return {
        opacity: pressed || hovered ? 1 : 0,
        translateY: pressed || hovered ? 0 : -5,
      }
    },
    []
  )
  const animatedProps = useMotiPressableAnimatedProps<ViewProps>(
    'menu',
    ({ hovered, pressed }) => {
      'worklet'

      console.log('hovered', hovered)
      return {
        pointerEvents: pressed || hovered ? 'auto' : 'none',
      }
    },
    []
  )

  return (
    <MotiView
      style={styles.dropdown}
      animatedProps={animatedProps}
      transition={{ type: 'timing' }}
    >
      <MotiView
        style={[styles.dropdownContent, shadow]}
        transition={{ type: 'timing', delay: 20 }}
        state={dropdownState}
      >
        <Text style={[styles.text, styles.heading]}>BeatGig Products</Text>
        <MenuItem
          title="Colleges"
          description="For Greek organizations & university program boards"
          color="#FFF500"
          icon="school-outline"
        />
        <MenuItem
          title="Venues"
          description="For bars, nightclubs, restaurants, country clubs, & vineyards"
          color="#50E3C2"
          icon="business-outline"
        />
        <MenuItem
          title="Artists"
          description="For artists, managers & agents"
          color="#FF0080"
          icon="mic-outline"
        />
      </MotiView>
    </MotiView>
  )
}

function TriggerBg() {
  const state = useMotiPressable(
    'trigger',
    ({ hovered, pressed }) => {
      'worklet'

      return {
        opacity: hovered || pressed ? 0.2 : 0,
      }
    },
    []
  )
  return <MotiView state={state} style={styles.triggerBg} />
}

function Trigger() {
  return (
    <MotiPressable id="trigger">
      <TriggerBg />
      <View style={styles.triggerContainer}>
        <Text style={[styles.text, styles.trigger]}>Our Products</Text>
        <Ionicons
          name="chevron-down"
          style={styles.chevron}
          color="white"
          size={20}
        />
      </View>
    </MotiPressable>
  )
}

function Menu() {
  return (
    <MotiPressable id="menu">
      <Trigger />
      <Dropdown />
    </MotiPressable>
  )
}

export default function MotiPressableMenu() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <Menu />
      </View>
    </SafeAreaView>
  )
}

const shadow = Platform.select({
  web: {
    boxShadow: `rgb(255 255 255 / 10%) 0px 50px 100px -20px, rgb(255 255 255 / 50%) 0px 30px 60px -30px`,
  },
}) as any

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  wrapper: {
    padding: 32,
    alignItems: 'flex-start',
  },
  text: {
    color: 'white',
    fontFamily: Platform.OS === 'web' ? 'SF Pro Rounded' : undefined,
    fontSize: 14,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    width: 500,
    paddingTop: 4,
  },
  dropdownContent: {
    backgroundColor: 'black',
    paddingHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 32,
  },
  trigger: {
    fontSize: 16,
    fontWeight: 'bold',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  triggerBg: {
    backgroundColor: 'white',
    borderRadius: 4,
    ...StyleSheet.absoluteFillObject,
  },
  heading: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#888888',
    marginLeft: 16,
    fontSize: 16,
  },
  item: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    marginTop: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  itemBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#333',
  },
  iconContainer: {
    height: 50,
    width: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
  itemContent: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemArrow: {
    marginLeft: 4,
  },
  chevron: {
    marginTop: 1,
    marginLeft: 8,
  },
  triggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 8,
  },
})
```

---

TITLE: Creating Fade and Scale Animation with Moti in React Native
DESCRIPTION: Implements a basic animation that fades and scales a white square shape using Moti's MotiView component. The animation is triggered by a toggle press action and uses timing-based transitions. The component demonstrates Moti's from/animate pattern for defining animation states.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hello-world.md#2025-04-15_snippet_0

LANGUAGE: tsx
CODE:

```
import React, { useReducer } from 'react'
import { StyleSheet, Pressable } from 'react-native'
import { MotiView } from 'moti'

function Shape() {
  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.5,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        type: 'timing',
      }}
      style={styles.shape}
    />
  )
}

export default function HelloWorld() {
  const [visible, toggle] = useReducer((s) => !s, true)

  return (
    <Pressable onPress={toggle} style={styles.container}>
      {visible && <Shape />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  shape: {
    justifyContent: 'center',
    height: 250,
    width: 250,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#9c1aff',
  },
})
```

---

TITLE: Basic MotiView Animation with Opacity Transition in JSX
DESCRIPTION: A simple example showing how to create a fade-in animation using MotiView component. It transitions opacity from 0 to 1 using Moti's declarative API.
SOURCE: https://github.com/nandorojo/moti/blob/master/README.md#2025-04-15_snippet_0

LANGUAGE: jsx
CODE:

```
<MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} />
```

---

TITLE: Full Example: Touchable Pulse Animation Component with useDynamicAnimation
DESCRIPTION: A complete example of a touchable component that pulses on touch using useDynamicAnimation, TapGestureHandler, and Moti animations.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hooks/use-dynamic-animation.md#2025-04-15_snippet_7

LANGUAGE: tsx
CODE:

```
import React from 'react'
import { MotiView, useDynamicAnimation } from 'moti'
import {
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler'
import { useAnimatedGestureHandler } from 'react-native-reanimated'

export default function HoverPulse({
  scaleTo = 1.05,
  style,
  children,
  ...props
}) {
  const animation = useDynamicAnimation(() => ({
    // this is the initial state
    scale: 1,
  }))

  const onGestureEvent = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>(
    {
      onStart: () => {
        animation.animateTo({ scale: scaleTo })
      },
      onFinish: () => {
        animation.animateTo({ scale: 1 })
      },
    }
  )

  return (
    <TapGestureHandler onGestureEvent={onGestureEvent}>
      <MotiView style={style} state={animation}>
        {children}
      </MotiView>
    </TapGestureHandler>
  )
}
```

---

TITLE: Creating Fade and Scale Animation with Moti in React Native
DESCRIPTION: This snippet demonstrates how to use Moti to create a simple animation that fades and scales in a shape. It uses MotiView for animation and React hooks for state management. The component renders a pressable area that toggles the visibility of an animated shape.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/examples/hello-world.md#2025-04-15_snippet_0

LANGUAGE: tsx
CODE:

```
import React, { useReducer } from 'react'
import { StyleSheet, Pressable } from 'react-native'
import { MotiView } from 'moti'

function Shape() {
  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.5,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        type: 'timing',
      }}
      style={styles.shape}
    />
  )
}

export default function HelloWorld() {
  const [visible, toggle] = useReducer((s) => !s, true)

  return (
    <Pressable onPress={toggle} style={styles.container}>
      {visible && <Shape />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  shape: {
    justifyContent: 'center',
    height: 250,
    width: 250,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#9c1aff',
  },
})
```

---

TITLE: Creating Sequence Animations in Moti
DESCRIPTION: Shows how to create sequence animations by passing arrays to style properties and customizing individual steps.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/animations-overview.md#2025-04-15_snippet_10

LANGUAGE: tsx
CODE:

```
<MotiView
  animate={{
    scale: [
      // you can mix primitive values with objects, too
      { value: 0.1, delay: 100 },
      1.1,
      { value: 1, type: 'timing', delay: 200 },
    ],
  }}
/>
```

---

TITLE: Customizing Moti Animations with Transition Props
DESCRIPTION: Demonstrates how to customize animations using the transition prop, including timing and spring animations.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/animations-overview.md#2025-04-15_snippet_4

LANGUAGE: tsx
CODE:

```
<MotiView
  from={{ opacity: 0, scale: 0.5 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{
    type: 'timing',
    duration: 350,
  }}
/>
```

---

TITLE: Basic Usage of useAnimationState in React Native
DESCRIPTION: Demonstrates how to import and use the useAnimationState hook to create and apply animation states to a MotiView component.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hooks/use-animation-state.md#2025-04-15_snippet_0

LANGUAGE: javascript
CODE:

```
const animationState = useAnimationState({
  from: {
    opacity: 0,
    scale: 0.9,
  },
  to: {
    opacity: 1,
    scale: 1.1,
  },
  expanded: {
    scale: 2,
  },
})

const onPress = () => {
  if (animationState.current === 'to') {
    animationState.transitionTo('expanded')
  }
}

return <MotiView state={animationState} />
```

---

TITLE: Creating Dynamic Variants with useAnimationState in Moti
DESCRIPTION: Shows how to create and transition between custom animation variants using useAnimationState.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/animations-overview.md#2025-04-15_snippet_14

LANGUAGE: tsx
CODE:

```
const animationState = useAnimationState({
  closed: {
    height: 0,
  },
  open: {
    height: 300,
  },
})

const onPress = () => {
  if (animationState.current === 'closed') {
    animationState.transitionTo('open')
  } else {
    animationState.transitionTo('closed')
  }
}

return <MotiView state={animationState} />
```

---

TITLE: Animating Children with useMotiPressable Hook
DESCRIPTION: Demonstrates how to use the useMotiPressable hook to animate child components based on a parent MotiPressable's interaction state without causing re-renders.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/overview.mdx#2025-04-15_snippet_3

LANGUAGE: tsx
CODE:

```
import { useMotiPressable } from moti/interactions'

const Child = () => {
  const state = useMotiPressable(({ pressed }) => {
    'worklet'

    return {
      opacity: pressed ? 0.5 : 1,
    }
  }, [])
  return <MotiView state={state} />
}
```

---

TITLE: Basic useDynamicAnimation Usage in React Native with Moti
DESCRIPTION: Demonstrates the basic usage of useDynamicAnimation hook to create dynamic animations with an initial state and animating to new states based on layout changes.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hooks/use-dynamic-animation.md#2025-04-15_snippet_0

LANGUAGE: tsx
CODE:

```
const animation = useDynamicAnimation(() => {
  // optional function that returns your initial style
  return {
    height: 100,
  }
})

const onLayout = ({ nativeEvent }) => {
  animation.animateTo({
    ...animation.current,
    height: nativeEvent.layout.height,
  })
}

// pass the animation to state of any Moti component
return <MotiView state={animation} />
```

---

TITLE: Basic Opacity Animation with MotiView in React Native
DESCRIPTION: This snippet demonstrates how to create a simple fade-in and fade-out animation using MotiView component. It defines the initial state, animated state, and exit animation state for opacity transitions.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/index.mdx#2025-04-15_snippet_0

LANGUAGE: tsx
CODE:

```
<MotiView
  from={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
/>
```

---

TITLE: Complete MotiPressable Implementation Example
DESCRIPTION: A full example showing how to use MotiPressable with a URL opening action. The animate prop uses a worklet function to handle opacity changes based on pressed or hovered states.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/overview.mdx#2025-04-15_snippet_2

LANGUAGE: tsx
CODE:

```
const onPress = () => Linking.openURL('beatgig.com')

<MotiPressable
  onPress={onPress}
  animate={({ hovered, pressed }) => {
    'worklet'

    return {
      opacity: hovered || pressed ? 0.5 : 1,
    }
  }}
/>
```

---

TITLE: Type-Safe AnimatedProps with TypeScript
DESCRIPTION: Demonstrates how to use TypeScript generics with useMotiPressableAnimatedProps to ensure type safety when working with animated props.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/overview.mdx#2025-04-15_snippet_7

LANGUAGE: tsx
CODE:

```
import { ViewProps } from 'react-native'

// in your component:
const animatedProps = useMotiPressableAnimatedProps<ViewProps>(
  'menu',
  ({ hovered }) => {
    'worklet'

    return {
      pointerEvents: hovered ? 'auto' : 'none',
    }
  },
  []
)
```

---

TITLE: Animating Dynamic Height with MotiView and useMeasure Hook
DESCRIPTION: Shows how to animate height changes using MotiView and a custom useMeasure hook.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/animations-overview.md#2025-04-15_snippet_3

LANGUAGE: tsx
CODE:

```
const [height, setHeight] = useMeasure()

<MotiView
  animate={{
    height,
  }}
/>
```

---

TITLE: Complete ListItem Implementation with Imports
DESCRIPTION: Full example of ListItem component with imports and hover effect implementation using useMotiPressables.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/use-pressables.md#2025-04-15_snippet_3

LANGUAGE: tsx
CODE:

```
import { useMotiPressables } from 'moti/interactions'

const ListItem = ({ id }) => {
  const state = useMotiPressables((containers) => {
    'worklet'

    // access items by their unique IDs
    const list = containers.list.value
    const item = containers[`item-${id}`].value

    let opacity = 1

    if (list.hovered && !item.hovered) {
      opacity = 0.5
    }

    return {
      opacity,
    }
  }, [])
  return <MotiView state={state} />
}
```

---

TITLE: Simple Animation Implementation Comparison
DESCRIPTION: Basic opacity animation implementation showing the difference between Moti and Reanimated syntax.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/reanimated.md#2025-04-15_snippet_0

LANGUAGE: tsx
CODE:

```
import { MotiView } from 'moti'

export function Moti({ isActive }) {
  return <MotiView animate={{ opacity: isActive ? 1 : 0 }} />
}
```

LANGUAGE: tsx
CODE:

```
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'

export function Reanimated({ isActive }) {
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0),
  }))

  return <Animated.View style={style} />
}
```

---

TITLE: Animating to New State with useDynamicAnimation
DESCRIPTION: Shows how to trigger animations to a new state using the animateTo method, which is a worklet that can be called from the native thread.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hooks/use-dynamic-animation.md#2025-04-15_snippet_3

LANGUAGE: ts
CODE:

```
const animation = useDynamicAnimation(() => {
  return {
    height: 100,
  }
})

const onPress = () => {
  animation.animateTo({ height: 200 })
}
```

---

TITLE: Optimizing MotiPressable with useCallback
DESCRIPTION: Example showing how to optimize MotiPressable animations using useCallback to prevent unnecessary re-renders. The animation function defines opacity changes based on pressed and hover states.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/overview.mdx#2025-04-15_snippet_11

LANGUAGE: tsx
CODE:

```
const animate = useCallback<MotiPressableInteractionProp>(({ pressed }) => {
  'worklet'

  return {
    opacity: hovered || pressed ? 0.5 : 1,
  }
}, [])

<MotiPressable
  animate={animate}
/>
```

---

TITLE: Importing and Using Skeleton Component in React Native
DESCRIPTION: Basic example of importing and using the Skeleton component from Moti to create a loading component that wraps children.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/skeleton.mdx#2025-04-15_snippet_0

LANGUAGE: tsx
CODE:

```
import React from 'react'
import { Skeleton } from 'moti/skeleton'

const Loader = ({ children }) => <Skeleton>{children}</Skeleton>

export default Loader
```

---

TITLE: Implementing AnimatePresence with Moti in React Native
DESCRIPTION: This code demonstrates a basic implementation of the AnimatePresence component from Moti to animate a component's mounting and unmounting. It creates a simple shape that fades and scales in when mounted and out when unmounted, controlled by a toggle button.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/examples/animate-presence.md#2025-04-15_snippet_0

LANGUAGE: tsx
CODE:

```
import React, { useReducer } from 'react'
import { StyleSheet, Pressable } from 'react-native'

import { MotiView, AnimatePresence } from 'moti'

function Shape() {
  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.9,
      }}
      style={styles.shape}
    />
  )
}

export default function Presence() {
  const [visible, toggle] = useReducer((s) => !s, true)

  return (
    <Pressable onPress={toggle} style={styles.container}>
      <AnimatePresence>{visible && <Shape />}</AnimatePresence>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  shape: {
    justifyContent: 'center',
    height: 250,
    width: 250,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#9c1aff',
  },
})
```

---

TITLE: Basic Transform Array Animation in Moti
DESCRIPTION: Example of using the traditional transform array approach to animate a scale property from 0 to 1.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/api/transforms.md#2025-04-15_snippet_0

LANGUAGE: tsx
CODE:

```
<MotiView
  from={{
    transform: [{ scale: 0 }],
  }}
  animate={{
    transform: [{ scale: 1 }],
  }}
/>
```

---

TITLE: Using useMotiPressableAnimatedProps in a Menu Component
DESCRIPTION: Demonstrates how to use the useMotiPressableAnimatedProps hook within a Menu component to handle hover interactions. The hook is used to conditionally set the pointerEvents prop based on the hover state.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/use-pressable-animated-props.md#2025-04-15_snippet_1

LANGUAGE: tsx
CODE:

```
const Menu = () => {
  return (
    <MotiPressable>
      <Trigger />
      <MenuItems />
    </MotiPressable>
  )
}

const MenuItems = () => {
  const animatedProps = useMotiPressableAnimatedProps(({ hovered }) => {
    'worklet'

    return {
      pointerEvents: hovered ? 'auto' : 'none',
    }
  }, [])
  return (
    <MotiView animatedProps={animatedProps}>{/* Menu items here...*/}</MotiView>
  )
}
```

---

TITLE: Creating Basic PressableScale Component with mergeAnimateProp
DESCRIPTION: A basic implementation of a PressableScale component that scales down when pressed, while still allowing custom animation props to be passed and merged.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/merge.md#2025-04-15_snippet_0

LANGUAGE: tsx
CODE:

```
const PressableScale = ({ animate, ...props }) => {
  return (
    <MotiPressable
      {...props}
      animate={(interaction) => {
        'worklet'

        return mergeAnimateProp(interaction, animate, {
          scale: interaction.pressed ? 0.96 : 1,
        })
      }}
    />
  )
}
```

---

TITLE: Full Example of useAnimationState in React Native Component
DESCRIPTION: A complete example showing how to use useAnimationState within a React Native component, including styles and state management.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hooks/use-animation-state.md#2025-04-15_snippet_5

LANGUAGE: tsx
CODE:

```
import React from 'react'
import { useAnimationState, MotiView } from 'moti'
import { StyleSheet } from 'react-native'

export default function PerformantView() {
  const animationState = useAnimationState({
    from: {
      opacity: 0,
      scale: 0.9,
    },
    to: {
      opacity: 1,
      scale: 1,
    },
  })

  return <MotiView style={styles.shape} state={animationState} />
}

const styles = StyleSheet.create({
  shape: {
    justifyContent: 'center',
    height: 250,
    width: 250,
    borderRadius: 25,
    backgroundColor: 'cyan',
  },
})
```

---

TITLE: Implementing Static Variants with useAnimationState in Moti
DESCRIPTION: Demonstrates how to define and use static animation variants using the useAnimationState hook.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/animations-overview.md#2025-04-15_snippet_13

LANGUAGE: tsx
CODE:

```
const animationState = useAnimationState({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
})

// make sure to pass this to the `state` prop
return <MotiView state={animationState} />
```

---

TITLE: Complete Item Component with Press Transitions and State
DESCRIPTION: Full implementation of an Item component using both useMotiPressableTransition and useMotiPressableState to create press-reactive animations.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/use-pressable-transition.md#2025-04-15_snippet_3

LANGUAGE: tsx
CODE:

```
const Item = () => {
  const transition = useMotiPressableTransition(({ pressed }) => {
    'worklet'

    if (pressed) {
      return {
        type: 'timing',
      }
    }

    return {
      type: 'spring',
      delay: 50,
    }
  })

  const state = useMotiPressableState(({ pressed }) => {
    return {
      translateY: pressed ? -10 : 0,
    }
  })

  return <MotiView transition={transition} state={state} />
}
```

---

TITLE: Using Skeleton.Group for Multiple Skeleton Components
DESCRIPTION: Example of using Skeleton.Group to control multiple Skeleton components together for coordinated loading states.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/skeleton.mdx#2025-04-15_snippet_15

LANGUAGE: tsx
CODE:

```
import { Image, Text } from 'react-native'
import { Skeleton } from 'moti/skeleton'

export function ListItem({ loading, item }) {
  return (
    <Skeleton.Group show={loading}>
      <Skeleton>
        <Image src={{ uri: image.avatar }} />
      </Skeleton>
      <Skeleton>
        <Text>{item.title || ' '}</Text>
      </Skeleton>
    </Skeleton.Group>
  )
}
```

---

TITLE: Basic Usage of MotiPressable Component in React Native
DESCRIPTION: This snippet demonstrates the basic usage of the MotiPressable component, including animation of opacity based on hover and press states. It also shows how to handle press events.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/pressable.md#2025-04-15_snippet_0

LANGUAGE: tsx
CODE:

```
import { MotiPressable } from 'moti/interactions'
import { useCallback } from 'react'

export const Pressable = () => {
  const onPress = () => Linking.openURL('beatgig.com')

  return (
    <MotiPressable
      onPress={onPress}
      animate={useMemo(
        () => ({ hovered, pressed }) => {
          'worklet'

          return {
            opacity: hovered || pressed ? 0.5 : 1,
          }
        },
        []
      )}
    />
  )
}
```

---

TITLE: Using Animation Event Listeners in Moti
DESCRIPTION: Shows how to use the onDidAnimate prop to listen for animation completion events and access animation details.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/animations-overview.md#2025-04-15_snippet_12

LANGUAGE: tsx
CODE:

```
<MotiView
  from={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  onDidAnimate={(styleProp, didAnimationFinish, maybeValue, { attemptedValue }) => {
    console.log('[moti]', styleProp, didAnimationFinish) // [moti], opacity, true

    if (styleProp === 'opacity' && didAnimationFinish) {
      console.log('did animate opacity to: ' + attemptedValue)
    }
  }}
/>
```

---

TITLE: Creating Reusable Animations with useAnimationState in Moti
DESCRIPTION: Demonstrates how to create reusable animations using custom hooks with useAnimationState.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/animations-overview.md#2025-04-15_snippet_15

LANGUAGE: ts
CODE:

```
const useFadeIn = () => {
  return useAnimationState({
    from: {
      opacity: 0,
    },
    to: {
      opacity: 1,
    },
  })
}

const FadeInComponent = () => {
  const fadeInState = useFadeIn()

  return <MotiView state={fadeInState} />
}
```

---

TITLE: Embedding Expo Snack for Moti Animate Height Example
DESCRIPTION: HTML code that embeds an Expo Snack example showing how to implement an accordion animation with auto height using Moti. The snack demonstrates the animate-height functionality in a dark-themed preview.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/examples/auto-height.md#2025-04-15_snippet_0

LANGUAGE: html
CODE:

```
<div data-snack-id="@nandorojo/moti-animate-height" data-snack-platform="web" data-snack-preview="true" data-snack-theme="dark" style={{"overflow":"hidden",background:"#212121",border:"1px solid var(--color-border)",borderRadius:"4px",height:"505px",width:"100%"}}></div>
<script async src="https://snack.expo.dev/embed.js"></script>
```

---

TITLE: Mount Animation Comparison
DESCRIPTION: Side-by-side comparison of mount animations implemented in both Moti and Reanimated.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/reanimated.md#2025-04-15_snippet_3

LANGUAGE: tsx
CODE:

```
import { MotiView } from 'moti'

export const Moti = () => (
  <MotiView
    from={{
      translateY: -10,
      opacity: 0,
    }}
    animate={{
      translateY: 0,
      opacity: 1,
    }}
  />
)
```

LANGUAGE: tsx
CODE:

```
import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated'

export const Reanimated = () => {
  const isMounted = useSharedValue(false)

  const style = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isMounted.value ? 1 : 0),
      transform: [
        {
          translateY: withSpring(isMounted.value ? 0 : -10),
        },
      ],
    }
  })

  useEffect(() => {
    isMounted.value = true
  }, [])

  return <Animated.View style={style} />
}
```

---

TITLE: Animating a Motified Component with Sequence Animation
DESCRIPTION: Example showing how to use the created motified component with sequence animation, specifically animating the height property from 50 to 100.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/api/motify.md#2025-04-15_snippet_1

LANGUAGE: tsx
CODE:

```
// height sequence animation
<MotifiedComponent animate={{ height: [50, 100] }} />
```

---

TITLE: TypeScript with useInterpolateMotiPressable
DESCRIPTION: Shows how to use TypeScript generics with useInterpolateMotiPressable to ensure type safety when working with derived values from interaction states.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/overview.mdx#2025-04-15_snippet_10

LANGUAGE: tsx
CODE:

```
const swipePosition = useSharedValue(0)
const interpolatedValue = useInterpolateMotiPressable<{ done: boolean }>(
  'list',
  ({ pressed }) => {
    'worklet'

    return {
      done: swipePosition.value > 50 && !pressed,
    }
  }
)
```

---

TITLE: Embedding Stackblitz Example for Moti Variants in Next.js
DESCRIPTION: An iframe embedding a Stackblitz playground that demonstrates how to use Moti variants in a Next.js application. The example can be found at the specified URL with the index.tsx file open by default.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/examples/variants.md#2025-04-15_snippet_0

LANGUAGE: html
CODE:

```
<iframe src="https://stackblitz.com/edit/nextjs-ephjdq?embed=1&file=pages/index.tsx" className="stackblitz" />
```

---

TITLE: Correct Usage of animate Prop for Dynamic Animations in Moti
DESCRIPTION: This example shows the recommended approach for dynamic animations in Moti. Using the animate prop directly on MotiView allows the opacity to reactively update based on the isLoading state.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hooks/use-animation-state.md#2025-04-15_snippet_8

LANGUAGE: jsx
CODE:

```
// ✅ do this instead
<MotiView animate={{ opacity: isLoading ? 1 : 0 }} />
```

---

TITLE: Multiple Transforms Using Array Syntax
DESCRIPTION: Example of using the traditional transform array syntax for multiple transforms while maintaining consistent order.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/api/transforms.md#2025-04-15_snippet_4

LANGUAGE: tsx
CODE:

```
<MotiView
  from={{
    transform: [{ scale: 0 }, { translateX: -10 }],
  }}
  animate={{
    transform: [{ scale: 1 }, { translateX: 0 }],
  }}
/>
```

---

TITLE: Optimizing useInterpolateMotiPressable with dependency arrays
DESCRIPTION: Demonstrates how to optimize the useInterpolateMotiPressable hook using a dependency array similar to useMemo.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/use-pressable-interpolate.md#2025-04-15_snippet_5

LANGUAGE: tsx
CODE:

```
const swipePosition = useSharedValue(0)
const interpolatedValue = useInterpolateMotiPressable(({ pressed }) => {
  'worklet'

  return {
    done: swipePosition.value > 50 && !pressed,
  }
}, [])
```

---

TITLE: Gesture Handling with Moti
DESCRIPTION: Example of implementing gesture-based animations using Moti with react-native-gesture-handler.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/reanimated.md#2025-04-15_snippet_2

LANGUAGE: tsx
CODE:

```
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { MotiView, useDynamicAnimation } from 'moti'

export function WithGestures() {
  const state = useDynamicAnimation(() => ({
    opacity: 0,
  }))

  const gesture = Gesture.Tap()
    .onStart(() => {
      state.animateTo({
        opacity: 1,
      })
    })
    .onEnd(() => {
      state.animateTo({
        opacity: 0,
      })
    })

  return (
    <GestureDetector gesture={gesture}>
      <MotiView state={state} collapsable={false} />
    </GestureDetector>
  )
}
```

---

TITLE: Creating Sequence Animations with useDynamicAnimation
DESCRIPTION: Shows how to create sequence animations by passing an array of values to animateTo, which will be executed in sequence with timing options.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hooks/use-dynamic-animation.md#2025-04-15_snippet_6

LANGUAGE: ts
CODE:

```
const animation = useDynamicAnimation(() => {
  return {
    opacity: 1,
  }
})

const onPress = () => {
  animation.animateTo({
    // sequence
    opacity: [1, 0.5, { value: 0, delay: 1000 }],
  })
}
```

---

TITLE: Transform Animation Sequences in Moti
DESCRIPTION: Example of creating animation sequences for transforms by passing an array of values to animate through.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/api/transforms.md#2025-04-15_snippet_8

LANGUAGE: tsx
CODE:

```
<MotiView
  animate={{
    scale: [0, 1.1, { value: 1, delay: 200 }], // scale to 0, 1.1, then 1 (with delay 200 ms)
  }}
/>
```

---

TITLE: Using AnimatePresence for Mount/Unmount Animations
DESCRIPTION: Demonstrates how to use AnimatePresence to animate a component before it unmounts, using the exit prop.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/animations-overview.md#2025-04-15_snippet_7

LANGUAGE: tsx
CODE:

```
const [visible, setVisible] = useState(false)

<AnimatePresence>
  {visible && (
    <MotiView
      from={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
      }}
    />
  )}
</AnimatePresence>
```

---

TITLE: Proper Usage Pattern for useDynamicAnimation
DESCRIPTION: Demonstrates the correct way to use useDynamicAnimation by avoiding destructuring, ensuring the hook works as intended.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hooks/use-dynamic-animation.md#2025-04-15_snippet_5

LANGUAGE: ts
CODE:

```
// 😡 don't do this
const { current, animateTo } = useDynamicAnimation()

// ✅ do this!
const animation = useDynamicAnimation()
```

---

TITLE: TypeScript Implementation of PressableScale with Hover State
DESCRIPTION: A fully typed implementation of PressableScale that handles both pressed and hovered states, using useMemo for better TypeScript support.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/merge.md#2025-04-15_snippet_2

LANGUAGE: tsx
CODE:

```
import React, { ComponentProps } from 'react'
import { MotiPressable, mergeAnimateProp } from 'moti/interactions'

type Props = ComponentProps<typeof MotiPressable>

const PressableScale = ({ animate, ...props }: Props) => {
  return (
    <MotiPressable
      {...props}
      animate={useMemo(
        () => (interaction) => {
          // useMemo has better TS support than useCallback
          'worklet'

          const { hovered, pressed } = interaction

          let scale = 1

          if (pressed) {
            scale = 0.95
          } else if (hovered) {
            scale = 0.97
          }

          return mergeAnimateProp(interaction, animate, {
            scale,
          })
        },
        [animate]
      )}
    />
  )
}
```

---

TITLE: Using Function-based Updates with animateTo in useDynamicAnimation
DESCRIPTION: Demonstrates how to use a function with animateTo that receives the current style and returns the next state, similar to setState's functional updates.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hooks/use-dynamic-animation.md#2025-04-15_snippet_4

LANGUAGE: ts
CODE:

```
const animation = useDynamicAnimation(() => {
  return {
    height: 100,
    width: 100,
  }
})

const onPress = () => {
  animation.animateTo((current) => ({ ...current, height: 200 }))

  // or, you could do this! they're the same
  animation.animateTo({
    ...animation.current,
    height: 200,
  })
}
```

---

TITLE: Customized Transitions with MotiPressable in React Native
DESCRIPTION: This example shows how to customize transitions in MotiPressable, including delaying animations when releasing the button. It demonstrates the use of both 'animate' and 'transition' props with worklet functions.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/pressable.md#2025-04-15_snippet_1

LANGUAGE: tsx
CODE:

```
import { MotiPressable } from 'moti/interactions'
import { useCallback } from 'react'

export const Pressable = () => {
  const onPress = () => Linking.openURL('beatgig.com')

  return (
    <MotiPressable
      onPress={onPress}
      animate={useMemo(
        () => ({ hovered, pressed }) => {
          'worklet'

          return {
            opacity: hovered || pressed ? 0.5 : 1,
          }
        },
        []
      )}
      transition={useMemo(
        () => ({ hovered, pressed }) => {
          'worklet'

          return {
            delay: hovered || pressed ? 0 : 100,
          }
        },
        []
      )}
    />
  )
}
```

---

TITLE: Basic PressableScale Component Without mergeAnimateProp
DESCRIPTION: Example of a PressableScale component that doesn't use mergeAnimateProp, which causes the problem of overriding any animate prop passed to it.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/merge.md#2025-04-15_snippet_1

LANGUAGE: tsx
CODE:

```
const PressableScale = (props) => {
  return (
    <MotiPressable
      {...props}
      animate={(interaction) => {
        'worklet'

        return {
          scale: interaction.pressed ? 0.96 : 1,
        }
      }}
    />
  )
}
```

---

TITLE: Using Function-Based State Transitions in useAnimationState
DESCRIPTION: Shows how to use a function to determine the next animation state based on the current state.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hooks/use-animation-state.md#2025-04-15_snippet_4

LANGUAGE: tsx
CODE:

```
animationState.transitionTo((currentState) => {
  if (currentState === 'from') {
    return 'active'
  }
  return 'to'
})
```

---

TITLE: Using Shared Values with Moti
DESCRIPTION: Demonstrations of how to use Reanimated shared values with Moti components for high-performance animations.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/reanimated.md#2025-04-15_snippet_1

LANGUAGE: tsx
CODE:

```
import { MotiView } from 'moti'
import { useSharedValue, useDerivedValue } from 'react-native-reanimated'

export function WithSharedValue() {
  const isValid = useSharedValue(false)

  return (
    <MotiView
      animate={useDerivedValue(() => ({
        opacity: isValid.value ? 1 : 0,
      }))}
    />
  )
}
```

---

TITLE: Configuring Exit Transition for Moti Component in JSX
DESCRIPTION: This snippet demonstrates how to use the 'exitTransition' prop in a MotiView component. It shows how to set different transition types for regular animations and exit animations, as well as defining animate and exit styles.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/api/props.md#2025-04-15_snippet_0

LANGUAGE: jsx
CODE:

```
<MotiView
  // the animate prop uses the transition
  transition={{ type: 'spring' }}
  animate={{ opacity: 1, scale: 1 }}
  // when exiting, it will use a timing transition
  exitTransition={{ type: 'timing' }}
  exit={{ opacity: 0, scale: 0.1 }}
/>
```

---

TITLE: Using PressableScale with Dripsy Styling
DESCRIPTION: Simple example of using the Dripsy-integrated PressableScale component with custom styling.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/merge.md#2025-04-15_snippet_5

LANGUAGE: tsx
CODE:

```
<PressableScale sx={{ height: 100, bg: 'primary' }} />
```

---

TITLE: Full Example of Skeleton Component Usage
DESCRIPTION: Complete example demonstrating the Skeleton component with toggle between light and dark modes.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/skeleton.mdx#2025-04-15_snippet_14

LANGUAGE: tsx
CODE:

```
import React, { useReducer } from 'react'
import { StyleSheet, Pressable } from 'react-native'
import { MotiView } from 'moti'
import { Skeleton } from 'moti/skeleton'

const Spacer = ({ height = 16 }) => <MotiView style={{ height }} />

export default function HelloWorld() {
  const [dark, toggle] = useReducer((s) => !s, true)

  const colorMode = dark ? 'dark' : 'light'

  return (
    <Pressable onPress={toggle} style={styles.container}>
      <MotiView
        transition={{
          type: 'timing',
        }}
        style={[styles.container, styles.padded]}
        animate={{ backgroundColor: dark ? '#000000' : '#ffffff' }}
      >
        <Skeleton colorMode={colorMode} radius="round" height={75} width={75} />
        <Spacer />
        <Skeleton colorMode={colorMode} width={250} />
        <Spacer height={8} />
        <Skeleton colorMode={colorMode} width={'100%'} />
        <Spacer height={8} />
        <Skeleton colorMode={colorMode} width={'100%'} />
      </MotiView>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  padded: {
    padding: 16,
  },
})
```

---

TITLE: Defining Initial Animation State in Moti's useDynamicAnimation
DESCRIPTION: Shows how to define the initial animation state using a pure function passed to useDynamicAnimation, similar to React's useState hook.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/hooks/use-dynamic-animation.md#2025-04-15_snippet_1

LANGUAGE: ts
CODE:

```
const animation = useDynamicAnimation(() => {
  // this is your initial state
  return {
    height: 100,
  }
})
```

---

TITLE: Animating Based on React State with MotiView
DESCRIPTION: Demonstrates how to animate opacity based on a loading state variable.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/animations-overview.md#2025-04-15_snippet_2

LANGUAGE: tsx
CODE:

```
<MotiView animate={{ opacity: isLoading ? 1 : 0 }} />
```

---

TITLE: Creating a React Native App with Moti Template
DESCRIPTION: This command uses npx to create a new React Native application using the Moti starter template. It provides a quick way to set up a project with Moti animations integrated.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/starter.md#2025-04-15_snippet_0

LANGUAGE: sh
CODE:

```
npx create-react-native-app -t with-moti
```

---

TITLE: Targeting Specific Parent with useInterpolateMotiPressable
DESCRIPTION: Demonstrates how to target a specific parent MotiPressable by ID when using useInterpolateMotiPressable. This allows for more complex animation hierarchies.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/overview.mdx#2025-04-15_snippet_9

LANGUAGE: tsx
CODE:

```
const mySharedValue = useSharedValue(0)
useInterpolateMotiPressable('list', ({ pressed }) => {
  'worklet'

  mySharedValue.value = pressed ? 1 : 0
})
```

---

TITLE: Initializing a Motified Component with motify()
DESCRIPTION: Basic example of importing the motify function and using it to transform a standard React Native component into an animated moti component.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/api/motify.md#2025-04-15_snippet_0

LANGUAGE: typescript
CODE:

```
import { motify } from 'moti'

const MotifiedComponent = motify(MyComponent)()
```

---

TITLE: Animated Props with useMotiPressableAnimatedProps
DESCRIPTION: Shows how to use useMotiPressableAnimatedProps to update a component's props based on a parent's interaction state. This is useful for properties that need to change based on interaction but aren't directly animatable.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/overview.mdx#2025-04-15_snippet_6

LANGUAGE: tsx
CODE:

```
const MenuItems = () => {
  const animatedProps = useMotiPressableAnimatedProps(
    'menu', // optional, access a unique pressable parent
    ({ hovered }) => {
      'worklet'

      return {
        pointerEvents: hovered ? 'auto' : 'none',
      }
    },
    []
  )
  return (
    <MotiView animatedProps={animatedProps}>{/* Menu items here...*/}</MotiView>
  )
}
```

---

TITLE: Basic ListItem Component Implementation
DESCRIPTION: Example of a ListItem component using useMotiPressables to manage opacity based on hover states of list container and individual items.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/use-pressables.md#2025-04-15_snippet_1

LANGUAGE: tsx
CODE:

```
const ListItem = ({ id }) => {
  const state = useMotiPressables((containers) => {
    'worklet'

    // access items by their unique IDs
    const list = containers.list.value
    const item = containers[`item-${id}`].value

    let opacity = 1

    if (list.hovered && !item.hovered) {
      opacity = 0.5
    }

    return {
      opacity,
    }
  }, [])

  return <MotiView state={state} />
}
```

---

TITLE: Implementing Pressable Item Component - TypeScript/React
DESCRIPTION: Shows how to implement a component that uses the useMotiPressable hook to create press animations.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/use-pressable.md#2025-04-15_snippet_2

LANGUAGE: tsx
CODE:

```
const Item = () => {
  const state = useMotiPressable(({ pressed }) => {
    'worklet'

    return {
      opacity: pressed ? 0.5 : 1,
    }
  })

  return <MotiView state={state} />
}
```

---

TITLE: Interpolating Interaction State with useInterpolateMotiPressable
DESCRIPTION: Shows how to use useInterpolateMotiPressable to access the shared value state of a parent pressable and create interpolated animations based on interaction state.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/overview.mdx#2025-04-15_snippet_8

LANGUAGE: tsx
CODE:

```
import { useSharedValue } from 'react-native-reanimated'
import { useInterpolateMotiPressable } from moti/interactions'

// in your component
const mySharedValue = useSharedValue(0)
useInterpolateMotiPressable(({ pressed }) => {
  'worklet'

  mySharedValue.value = pressed ? 1 : 0
})
```

---

TITLE: Optimized Pressable with Dependencies - TypeScript/React
DESCRIPTION: Shows how to use dependency arrays with useMotiPressable for optimized performance.
SOURCE: https://github.com/nandorojo/moti/blob/master/docs/docs/interactions/use-pressable.md#2025-04-15_snippet_5

LANGUAGE: tsx
CODE:

```
const state = useMotiPressable(
  'list',
  ({ pressed, hovered }) => {
    'worklet'

    return {
      opacity: pressed && !loading ? 0.5 : 1,
    }
  },
  [loading] // pass an empty array if there are no dependencies
)
```
