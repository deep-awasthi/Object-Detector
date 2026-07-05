'use client'

import Link from 'next/link'
import { ArrowRight, Github, Linkedin, BookOpen, Code, Cloud, Brain, Database } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import styles from './page.module.css'

const topics = [
  { icon: <Code size={20} />, name: 'Backend Engineering', color: '#3B82F6' },
  { icon: <Database size={20} />, name: 'Distributed Systems', color: '#10B981' },
  { icon: <Cloud size={20} />, name: 'Cloud Architecture', color: '#06B6D4' },
  { icon: <Brain size={20} />, name: 'Machine Learning', color: '#EF4444' },
]

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.hero}>
            <div className={styles.avatar}>DA</div>
            <h1 className={styles.name}>Deep Awasthi</h1>
            <p className={styles.role}>Software Engineer & Technical Writer</p>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className={styles.section}>
            <p className={styles.bio}>
              I&apos;m a software engineer with over 8 years of experience building systems that scale.
              I&apos;ve worked on everything from monolithic applications to distributed systems serving
              millions of users. I believe in writing clean, maintainable code and sharing what I learn
              along the way.
            </p>
            <p className={styles.bio}>
              Through DevAtlas, I write about the engineering topics I&apos;m most passionate about &mdash;
              backend development, system design, cloud architecture, and the lessons that come from
              building real software in production.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>What I Write About</h2>
            <div className={styles.topicsGrid}>
              {topics.map((topic) => (
                <div key={topic.name} className={styles.topicCard}>
                  <div className={styles.topicIcon} style={{ background: topic.color + '15', color: topic.color }}>
                    {topic.icon}
                  </div>
                  <span className={styles.topicName}>{topic.name}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Connect</h2>
            <div className={styles.socialLinks}>
              <a href="https://github.com/deep-awasthi" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <Github size={18} /> GitHub
              </a>
              <a href="https://linkedin.com/in/deep-awasthi" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <Linkedin size={18} /> LinkedIn
              </a>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className={styles.section} style={{ textAlign: 'center' }}>
            <Link href="https://deepawasthi.medium.com" className="btn btn-primary">
              Read My Articles <ArrowRight size={16} />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
