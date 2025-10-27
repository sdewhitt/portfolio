import Image from "next/image";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { useEffect, useRef, useState } from "react";

const logos = [
  { name: "github", scale: 0.9 },
  { name: "linux", scale: 1.2 },
  { name: "visualstudiocode", scale: 0.95 },
  { name: "vim", scale: 0.95 },
  { name: "python", scale: 1.0 },
  { name: "node", scale: 1.0 },
  { name: "git", scale: 0.9 },
  { name: "docker", scale: 1.4 },
  { name: "bash", scale: 1.2 },
  { name: "next", scale: 1 },
  { name: "react", scale: 1.0 },
  { name: "typescript", scale: 0.85 },
  { name: "postgres", scale: 1.1 },
  { name: "tailwindcss", scale: 1.0 },
  { name: "vitejs", scale: 1.0 },
  { name: "java", scale: 1.3 },
  { name: "AWS", scale: 1.3 },
  { name: "jenkins", scale: 1.3 },
  { name: "FastAPI", scale: 1 },
];

// Adjustable center image config
const centerImage = {
  // Put your PNG under public/ and update this path
  src: "/series2.png",
  alt: "Center logo",
  // Size in pixels (width and height)
  size: 80,
  // Optional: Tailwind classes to style the image (rounded, ring, etc.)
  className: "rounded-xl",
  // Static base rotation in degrees (e.g., 15, 45, 90)
  rotateDeg: 0,
  // New: Enable continuous rotation
  continuousRotate: true,
  // New: Rotation speed in degrees per second (if continuousRotate is true)
  rotateSpeed: 30, // degrees per second
};



export function Skills() {
  const outerCount = Math.ceil(logos.length * 0.60); // 60% of logos in outer circle
  const outer = logos.slice(0, outerCount);
  const inner = logos.slice(outerCount);

  // Continuous rotation state
  const [rotation, setRotation] = useState(centerImage.rotateDeg || 0);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!centerImage.continuousRotate) {
      setRotation(centerImage.rotateDeg || 0);
      return;
    }
    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (time - lastTimeRef.current) / 1000; // seconds
        setRotation((prev) => prev + (centerImage.rotateSpeed || 60) * delta);
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    };
    // Only re-run if continuousRotate or rotateSpeed changes
  }, [centerImage.continuousRotate, centerImage.rotateSpeed, centerImage.rotateDeg]);

  return (
    <div>
      <div className="relative flex h-[350px] w-[400px] flex-col items-center justify-center overflow-hidden">
        {/* Single centered PNG image */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          {/* Apply a fixed or animated rotation on a wrapper */}
          <div
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <Image
              src={centerImage.src}
              alt={centerImage.alt}
              width={centerImage.size}
              height={centerImage.size}
              className={centerImage.className}
              style={{
                objectFit: "contain",
              }}
              priority
            />
          </div>
        </div>
        <OrbitingCircles iconSize={34} radius={130} speed={0.5}>
          {outer.map(({ name, scale = 1.0 }) => (
            <img
              key={name}
              src={`/skill_logos/${name}.svg`}
              alt={name}
              width={100 * scale}
              height={100 * scale}
              style={{ objectFit: "contain", transform: `scale(${scale})` }}
            />
          ))}
        </OrbitingCircles>
        <OrbitingCircles iconSize={34} radius={80} reverse speed={0.4}>
          {inner.map(({ name, scale = 1.0 }) => (
            <img
              key={name}
              src={`/skill_logos/${name}.svg`}
              alt={name}
              width={100 * scale}
              height={100 * scale}
              style={{ objectFit: "contain", transform: `scale(${scale})` }}
            />
          ))}
        </OrbitingCircles>
      </div>
    </div>
  );
}