import {z} from 'zod';

export const DiagnosticSeveritySchema = z.enum(['error', 'warning', 'info']);
export type DiagnosticSeverity = z.infer<typeof DiagnosticSeveritySchema>;

/** A stable, structured diagnostic emitted by validators, resolver, QC, etc. */
export const DiagnosticSchema = z.strictObject({
  code: z.string().min(1),
  severity: DiagnosticSeveritySchema,
  artifactPath: z.string().min(1).optional(),
  beatId: z.string().min(1).optional(),
  bridgeId: z.string().min(1).optional(),
  nodeId: z.string().min(1).optional(),
  frameRange: z
    .strictObject({from: z.number().int().nonnegative(), to: z.number().int().nonnegative()})
    .optional(),
  evidence: z.string().optional(),
  action: z.string().optional(),
});
export type Diagnostic = z.infer<typeof DiagnosticSchema>;

/** Convenience constructor for an error diagnostic. */
export function errorDiagnostic(
  code: string,
  fields: Omit<Diagnostic, 'code' | 'severity'> = {},
): Diagnostic {
  return {code, severity: 'error', ...fields};
}

export function warningDiagnostic(
  code: string,
  fields: Omit<Diagnostic, 'code' | 'severity'> = {},
): Diagnostic {
  return {code, severity: 'warning', ...fields};
}

export function diagnosticCodes(diagnostics: readonly Diagnostic[]): string[] {
  return diagnostics.map((d) => d.code);
}

export function hasErrors(diagnostics: readonly Diagnostic[]): boolean {
  return diagnostics.some((d) => d.severity === 'error');
}
