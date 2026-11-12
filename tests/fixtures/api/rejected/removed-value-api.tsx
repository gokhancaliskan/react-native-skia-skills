// The pre-Reanimated Skia value and touch API. Agents still produce it from old tutorials.
// expect: TS2305 'runTiming' | TS2305 'useComputedValue' | TS2305 'useSharedValueEffect' | TS2305 'useTouchHandler' | TS2305 'useValue'
import {
  runTiming, useComputedValue, useSharedValueEffect, useTouchHandler, useValue,
} from "@shopify/react-native-skia";

export const removed = [runTiming, useComputedValue, useSharedValueEffect, useTouchHandler, useValue];
