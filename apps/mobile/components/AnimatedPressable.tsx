import { useRef } from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface Props extends PressableProps {
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  children: React.ReactNode;
}

const AnimatedRootPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressable({
  style,
  scaleValue = 0.98,
  children,
  disabled,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: scaleValue,
        useNativeDriver: true,
        tension: 120,
        friction: 14,
      }),
      Animated.timing(opacity, {
        toValue: 0.7,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <AnimatedRootPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        style,
        {
          transform: [{ scale }],
          opacity: disabled ? 0.35 : opacity,
        },
      ]}
      {...rest}
    >
      {children}
    </AnimatedRootPressable>
  );
}
