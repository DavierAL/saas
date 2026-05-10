import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { colors } from '@saas-pos/ui';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
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
          width: width ?? '100%',
          height: height ?? 20,
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
