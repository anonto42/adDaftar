/**
 * Text Component
 *
 * Theme-aware text component with predefined styles.
 */

import React, { memo } from 'react';
import { Text as RNText, TextStyle, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/src/shared/theme';
import { TextStyleKey } from '@/src/shared/theme/typography';

interface TextProps extends RNTextProps {
  variant?: TextStyleKey;
  color?: string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export const Text = memo(function Text({
  variant = 'body',
  color,
  align,
  style,
  children,
  ...props
}: TextProps) {
  const { theme } = useTheme();

  const textStyle: TextStyle = {
    ...theme.textStyles[variant],
    color: color || theme.colors.text,
    textAlign: align,
  };

  return (
    <RNText style={[textStyle, style]} {...props}>
      {children}
    </RNText>
  );
});

// Convenience components
export const Heading1 = memo(function Heading1(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h1" {...props} />;
});

export const Heading2 = memo(function Heading2(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h2" {...props} />;
});

export const Heading3 = memo(function Heading3(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h3" {...props} />;
});

export const Heading4 = memo(function Heading4(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h4" {...props} />;
});

export const BodyText = memo(function BodyText(props: Omit<TextProps, 'variant'>) {
  return <Text variant="body" {...props} />;
});

export const Caption = memo(function Caption(props: Omit<TextProps, 'variant'>) {
  return <Text variant="caption" {...props} />;
});

export const Label = memo(function Label(props: Omit<TextProps, 'variant'>) {
  return <Text variant="label" {...props} />;
});
