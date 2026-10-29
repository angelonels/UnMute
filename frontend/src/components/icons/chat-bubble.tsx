'use client';

import { useReducedMotion } from '../../hooks/use-reduced-motion';

import { ChatBubbleEmpty } from 'iconoir-react';
import type { Variants } from 'motion/react';
import { m as motion, useAnimation } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

export interface ChatBubbleIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ChatBubbleIconProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

// A brief pointer acknowledgment around Iconoir’s chat silhouette.
const ICON_VARIANTS: Variants = {
  normal: { transform: 'translateY(0px) scale(1)' },
  animate: {
    transform: [
      'translateY(0px) scale(1)',
      'translateY(-1px) scale(1.04)',
      'translateY(0px) scale(1)',
    ],
    transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
  },
};

const ChatBubbleIcon = forwardRef<ChatBubbleIconHandle, ChatBubbleIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 18, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlledRef = useRef(false);
    useEffect(() => {
      if (reduced) {
        controls.stop();
        controls.set('normal');
      }
    }, [controls, reduced]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => (reduced ? controls.set('normal') : controls.start('animate')),
        stopAnimation: () => (reduced ? controls.set('normal') : controls.start('normal')),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          controls.start('animate');
        }
      },
      [controls, onMouseEnter, reduced],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else if (reduced) {
          controls.set('normal');
        } else {
          controls.start('normal');
        }
      },
      [controls, onMouseLeave, reduced],
    );

    return (
      <span
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.span
          animate={controls}
          variants={ICON_VARIANTS}
          className="inline-flex align-middle"
        >
          <ChatBubbleEmpty width={size} height={size} strokeWidth={1.5} aria-hidden="true" />
        </motion.span>
      </span>
    );
  },
);

ChatBubbleIcon.displayName = 'ChatBubbleIcon';

export { ChatBubbleIcon };
