import {z} from 'zod';

const HexColor = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'STYLE_COLOR_INVALID');

export const StylePackSchema = z.strictObject({
  id: z.string().regex(/^styles\/[a-z0-9-]+@\d+\.\d+\.\d+$/, 'STYLE_PACK_ID_INVALID'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  colors: z.record(z.string(), HexColor),
  typography: z.record(
    z.string(),
    z.strictObject({
      fontId: z.string().min(1),
      weight: z.number().int().min(1).max(1000),
      trackingEm: z.number(),
      lineHeight: z.number().positive(),
    }),
  ),
  spacing: z.record(z.string(), z.number()),
  radius: z.record(z.string(), z.number()),
  shadow: z.record(
    z.string(),
    z.strictObject({
      x: z.number(),
      y: z.number(),
      blur: z.number().nonnegative(),
      spread: z.number(),
      color: z.string().min(1),
    }),
  ),
  motion: z.strictObject({
    profile: z.enum(['calm', 'editorial', 'energetic', 'playful']),
    heroEase: z.literal('easeOutExpo'),
    standardEase: z.literal('easeOutQuart'),
    travelEase: z.literal('easeInOutQuint'),
  }),
});

export type StylePack = z.infer<typeof StylePackSchema>;
