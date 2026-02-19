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

// Synonyms for each target field (all pre-normalized: lowercase, no spaces/underscores/hyphens)
const FIELD_ALIASES: Record<string, string[]> = {
  // Candidate
  applicantId: ['applicantid', 'candidateid', 'refid', 'referenceid', 'externalid', 'id'],
  fullName: ['fullname', 'applicantfullname', 'candidatename', 'candidatefullname', 'applicantname', 'name'],
  firstName: ['first', 'fname', 'givenname', 'namefirst'],
  lastName: ['last', 'lname', 'surname', 'familyname', 'namelast'],
  email: ['emailaddress', 'emailid', 'mail', 'emailaddr'],
  phone: ['mobile', 'cell', 'telephone', 'contactnumber', 'mobilenumber', 'cellphone', 'phoneno', 'tel'],
  title: ['position', 'designation', 'role', 'jobrole', 'currenttitle', 'currentrole'],
  currentEmployer: ['company', 'employer', 'organization', 'org', 'currentcompany', 'companyname', 'firm'],
  location: ['city', 'address', 'place', 'area', 'currentlocation', 'loc'],
  state: ['province', 'region'],
  visaStatus: ['visa', 'workauthorization', 'workauth', 'immigrationstatus', 'workstatus', 'authorization'],
  linkedinUrl: ['linkedin', 'linkedinlink', 'linkedinprofile', 'linkedinprofileurl', 'liurl', 'liprofile'],
  rate: ['salary', 'hourlyrate', 'compensation', 'expectedrate', 'currentrate', 'ctc'],
  availability: ['available', 'startdate', 'noticeperiod', 'availablefrom', 'joiningdate', 'notice'],
  dateOfBirth: ['dob', 'birthdate', 'birthday', 'dateofbirth', 'birth'],
  resumeAvailable: ['resumeavailable', 'resume', 'hasresume', 'cvavailable', 'cv'],
  skills: ['skillset', 'technicalskills', 'technologies', 'techstack', 'competencies', 'expertise', 'primaryskills', 'technology'],
  tags: ['labels', 'categories', 'keywords'],
  source: ['leadsource', 'referralsource', 'channel', 'origin', 'candidatesource'],
  status: ['applicantstatus', 'candidatestatus', 'currentstatus'],

  // Job
  clientName: ['client', 'customer', 'account', 'clientcompany', 'vendorclient'],
  description: ['jobdescription', 'jd', 'details', 'summary', 'overview', 'desc'],
  requirements: ['qualifications', 'prereqs', 'prerequisites', 'requiredqualifications', 'mandatoryskills'],
  positionsCount: ['openings', 'headcount', 'numberofpositions', 'vacancies', 'positions', 'noofpositions'],
  billRate: ['billingrate', 'clientrate', 'billrate'],
  payRate: ['pay', 'payrate', 'candidaterate'],
  skillsRequired: ['requiredskills', 'techstack', 'technologies', 'mandatoryskills', 'primaryskills'],
  jobType: ['employmenttype', 'contracttype', 'worktype', 'type', 'engagementtype'],
  priority: ['urgency', 'importance'],

  // Client
  name: ['companyname', 'clientname', 'organization', 'company', 'firm', 'orgname'],
  industry: ['sector', 'vertical', 'domain', 'businesstype', 'industrysector'],
  website: ['url', 'web', 'site', 'homepage', 'webpage', 'companyurl', 'websiteurl'],
  address: ['street', 'streetaddress', 'addr', 'officeaddress'],
  country: ['nation'],
  notes: ['comments', 'remarks', 'additionalinfo', 'info', 'memo'],
};

// Columns that should be auto-skipped (metadata from source systems)
const AUTO_SKIP_COLUMNS = ['createdby', 'createdon', 'createddate', 'modifiedby', 'modifiedon', 'modifieddate', 'updatedby', 'updatedon', 'updateddate', 'lastupdated'];

// Data patterns for detecting field types from sample values
const DATA_PATTERNS: { field: string; test: (val: string) => boolean }[] = [
  { field: 'email', test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
  { field: 'linkedinUrl', test: (v) => /linkedin\.com/i.test(v) },
  { field: 'website', test: (v) => /^https?:\/\//i.test(v) || /\.(com|org|net|io|co)\b/i.test(v) },
  { field: 'phone', test: (v) => /^[\d\s()+\-\.]{7,20}$/.test(v.trim()) },
];

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

    return this.analyzeWithHeuristic(fields, columns, sampleRows);
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
    sampleRows: Record<string, string>[],
  ): ColumnMapping[] {
    const fieldKeys = new Set(fields.map((f) => f.key));
    const usedFields = new Set<string>();

    // Score every column against every field
    const scored = columns.map((column) => {
      const normalized = this.normalize(column);

      // Auto-skip metadata columns (Created By, Created On, etc.)
      if (AUTO_SKIP_COLUMNS.includes(normalized)) {
        return { sourceColumn: column, targetField: 'SKIP', confidence: 0 };
      }

      let bestField = 'SKIP';
      let bestScore = 0;

      for (const field of fields) {
        if (usedFields.has(field.key)) continue;

        const normalizedKey = this.normalize(field.key);
        const normalizedLabel = this.normalize(field.label);
        let score = 0;

        // 1. Exact match on key or label (highest confidence)
        if (normalized === normalizedKey || normalized === normalizedLabel) {
          score = 1.0;
        }
        // 2. Alias/synonym match
        else if (this.matchesAlias(normalized, field.key)) {
          score = 0.9;
        }
        // 3. Substring match (column contains field key/label or vice versa)
        else if (normalizedKey.includes(normalized) || normalized.includes(normalizedKey)) {
          score = 0.8;
        } else if (normalizedLabel.includes(normalized) || normalized.includes(normalizedLabel)) {
          score = 0.75;
        }

        if (score > bestScore) {
          bestScore = score;
          bestField = field.key;
        }
      }

      // 4. Data pattern fallback — analyze sample values for unmapped columns
      if (bestScore < 0.5 && sampleRows.length > 0) {
        const samples = sampleRows.slice(0, 5).map((r) => r[column] ?? '').filter(Boolean);
        if (samples.length > 0) {
          for (const pattern of DATA_PATTERNS) {
            if (!fieldKeys.has(pattern.field) || usedFields.has(pattern.field)) continue;
            const matchCount = samples.filter((s) => pattern.test(s)).length;
            if (matchCount >= Math.ceil(samples.length * 0.6)) {
              bestField = pattern.field;
              bestScore = 0.7;
              break;
            }
          }
        }
      }

      if (bestScore >= 0.5) {
        usedFields.add(bestField);
      }

      return {
        sourceColumn: column,
        targetField: bestScore >= 0.5 ? bestField : 'SKIP',
        confidence: bestScore >= 0.5 ? bestScore : 0,
      };
    });

    return scored;
  }

  /** Check if a normalized column name matches any known alias for the given field key */
  private matchesAlias(normalizedColumn: string, fieldKey: string): boolean {
    const aliases = FIELD_ALIASES[fieldKey];
    if (!aliases) return false;
    return aliases.some(
      (alias) => normalizedColumn === alias || normalizedColumn.includes(alias) || alias.includes(normalizedColumn),
    );
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
