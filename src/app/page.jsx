'use client';

import styles from '@/styles/Home.module.css';
import Spring from '@/components/Spring';

export default function Home() {
    const handleSpringBack = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <main className={styles.main}>
            {/* Left Column: Fixed Sidebar with Spring */}
            <aside className={styles.springContainer}>
                <div className={styles.fixedSpring}>
                    <Spring />
                </div>
            </aside>

            {/* Right Column: Fluid Content */}
            <section className={styles.content}>
                {/* Navigation */}
                <nav className={styles.nav}>
                    <a href="#" className={styles.navLink}>About</a>
                    <a href="#" className={styles.navLink}>Contact</a>
                </nav>

                {/* Project List */}
                <div className={styles.projectList}>
                    {/* Project 1 */}
                    <div className={styles.projectCard}>
                        <div className={styles.projectImagePlaceholder} />
                        <h2 className={styles.projectTitle}>Helios Analytics</h2>
                        <div className={styles.projectMeta}>Data Visualization / 2024</div>
                    </div>

                    {/* Project 2 */}
                    <div className={styles.projectCard}>
                        <div className={styles.projectImagePlaceholder} />
                        <h2 className={styles.projectTitle}>Nebula Workspace</h2>
                        <div className={styles.projectMeta}>Product Design / 2023</div>
                    </div>

                    {/* Project 3 */}
                    <div className={styles.projectCard}>
                        <div className={styles.projectImagePlaceholder} />
                        <h2 className={styles.projectTitle}>Quant Systems</h2>
                        <div className={styles.projectMeta}>Branding / 2023</div>
                    </div>

                    {/* Project 4 */}
                    <div className={styles.projectCard}>
                        <div className={styles.projectImagePlaceholder} />
                        <h2 className={styles.projectTitle}>Aether Labs</h2>
                        <div className={styles.projectMeta}>Web Development / 2022</div>
                    </div>
                </div>

                {/* Spring Back Button */}
                <div className={styles.springBackContainer}>
                    <button onClick={handleSpringBack} className={styles.springBackButton}>
                        Spring Back
                    </button>
                </div>
            </section>
        </main>
    );
}
