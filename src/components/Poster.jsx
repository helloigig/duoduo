import styles from '@/styles/Poster.module.css';

export default function Poster() {
    return (
        <div className={styles.poster}>
            <img src="/cn.svg" alt="DuoDuo 多" className={styles.logo} draggable={false} />
            <div className={styles.lines}>
                <p>Thinks in states, not screens</p>
                <p>Designs for hardware limitations without complaining</p>
                <p>Uses prototypes to end arguments</p>
                <p>Has opinions, but changes them when reality disagrees</p>
            </div>
        </div>
    );
}
