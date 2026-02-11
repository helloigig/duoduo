import styles from '@/styles/NameCard.module.css';

export default function NameCard({ pronoun, name, employeeCode, facts, assignment, avatarSrc }) {
    return (
        <div className={styles.card}>
            <div className={styles.innerStroke}>
                <div className={styles.avatar}>
                    {avatarSrc && <img src={avatarSrc} alt={name} draggable={false} />}
                </div>

                <div className={styles.nameSection}>
                    <div className={styles.label}>{pronoun} name is</div>
                    <div className={styles.name}>{name}</div>
                </div>

                <div className={styles.codeSection}>
                    <div className={styles.label}>employee code</div>
                    <div className={styles.code}>{employeeCode}</div>
                </div>

                <div className={styles.factsSection}>
                    <div className={styles.label}>facts about employee</div>
                    <div className={styles.facts}>{facts}</div>
                </div>

                <div className={styles.assignmentSection}>
                    <div className={styles.label}>current assignment</div>
                    <div className={styles.assignment}>{assignment}</div>
                </div>

                <img src="/duoduo.svg" alt="" className={styles.logo} draggable={false} />

                <div className={styles.footer}>
                    <span className={styles.footerText}>#{employeeCode}</span>
                    <span className={styles.footerText}>do not share</span>
                </div>
            </div>
        </div>
    );
}
