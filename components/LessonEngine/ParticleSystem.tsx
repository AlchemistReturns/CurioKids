// ParticleSystem.tsx
import { Circle, Group } from "@shopify/react-native-skia";
import React, { useEffect } from "react";
import { useDerivedValue, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

const PARTICLE_COUNT = 25;

export const ParticleSystem = ({ x, y, active }: { x: any; y: any; active: any }) => {
  const particles = Array.from({ length: PARTICLE_COUNT }).map(() => ({
    vx: (Math.random() - 0.5) * 100,
    vy: (Math.random() - 0.5) * 100,
    size: Math.random() * 6 + 3,
    color: `hsla(${Math.random() * 50 + 40}, 100%, 80%, 1)`, // Gold/Yellow hue
  }));

  const time = useSharedValue(0);

  useEffect(() => {
    time.value = withRepeat(withTiming(1, { duration: 600 }), -1);
  }, []);

  return (
    <Group>
      {particles.map((p, i) => {
        const opacity = useDerivedValue(() => {
          if (!active.value) return 0;
          return 1 - time.value;
        });

        const px = useDerivedValue(() => x.value + p.vx * time.value);
        const py = useDerivedValue(() => y.value + p.vy * time.value);

        return <Circle key={i} cx={px} cy={py} r={p.size} color={p.color} opacity={opacity} />;
      })}
    </Group>
  );
};