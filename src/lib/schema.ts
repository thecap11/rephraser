
import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export const journalFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  rollNumber: z.string().min(1, "Roll number is required."),
  classAndSection: z.string().min(1, "Class & Section is required."),
  studyLevel: z.enum(["UG", "PG"], {
    errorMap: () => ({ message: "Please select a study level." }),
  }),
  yearAndTerm: z.string().min(1, "Year & Term is required.").max(200),
  subjectName: z.string().min(3, "Subject name is required.").max(200),
  assessmentName: z.string().min(3, "Assessment name is required.").max(200),
  submissionDate: z.date({
    required_error: "Date of submission is required.",
  }),
  creativity: z.number().min(0).max(1),
  humanize: z.boolean().default(false),
  document: z
    .any()
    .refine((file): file is File => !!file, "A .docx file is required.")
    .refine((file): file is File => file instanceof File, "A .docx file is required.")
    .refine((file) => file?.size > 0, "File cannot be empty.")
    .refine(
      (file) => file?.size <= MAX_FILE_SIZE,
      `File size must be less than 10MB.`
    )
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file?.type),
      "Only .docx files are accepted."
    ),
});

export const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export const signupSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});
