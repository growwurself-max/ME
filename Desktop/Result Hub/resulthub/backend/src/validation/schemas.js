const { z } = require('zod');

const nonEmpty = (max = 160) => z.string().trim().min(1).max(max);
const firestoreId = z.string().trim().min(1).max(160);

const loginSchema = z.object({
  username: nonEmpty(80),
  password: z.string().min(6).max(200),
});

const collegeSchema = z.object({
  name: nonEmpty(160),
  principal_name: nonEmpty(160).optional().or(z.literal('')),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  username: nonEmpty(80),
  password: z.string().min(6).max(200),
  subscription_status: z.enum(['trial', 'active', 'expired']).default('active'),
  is_active: z.boolean().default(true),
});

const collegeUpdateSchema = collegeSchema.partial().omit({ password: true });

const subjectSchema = z.object({
  name: nonEmpty(120),
  max_marks: z.coerce.number().positive().max(1000),
  passing_marks: z.coerce.number().min(0).max(1000),
  position: z.coerce.number().int().min(0).default(0),
});

const courseSchema = z.object({
  name: nonEmpty(120),
  enable_percentage: z.boolean().default(true),
  enable_ranking: z.boolean().default(true),
  enable_pass_fail: z.boolean().default(true),
  enable_grade: z.boolean().default(false),
  subjects: z.array(subjectSchema).min(1, 'Configure at least one subject'),
});

const sectionSchema = z.object({
  course_id: firestoreId,
  name: nonEmpty(60),
});

const studentSchema = z.object({
  course_id: firestoreId,
  section_id: firestoreId,
  roll_number: nonEmpty(60),
  hall_ticket_number: nonEmpty(60),
  name: nonEmpty(160),
  marks: z.record(firestoreId, z.coerce.number().min(0)),
});

const studentUpdateSchema = studentSchema.partial().extend({
  marks: z.record(firestoreId, z.coerce.number().min(0)).optional(),
});

const publishSchema = z.object({
  course_id: firestoreId,
  section_id: firestoreId.nullable().optional(),
  published: z.boolean(),
});

const studentLookupSchema = z.object({
  identifier: nonEmpty(60),
});

const passwordSchema = z.object({ password: z.string().min(6).max(200) });

const examSchema = z.object({
  name: nonEmpty(120),
  type: z.enum(['Weekly Test', 'Unit Test']),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  course_id: firestoreId,
  section_id: firestoreId,
});

const examUpdateSchema = examSchema.partial();

const examPublishSchema = z.object({
  exam_id: firestoreId,
  published: z.boolean(),
});

module.exports = {
  loginSchema,
  collegeSchema,
  collegeUpdateSchema,
  courseSchema,
  sectionSchema,
  studentSchema,
  studentUpdateSchema,
  publishSchema,
  studentLookupSchema,
  passwordSchema,
  examSchema,
  examUpdateSchema,
  examPublishSchema,
};
