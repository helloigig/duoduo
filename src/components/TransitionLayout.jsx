'use client';

import { usePathname } from 'next/navigation';
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { motion, useAnimationControls } from 'framer-motion';
import { useContext, useEffect, useRef, useState } from 'react';

function FrozenRouter({ children }) {
    const context = useContext(LayoutRouterContext);
    const frozen = useRef(context).current;

    return (
        <LayoutRouterContext.Provider value={frozen}>
            {children}
        </LayoutRouterContext.Provider>
    );
}

export default function TransitionLayout({ children }) {
    const pathname = usePathname();
    const controls = useAnimationControls();
    const [visibleChildren, setVisibleChildren] = useState(children);
    const [displayedPath, setDisplayedPath] = useState(pathname);
    const prevPathname = useRef(pathname);
    const latestChildren = useRef(children);
    latestChildren.current = children;

    // Update visible children when on the same route (no transition)
    useEffect(() => {
        if (pathname === prevPathname.current) {
            setVisibleChildren(children);
        }
    }, [pathname, children]);

    // Handle route transitions
    useEffect(() => {
        if (pathname === prevPathname.current) return;

        let cancelled = false;

        const run = async () => {
            // Fade out old content
            await controls.start({ opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } });
            if (cancelled) return;

            // Swap to new content and remount FrozenRouter with new context
            setVisibleChildren(latestChildren.current);
            setDisplayedPath(pathname);
            prevPathname.current = pathname;

            // Wait one frame for React to paint the new content
            await new Promise((r) => requestAnimationFrame(r));
            if (cancelled) return;

            // Fade in new content
            await controls.start({ opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } });
        };

        run();
        return () => { cancelled = true; };
    }, [pathname, controls]);

    return (
        <motion.div
            animate={controls}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
            <FrozenRouter key={displayedPath}>{visibleChildren}</FrozenRouter>
        </motion.div>
    );
}
