import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ImportEntityType,
  ColumnMapping,
  FieldDefinition,
  CANDIDATE_FIELDS,
  JOB_FIELDS,
  CLIENT_FIELDS,
} from './types/import.types';

@Injectable()
export class AiMappingService {
  private readonly logger = new Logger(AiMappingService.name);
  private anthropicClient: any = null;

  constructor(private readonly configService: ConfigService) {
    this.initAnthropicClient();
  }

  private async initAnthropicClient(): Promise<void> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) return;

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      this.anthropicClient = new Anthropic({ apiKey });
      this.logger.log('Anthropic client initialized for AI-powered column mapping');
    } catch {
      this.logger.warn('Failed to initialize Anthropic client, falling back to heuristic matching');
    }
  }

  async analyzeMappings(
    entityType: ImportEntityType,
    columns: string[],
    sampleRows: Record<string, string>[],
  ): Promise<ColumnMapping[]> {
    const fields = this.getFieldDefinitions(entityType);

    if (this.anthropicClient) {
      try {
        return await this.analyzeWithClaude(fields, columns, sampleRows);
      } catch (error) {
        this.logger.warn(`AI mapping failed, falling back to heuristic: ${error.message}`);
      }
    }

    return this.analyzeWithHeuristic(fields, columns);
  }

  private getFieldDefinitions(entityType: ImportEntityType): FieldDefinition[] {
    switch (entityType) {
      case 'candidate':
        return CANDIDATE_FIELDS;
      case 'job':
        return JOB_FIELDS;
      case 'client':
        return CLIENT_FIELDS;
    }
  }

  private analyzeWithHeuristic(
    fields: FieldDefinition[],
    columns: string[],
  ): ColumnMapping[] {
    return columns.map((column) => {
      const normalized = this.normalize(column);
      let bestField = 'SKIP';
      let bestScore = 0;

      for (const field of fields) {
        const normalizedKey = this.normalize(field.key);
        const normalizedLabel = this.normalize(field.label);
        let score = 0;

        if (normalized === normalizedKey) {
          score = 1.0;
        } else if (normalized === normalizedLabel) {
          score = 0.95;
        } else if (normalizedKey.includes(normalized) || normalized.includes(normalizedKey)) {
          score = 0.8;
        } else if (normalizedLabel.includes(normalized) || normalized.includes(normalizedLabel)) {
          score = 0.75;
        }

        if (score > bestScore) {
          bestScore = score;
          bestField = field.key;
        }
      }

      return {
        sourceColumn: column,
        targetField: bestScore >= 0.5 ? bestField : 'SKIP',
        confidence: bestScore >= 0.5 ? bestScore : 0,
      };
    });
  }

  private async analyzeWithClaude(
    fields: FieldDefinition[],
    columns: string[],
    sampleRows: Record<string, string>[],
  ): Promise<ColumnMapping[]> {
    const fieldDescriptions = fields
      .map((f) => {
        let desc = `- "${f.key}" (label: "${f.label}", type: ${f.type}`;
        if (f.required) desc += ', required';
        if (f.enumValues) desc += `, values: [${f.enumValues.join(', ')}]`;
        desc += ')';
        return desc;
      })
      .join('\n');

    const sampleData = sampleRows
      .slice(0, 5)
      .map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`)
      .join('\n');

    const validTargets = [...fields.map((f) => f.key), 'SKIP'];

    const prompt = `You are a data mapping assistant. Map source columns from an uploaded file to the target entity fields.

Target fields:
${fieldDescriptions}

Source columns: ${JSON.stringify(columns)}

Sample data:
${sampleData}

For each source column, determine the best matching target field. Use "SKIP" if no field matches well.

Respond with ONLY a JSON array of objects, each with:
- "sourceColumn": the original column name
- "targetField": the matching field key or "SKIP"
- "confidence": a number between 0 and 1

JSON response:`;

    const response = await this.anthropicClient.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in AI response');
    }

    const parsed: ColumnMapping[] = JSON.parse(jsonMatch[0]);

    return parsed.map((mapping) => ({
      sourceColumn: mapping.sourceColumn,
      targetField: validTargets.includes(mapping.targetField) ? mapping.targetField : 'SKIP',
      confidence: Math.max(0, Math.min(1, Number(mapping.confidence) || 0)),
    }));
  }

  private normalize(value: string): string {
    return value.toLowerCase().replace(/[\s_\-]/g, '');
  }
}
