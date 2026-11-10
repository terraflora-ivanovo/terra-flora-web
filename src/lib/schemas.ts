import { z } from "zod";

export const businessJsonSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "slug: только латиница, цифры и дефис"),
  name: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().min(5),
  address: z.string().min(1),
  tagline: z.string().min(1),
  about: z.string().min(1),
  heroImage: z.string().min(1),
  steps: z
    .array(
      z.object({
        n: z.string(),
        title: z.string(),
        text: z.string(),
      }),
    )
    .length(3),
  categories: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      sortOrder: z.number().int().nonnegative().default(0),
    }),
  ),
  tags: z
    .array(
      z.object({
        slug: z.string(),
        name: z.string(),
      }),
    )
    .default([]),
  products: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      description: z.string().default(""),
      priceRub: z.number().int().nonnegative(),
      image: z.string(),
      categorySlug: z.string().nullable().default(null),
      tagSlugs: z.array(z.string()).default([]),
      inStock: z.boolean().default(true),
      isPublished: z.boolean().default(true),
      isPopular: z.boolean().default(false),
      isCustom: z.boolean().default(false),
      sortOrder: z.number().int().nonnegative().default(0),
    }),
  ),
  ownerEmail: z.string().email().optional(),
});

export type BusinessJson = z.infer<typeof businessJsonSchema>;

export const orderFormSchema = z.object({
  customerName: z.string().trim().min(1, "Пожалуйста, введите ваше имя"),
  customerPhone: z
    .string()
    .refine((v) => (v.replace(/\D/g, "").startsWith("7") ? v.replace(/\D/g, "").slice(1) : v.replace(/\D/g, "")).length === 10, {
      message: "Пожалуйста, введите корректный номер телефона",
    }),
  comment: z.string().trim().max(1000).optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Нужно согласие на обработку данных" }),
  }),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export const productFormSchema = z.object({
  name: z.string().trim().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().default(""),
  priceRub: z.coerce.number().int().nonnegative(),
  categoryId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).default([]),
  inStock: z.boolean(),
  isPublished: z.boolean(),
  isPopular: z.boolean().default(false),
  isCustom: z.boolean().default(false),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
