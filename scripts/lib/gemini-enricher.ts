import { GoogleGenAI, Type } from '@google/genai';
import { IncidentRow, LiveSignal, LiveSignalsData } from '../../src/types/schemas';

export interface GeminiEnrichmentResult {
  activated: boolean;
  signals: LiveSignal[];
  incidentSweepNotes?: LiveSignalsData['incidentSweepNotes'];
}

/**
 * Dormant @google/genai Search-grounding adapter:
 * - When process.env.GEMINI_API_KEY is unset or empty, skips cleanly with zero warnings or errors.
 * - When set in GitHub Secrets, invokes gemini-2.5-flash with Google Search grounding to enrich top signals
 *   and sweep for breaking updates on the 10 tracked incidents.
 */
export async function maybeEnrichWithGemini(params: {
  signals: LiveSignal[];
  trackedIncidents: IncidentRow[];
}): Promise<GeminiEnrichmentResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      activated: false,
      signals: params.signals,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const topSignals = params.signals.slice(0, 6);
    const incidentDigest = params.trackedIncidents
      .map((i) => `${i.eventId} ${i.entity}: ${i.status}`)
      .join('\n');
    const signalDigest = topSignals
      .map((s) => `[${s.id}] (${s.severity}) ${s.title}: ${s.summary}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        'You are a senior critical infrastructure and geopolitical threat analyst.',
        'Correlate the following live OSINT signals against the 10 tracked incidents in our Executive Briefing, and note any breaking public post-mortem updates.',
        '',
        'TRACKED INCIDENTS:',
        incidentDigest,
        '',
        'TOP LIVE SIGNALS:',
        signalDigest,
      ].join('\n'),
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            signalEnrichments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  signalId: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  incidentCorrelations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['signalId', 'summary', 'incidentCorrelations'],
              },
            },
            incidentSweepNotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  eventId: { type: Type.STRING },
                  entity: { type: Type.STRING },
                  latestNote: { type: Type.STRING },
                },
                required: ['eventId', 'entity', 'latestNote'],
              },
            },
          },
          required: ['signalEnrichments', 'incidentSweepNotes'],
        },
      },
    });

    const groundedChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const groundedSources = groundedChunks
      .map((c) => ({
        title: c.web?.title || 'Search Source',
        url: c.web?.uri || '',
      }))
      .filter((s) => s.url.startsWith('http'))
      .slice(0, 5);

    const parsed = JSON.parse(response.text || '{}') as {
      signalEnrichments?: Array<{
        signalId: string;
        summary: string;
        incidentCorrelations: string[];
      }>;
      incidentSweepNotes?: Array<{
        eventId: string;
        entity: string;
        latestNote: string;
      }>;
    };

    const enrichMap = new Map(
      (parsed.signalEnrichments ?? []).map((e) => [e.signalId, e])
    );

    const enrichedSignals = params.signals.map((sig) => {
      const hit = enrichMap.get(sig.id);
      if (!hit) return sig;
      return {
        ...sig,
        aiEnrichment: {
          summary: hit.summary,
          incidentCorrelations: hit.incidentCorrelations,
          groundedSources,
        },
      };
    });

    const incidentSweepNotes = (parsed.incidentSweepNotes ?? []).map((n) => ({
      eventId: n.eventId,
      entity: n.entity,
      latestNote: n.latestNote,
      sources: groundedSources,
    }));

    return {
      activated: true,
      signals: enrichedSignals,
      incidentSweepNotes,
    };
  } catch (err) {
    console.warn(
      '[gemini-enricher] Optional Gemini enrichment failed; continuing with deterministic Zero-Key feeds:',
      err instanceof Error ? err.message : String(err)
    );
    return {
      activated: false,
      signals: params.signals,
    };
  }
}
