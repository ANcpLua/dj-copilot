// ============================================================
// CodeSonify DJ Copilot - Telemetry (OpenTelemetry → qyl)
// qyl ingests OTLP/HTTP on :4318 (REST readback on :5100).
// Exported spans are redacted: any attribute whose key looks
// secret-bearing, or whose value matches a live credential from
// the environment, never leaves the process.
// ============================================================

import { trace, Tracer } from '@opentelemetry/api';
import { NodeTracerProvider, BatchSpanProcessor, ReadableSpan } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';

const SECRET_KEY_PATTERN = /api[-_.]?key|authorization|bearer|secret|token|password/i;

function secretValues(): string[] {
  return [process.env.FOUNDRY_IQ_API_KEY, process.env.SEARCH_ADMIN_KEY]
    .filter((v): v is string => !!v && v.length > 8);
}

function redact(spans: ReadableSpan[]): void {
  const secrets = secretValues();
  for (const span of spans) {
    const attrs = span.attributes as Record<string, unknown>;
    for (const key of Object.keys(attrs)) {
      if (SECRET_KEY_PATTERN.test(key)) {
        attrs[key] = '[REDACTED]';
      } else if (typeof attrs[key] === 'string' && secrets.some(s => (attrs[key] as string).includes(s))) {
        attrs[key] = '[REDACTED]';
      }
    }
  }
}

class RedactingOTLPExporter extends OTLPTraceExporter {
  export(spans: ReadableSpan[], cb: Parameters<OTLPTraceExporter['export']>[1]): void {
    redact(spans);
    super.export(spans, cb);
  }
}

let provider: NodeTracerProvider | undefined;

/**
 * Register the tracer provider. Safe to call when qyl is down — the
 * exporter fails quietly and the demo keeps running offline.
 */
export function initTelemetry(): void {
  if (provider) return;

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';
  provider = new NodeTracerProvider({
    resource: resourceFromAttributes({ 'service.name': 'codesonify-dj-copilot' }),
    spanProcessors: [
      new BatchSpanProcessor(new RedactingOTLPExporter({ url: `${endpoint}/v1/traces` })),
    ],
  });
  provider.register();
}

/** Force-flush pending spans to qyl before a short-lived process exits. */
export async function shutdownTelemetry(): Promise<void> {
  await provider?.shutdown().catch(() => {});
  provider = undefined;
}

/** Library code uses this; it is a no-op tracer until initTelemetry() runs. */
export function djTracer(): Tracer {
  return trace.getTracer('codesonify-dj-copilot');
}
