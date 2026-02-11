import styles from '@/styles/BluePoster.module.css';

export default function BluePoster() {
    return (
        <div className={styles.poster}>
            <div className={styles.holes}>
                <div className={styles.hole} />
                <div className={styles.hole} />
                <div className={styles.hole} />
            </div>
            <div className={styles.content}>
                <div className={styles.top}>
                    <h2 className={styles.title}>known behaviors</h2>
                    <ul className={styles.list}>
                        <li>Thinks in systems, not logos</li>
                        <li>Designs brands that scale without losing personality</li>
                        <li>Asks &ldquo;why&rdquo; until the room gets quiet</li>
                        <li>Makes unfinished products look ready to exist</li>
                    </ul>
                </div>
                <p className={styles.tagline}>trust is a visual language</p>
            </div>
        </div>
    );
}
