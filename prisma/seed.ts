import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const password = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@123' },
    update: {},
    create: {
      email: 'admin@123',
      name: 'DevAtlas',
      password,
      role: 'ADMIN',
      bio: 'Software engineer passionate about backend engineering, distributed systems, and cloud architecture.',
    },
  })
  console.log('Admin user created:', admin.email)

  // Create categories
  const categories = [
    { name: 'Backend Engineering', slug: 'backend-engineering', description: 'Building robust, scalable server-side systems.', color: '#3B82F6', icon: 'server', order: 0 },
    { name: 'System Design', slug: 'system-design', description: 'Architecting systems for scale and reliability.', color: '#8B5CF6', icon: 'cpu', order: 1 },
    { name: 'Java', slug: 'java', description: 'Deep dives into the Java ecosystem.', color: '#F59E0B', icon: 'coffee', order: 2 },
    { name: 'Distributed Systems', slug: 'distributed-systems', description: 'Patterns and practices for distributed computing.', color: '#10B981', icon: 'database', order: 3 },
    { name: 'Cloud', slug: 'cloud', description: 'Cloud-native architecture and infrastructure.', color: '#06B6D4', icon: 'cloud', order: 4 },
    { name: 'Machine Learning', slug: 'machine-learning', description: 'Applying ML to solve engineering problems.', color: '#EF4444', icon: 'brain', order: 5 },
  ]

  const createdCategories = []
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    createdCategories.push(c)
  }
  console.log(`${createdCategories.length} categories created`)

  // Create tags
  const tagNames = ['microservices', 'spring-boot', 'kubernetes', 'docker', 'postgresql', 'redis', 'kafka', 'grpc', 'rest-api', 'graphql', 'aws', 'gcp', 'terraform', 'ci-cd', 'testing', 'performance', 'security', 'architecture', 'design-patterns', 'concurrency']
  const tags = []
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { slug: name },
      update: {},
      create: { name, slug: name },
    })
    tags.push(tag)
  }
  console.log(`${tags.length} tags created`)

  // Create sample articles
  const articles = [
    {
      title: 'Building Scalable Microservices with Spring Boot and Kubernetes',
      slug: 'building-scalable-microservices',
      contentHtml: '<h2>Introduction</h2><p>Microservices architecture has become the de facto standard for building large-scale distributed systems. In this article, we explore how to design, build, and deploy production-ready microservices using Spring Boot and Kubernetes.</p><h2>Why Microservices?</h2><ul><li><strong>Independent Deployment</strong> — Each service can be deployed independently.</li><li><strong>Technology Flexibility</strong> — Different services can use different technologies.</li><li><strong>Scalability</strong> — Individual services scale independently.</li></ul><h2>Design Principles</h2><p>When designing microservices, follow these key principles: Single Responsibility, Bounded Contexts, and API-First design.</p><blockquote>The art of microservices is knowing where to draw the boundaries.</blockquote><h2>Conclusion</h2><p>Building scalable microservices requires careful planning and adherence to proven patterns.</p>',
      excerpt: 'A deep dive into designing, building, and deploying production-ready microservices.',
      published: true,
      featured: true,
      readingTime: 12,
      categoryId: createdCategories[0].id,
      authorId: admin.id,
    },
    {
      title: 'The Complete System Design Interview Guide for 2025',
      slug: 'system-design-interview-guide',
      contentHtml: '<h2>Introduction</h2><p>System design interviews are a critical part of the technical interview process at top tech companies. This guide covers everything you need to know.</p><h2>Key Concepts</h2><p>Understanding load balancing, caching, database sharding, and message queues is essential.</p><h2>Practice Problems</h2><p>Design a URL shortener, a chat system, and a news feed.</p>',
      excerpt: 'Everything you need to ace system design interviews at top tech companies.',
      published: true,
      featured: true,
      readingTime: 18,
      categoryId: createdCategories[1].id,
      authorId: admin.id,
    },
    {
      title: 'Understanding Distributed Consensus: Raft vs Paxos',
      slug: 'distributed-consensus-algorithms',
      contentHtml: '<h2>Introduction</h2><p>How distributed systems agree on a single value despite failures and network partitions.</p><h2>Raft Protocol</h2><p>Raft is designed to be more understandable than Paxos while providing the same guarantees.</p><h2>Paxos</h2><p>Paxos is the classic consensus algorithm that has been proven correct.</p>',
      excerpt: 'How distributed systems agree on a single value despite failures.',
      published: true,
      readingTime: 15,
      categoryId: createdCategories[3].id,
      authorId: admin.id,
    },
    {
      title: 'Java Concurrency: From Threads to Virtual Threads',
      slug: 'java-concurrency-deep-dive',
      contentHtml: '<h2>Introduction</h2><p>A comprehensive guide to Java concurrency models and how Project Loom changes everything.</p><h2>Traditional Threads</h2><p>Java has supported threads since version 1.0.</p><h2>Virtual Threads</h2><p>Project Loom introduces lightweight virtual threads that dramatically simplify concurrent programming.</p>',
      excerpt: 'A comprehensive guide to Java concurrency models and Project Loom.',
      published: true,
      readingTime: 20,
      categoryId: createdCategories[2].id,
      authorId: admin.id,
    },
    {
      title: 'Cloud-Native Architecture Patterns for Enterprise Applications',
      slug: 'cloud-native-architecture',
      contentHtml: '<h2>Introduction</h2><p>Battle-tested patterns for building resilient, scalable cloud-native applications.</p><h2>Twelve-Factor App</h2><p>The twelve-factor methodology is a methodology for building software-as-a-service apps.</p><h2>Patterns</h2><p>Sidecar, Ambassador, and Circuit Breaker patterns.</p>',
      excerpt: 'Battle-tested patterns for building resilient cloud-native applications.',
      published: true,
      readingTime: 14,
      categoryId: createdCategories[4].id,
      authorId: admin.id,
    },
    {
      title: 'Deploying ML Models in Production: A Practical Guide',
      slug: 'ml-model-deployment',
      contentHtml: '<h2>Introduction</h2><p>End-to-end guide for deploying machine learning models with monitoring and rollback strategies.</p><h2>Model Serving</h2><p>Using TensorFlow Serving, TorchServe, or custom solutions.</p><h2>Monitoring</h2><p>Tracking model performance and data drift in production.</p>',
      excerpt: 'End-to-end guide for deploying machine learning models.',
      published: true,
      readingTime: 16,
      categoryId: createdCategories[5].id,
      authorId: admin.id,
    },
  ]

  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        ...article,
        content: { root: { children: [], type: 'root' } },
        publishedAt: new Date(),
      },
    })
  }
  console.log(`${articles.length} articles created`)

  // Create site settings
  await prisma.siteSettings.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      siteName: 'DevAtlas',
      tagline: 'Crafting knowledge for engineers.',
      description: 'A personal technical blog about backend engineering, distributed systems, system design, cloud, and machine learning.',
      socialLinks: { github: 'https://github.com', linkedin: 'https://linkedin.com', medium: 'https://medium.com' },
      newsletterEnabled: true,
      analyticsEnabled: false,
    },
  })
  console.log('Site settings created')

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
