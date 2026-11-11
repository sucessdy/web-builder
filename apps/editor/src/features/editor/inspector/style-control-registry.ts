import { z } from "zod";
import { styleSchema } from "@visual-builder/document-schema";
import styleControlData from "./style-controls.json";

const styleKeys = new Set(Object.keys(styleSchema.shape));
const styleKeySchema = z.string().refine((key) => styleKeys.has(key), "Unknown document style property");

const conditionSchema = z.object({
  key: styleKeySchema,
  values: z.array(z.string()).min(1),
}).strict();

const styleControlSchema = z.object({
  key: styleKeySchema,
  label: z.string().min(1),
  defaultValue: z.string(),
  options: z.array(z.object({
    label: z.string().min(1),
    value: z.string(),
  }).strict()).min(1),
  visibleWhen: conditionSchema.optional(),
  enabledWhen: conditionSchema.optional(),
}).strict().superRefine((control, context) => {
  const propertySchema = styleSchema.shape[control.key as keyof typeof styleSchema.shape];
  if (!propertySchema.safeParse(control.defaultValue).success) {
    context.addIssue({ code: "custom", message: `Invalid default for ${control.key}` });
  }
  control.options.forEach(({ value }, index) => {
    if (!propertySchema.safeParse(value).success) {
      context.addIssue({ code: "custom", path: ["options", index, "value"], message: `Invalid option for ${control.key}` });
    }
  });
});

const styleControlSectionSchema = z.object({
  label: z.string().min(1),
  controls: z.array(styleControlSchema),
}).strict();

export const styleControlSections = z.array(styleControlSectionSchema).parse(styleControlData);
