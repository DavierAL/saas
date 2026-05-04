import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@saas-pos/ui';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  borderRadius?: number;
}

export function Skeleton({ width, height, style, borderRadius = 4 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        s.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

const s = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE', // Subtle gray for skeleton
  },
});
