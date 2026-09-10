import { cn } from '@/lib/utils';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export function SketchFrame({
  children,
  className,
  color = '#111111',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  color?: string;
}) {
  return (
    <div
      {...props}
      className={cn('sketch-frame', className)}
      style={{ ...props.style, '--frame-color': color } as CSSProperties}
    >
      <svg aria-hidden="true" className="sketch-frame-border">
        <rect />
      </svg>
      {children}
    </div>
  );
}

export function SketchFrameFilter() {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      className="absolute"
      focusable="false"
    >
      <filter
        id="noddi-sketch-frame"
        x="-8%"
        y="-8%"
        width="116%"
        height="116%"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.005"
          numOctaves="2"
          seed="2"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="5"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
