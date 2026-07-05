import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

export const articleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  content: z.any(),
  contentHtml: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500).nullable().optional(),
  coverImage: z.string().url().nullable().optional().or(z.literal('')),
  categoryId: z.string().min(1, 'Category is required'),
  tagIds: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  pinned: z.boolean().default(false),
  seoTitle: z.string().max(70).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
  seoKeywords: z.array(z.string()).default([]),
  canonicalUrl: z.string().url().nullable().optional().or(z.literal('')),
  scheduledAt: z.string().nullable().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  description: z.string().max(500).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  icon: z.string().optional(),
  order: z.number().default(0),
  enabled: z.boolean().default(true),
})

export const settingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  tagline: z.string().max(200).nullable().optional(),
  logo: z.string().url().nullable().optional().or(z.literal('')),
  favicon: z.string().url().nullable().optional().or(z.literal('')),
  description: z.string().max(1000).nullable().optional(),
  socialLinks: z.object({
    github: z.string().url().nullable().optional().or(z.literal('')),
    linkedin: z.string().url().nullable().optional().or(z.literal('')),
    medium: z.string().url().nullable().optional().or(z.literal('')),
    twitter: z.string().url().nullable().optional().or(z.literal('')),
  }).nullable().optional(),
  footerContent: z.string().max(500).nullable().optional(),
  contactEmail: z.string().email().nullable().optional().or(z.literal('')),
  seoDefaultTitle: z.string().max(70).nullable().optional(),
  seoDefaultDesc: z.string().max(160).nullable().optional(),
  analyticsEnabled: z.boolean().default(false),
  newsletterEnabled: z.boolean().default(true),
  emailingEnabled: z.boolean().default(false),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ArticleInput = z.infer<typeof articleSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type SettingsInput = z.infer<typeof settingsSchema>
