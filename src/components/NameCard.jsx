import styles from '@/styles/NameCard.module.css';

function EmailIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="3.5" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M1.5 5l6.5 4.5L14.5 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
    );
}

function LinkedInIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M4.5 6.5v5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            <circle cx="4.5" cy="4.5" r="0.6" fill="currentColor"/>
            <path d="M7.5 11.5V9a1.5 1.5 0 013 0v2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            <path d="M7.5 8v3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
    );
}

export default function NameCard({
    pronoun,
    name,
    employeeCode,
    facts,
    assignment,
    avatarSrc,
    hideName = false,
    hideLogo = false,
    hideFooter = false,
    email,
    linkedin,
}) {
    return (
        <div className={styles.card}>
            <div className={styles.innerStroke}>
                {avatarSrc && (
                    <div className={styles.avatar}>
                        <img src={avatarSrc} alt={name} draggable={false} />
                    </div>
                )}

                {!hideName && (
                    <div className={styles.nameSection}>
                        <div className={styles.label}>{pronoun} name is</div>
                        <div className={styles.name}>{name}</div>
                    </div>
                )}

                {employeeCode && (
                    <div className={styles.codeSection}>
                        <div className={styles.label}>employee code</div>
                        <div className={styles.code}>{employeeCode}</div>
                    </div>
                )}

                <div className={styles.factsSection}>
                    <div className={styles.label}>facts about employee</div>
                    <div className={styles.facts}>{facts}</div>
                </div>

                <div className={styles.assignmentSection}>
                    <div className={styles.label}>current assignment</div>
                    <div className={styles.assignment}>{assignment}</div>
                </div>

                {!hideLogo && (
                    <img src="/duoduo.svg" alt="" className={styles.logo} draggable={false} />
                )}

                {(email || linkedin) && (
                    <div className={styles.linksSection}>
                        {email && (
                            <a href={`mailto:${email}`} className={styles.linkIcon} aria-label="Email">
                                <EmailIcon />
                            </a>
                        )}
                        {linkedin && (
                            <a href={linkedin} target="_blank" rel="noopener noreferrer" className={styles.linkIcon} aria-label="LinkedIn">
                                <LinkedInIcon />
                            </a>
                        )}
                    </div>
                )}

                {!hideFooter && (
                    <div className={styles.footer}>
                        {employeeCode && <span className={styles.footerText}>#{employeeCode}</span>}
                        <span className={styles.footerText}>do not share</span>
                    </div>
                )}
            </div>
        </div>
    );
}
