import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { FileParserService } from './file-parser.service';
import { AiMappingService } from './ai-mapping.service';
import {
  ImportEntityType,
  ColumnMapping,
  ParsedFileResult,
  ImportResult,
  FieldDefinition,
  CANDIDATE_FIELDS,
  JOB_FIELDS,
  CLIENT_FIELDS,
} from './types/import.types';

const BATCH_SIZE = 100;

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileParser: FileParserService,
    private readonly aiMapping: AiMappingService,
  ) {}

  /**
   * Step 1: Upload a file and parse it to extract columns and sample rows.
   */
  async uploadAndParse(
    tenantId: string,
    file: Express.Multer.File,
    entityType: ImportEntityType,
  ): Promise<ParsedFileResult> {
    return this.fileParser.parseFile(file.path, file.originalname);
  }

  /**
   * Step 2: Analyze column mappings using AI or heuristic matching.
   */
  async analyzeMappings(
    entityType: ImportEntityType,
    columns: string[],
    sampleRows: Record<string, string>[],
  ): Promise<ColumnMapping[]> {
    return this.aiMapping.analyzeMappings(entityType, columns, sampleRows);
  }

  /**
   * Step 3: Execute the import using confirmed mappings.
   */
  async executeImport(
    tenantId: string,
    userId: string,
    fileId: string,
    entityType: ImportEntityType,
    mappings: ColumnMapping[],
  ): Promise<ImportResult> {
    const baseDir = path.resolve('./uploads/imports');
    const safeName = path.basename(fileId); // Strip directory components
    const filePath = path.resolve(baseDir, safeName);
    if (!filePath.startsWith(baseDir)) {
      throw new BadRequestException('Invalid file ID');
    }
    const allRows = await this.getAllRows(filePath);
    const fieldDefs = this.getFieldDefinitions(entityType);

    // Fetch custom field definitions so we can populate customData
    const entityTypeMap: Record<string, string> = { candidate: 'candidate', job: 'job', client: 'client' };
    const customFields = await this.prisma.customField.findMany({
      where: { tenantId, entityType: entityTypeMap[entityType] },
      select: { fieldKey: true, fieldName: true },
    });

    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    const activeMappings = mappings.filter((m) => m.targetField !== 'SKIP');

    // Process rows in batches
    for (let batchStart = 0; batchStart < allRows.length; batchStart += BATCH_SIZE) {
      const batch = allRows.slice(batchStart, batchStart + BATCH_SIZE);
      const createDataBatch: { data: Record<string, any>; rowIndex: number }[] = [];

      for (let i = 0; i < batch.length; i++) {
        const rowIndex = batchStart + i + 1; // 1-based row number for error reporting
        const row = batch[i];

        try {
          const data = await this.transformRow(
            row,
            activeMappings,
            fieldDefs,
            entityType,
            tenantId,
            userId,
          );

          if (!data) {
            result.skipped++;
            result.errors.push({ row: rowIndex, message: 'Missing required fields' });
            continue;
          }

          // Populate customData for matching custom field definitions
          if (customFields.length > 0) {
            data.customData = this.buildCustomData(data, customFields);
          }

          createDataBatch.push({ data, rowIndex });
        } catch (error) {
          result.skipped++;
          result.errors.push({
            row: rowIndex,
            message: error instanceof Error ? error.message : String(error),
          });
          this.logger.warn(`[ImportService] Row ${rowIndex} transform error: ${error}`);
        }
      }

      // Execute batch within a transaction
      if (createDataBatch.length > 0) {
        try {
          await this.prisma.$transaction(
            createDataBatch.map(({ data }) =>
              this.createEntity(entityType, data),
            ),
          );
          result.created += createDataBatch.length;
        } catch (error) {
          // If batch transaction fails, fall back to individual inserts
          this.logger.warn(
            `[ImportService] Batch transaction failed, retrying individually: ${error}`,
          );
          for (const { data, rowIndex } of createDataBatch) {
            try {
              await this.createEntity(entityType, data);
              result.created++;
            } catch (individualError) {
              result.skipped++;
              result.errors.push({
                row: rowIndex,
                message:
                  individualError instanceof Error
                    ? individualError.message
                    : String(individualError),
              });
              this.logger.warn(
                `[ImportService] Row ${rowIndex} insert error: ${individualError}`,
              );
            }
          }
        }
      }
    }

    // Clean up the temp file
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore cleanup errors
    }

    this.logger.log(
      `[ImportService] Import complete: ${result.created} created, ${result.skipped} skipped, ${result.errors.length} errors`,
    );

    return result;
  }

  /**
   * Re-read the file to get ALL rows (not just the sample).
   * Uses the same header-row detection as the file parser so column names match.
   */
  private async getAllRows(filePath: string): Promise<Record<string, string>[]> {
    const XLSX = await import('xlsx');
    const buf = await fs.readFile(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const headerRow = this.fileParser.detectHeaderRow(sheet);
    this.logger.log(`[ImportService] getAllRows: header row index=${headerRow}`);

    return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      raw: false,
      defval: '',
      range: headerRow,
    });
  }

  /**
   * Transform a raw row into entity create data based on mappings and field definitions.
   * Returns null if required fields are missing.
   */
  private async transformRow(
    row: Record<string, string>,
    mappings: ColumnMapping[],
    fieldDefs: FieldDefinition[],
    entityType: ImportEntityType,
    tenantId: string,
    userId: string,
  ): Promise<Record<string, any> | null> {
    const data: Record<string, any> = {};
    const fieldDefMap = new Map(fieldDefs.map((f) => [f.key, f]));
    let clientName: string | null = null;

    for (const mapping of mappings) {
      const rawValue = row[mapping.sourceColumn];
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        continue;
      }

      const targetField = mapping.targetField;

      // Special handling: fullName → split into firstName + lastName
      if (targetField === 'fullName') {
        const trimmed = rawValue.trim();
        const spaceIdx = trimmed.indexOf(' ');
        if (spaceIdx > 0) {
          data.firstName = data.firstName || trimmed.slice(0, spaceIdx);
          data.lastName = data.lastName || trimmed.slice(spaceIdx + 1).trim();
        } else {
          data.firstName = data.firstName || trimmed;
          data.lastName = data.lastName || trimmed;
        }
        continue;
      }

      // Special handling: jobs with clientName need client lookup
      if (entityType === 'job' && targetField === 'clientName') {
        clientName = rawValue.trim();
        continue;
      }

      const fieldDef = fieldDefMap.get(targetField);
      if (!fieldDef) {
        // Target field not in definitions; store as-is
        data[targetField] = rawValue;
        continue;
      }

      data[targetField] = this.coerceValue(rawValue, fieldDef);
    }

    // Resolve clientName to clientId for jobs
    if (entityType === 'job') {
      if (clientName) {
        const client = await this.prisma.client.findFirst({
          where: { tenantId, name: { equals: clientName, mode: 'insensitive' } },
          select: { id: true },
        });

        if (client) {
          data.clientId = client.id;
        } else {
          throw new Error(`Client not found: "${clientName}"`);
        }
      }

      // clientId is required for jobs
      if (!data.clientId) {
        throw new Error('Missing required field: Client Name');
      }
    }

    // Check required fields
    const requiredFields = fieldDefs
      .filter((f) => f.required)
      .filter((f) => !(entityType === 'job' && f.key === 'clientName'));

    const missingFields: string[] = [];
    for (const field of requiredFields) {
      if (data[field.key] === undefined || data[field.key] === null || data[field.key] === '') {
        missingFields.push(field.label);
      }
    }
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Attach tenant and creator
    data.tenantId = tenantId;
    data.createdById = userId;

    return data;
  }

  /**
   * Coerce a raw string value to the correct type based on the field definition.
   */
  private coerceValue(rawValue: string, fieldDef: FieldDefinition): any {
    switch (fieldDef.type) {
      case 'array':
        return rawValue
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0);

      case 'number': {
        const parsed = parseFloat(rawValue);
        return isNaN(parsed) ? undefined : parsed;
      }

      case 'date': {
        const parsed = new Date(rawValue);
        return isNaN(parsed.getTime()) ? undefined : parsed;
      }

      case 'enum': {
        const upper = rawValue.toUpperCase().replace(/[\s_-]+/g, '_');
        // If the value directly matches an allowed enum, use it
        if (fieldDef.enumValues?.includes(upper)) return upper;
        // Otherwise, try smart mapping for known fields
        return this.mapEnumValue(fieldDef.key, rawValue, fieldDef.enumValues) ?? upper;
      }

      case 'string':
      default:
        return rawValue;
    }
  }

  /**
   * Map common real-world values to their closest enum counterpart.
   * Returns undefined if no mapping found (falls back to raw uppercase).
   */
  private mapEnumValue(
    fieldKey: string,
    rawValue: string,
    allowedValues?: string[],
  ): string | undefined {
    const lower = rawValue.toLowerCase().trim();

    if (fieldKey === 'source') {
      // Job board names → JOBBOARD
      const jobBoards = [
        'dice', 'indeed', 'monster', 'ziprecruiter', 'jooble',
        'neuvoo', 'adzuna', 'glassdoor', 'careerbuilder', 'dr.job',
        'simplyhired', 'google jobs', 'talent.com', 'naukri',
      ];
      if (jobBoards.some((jb) => lower.includes(jb))) return 'JOBBOARD';
      if (lower.includes('linkedin')) return 'LINKEDIN';
      if (lower.includes('referral') || lower.includes('referred')) return 'REFERRAL';
      if (lower.includes('direct') || lower.includes('walk-in') || lower.includes('career portal')) return 'DIRECT';
      return 'OTHER';
    }

    if (fieldKey === 'status') {
      if (['active', 'new', 'new lead', 'available', 'open'].some((s) => lower.includes(s))) return 'ACTIVE';
      if (['passive', 'not looking', 'not active'].some((s) => lower.includes(s))) return 'PASSIVE';
      if (['placed', 'hired', 'joined', 'closed'].some((s) => lower.includes(s))) return 'PLACED';
      if (['dnd', 'do not disturb', 'do not contact', 'blacklist'].some((s) => lower.includes(s))) return 'DND';
      return allowedValues?.[0] ?? 'ACTIVE';
    }

    return undefined;
  }

  /**
   * Build customData JSON from imported data and tenant custom field definitions.
   * Maps model column values to their corresponding custom field keys.
   */
  private buildCustomData(
    data: Record<string, any>,
    customFields: { fieldKey: string; fieldName: string }[],
  ): Record<string, any> {
    // Map model column names to custom field keys
    const modelToCustom: Record<string, string[]> = {};
    for (const cf of customFields) {
      const cfKeyNorm = cf.fieldKey.toLowerCase().replace(/[\s_\-]/g, '');
      const cfNameNorm = cf.fieldName.toLowerCase().replace(/[\s_\-]/g, '');
      // Check all data keys for matches
      for (const dataKey of Object.keys(data)) {
        const dkNorm = dataKey.toLowerCase().replace(/[\s_\-]/g, '');
        if (dkNorm === cfKeyNorm || dkNorm === cfNameNorm) {
          if (!modelToCustom[dataKey]) modelToCustom[dataKey] = [];
          modelToCustom[dataKey].push(cf.fieldKey);
        }
      }
    }

    const customData: Record<string, any> = {};
    for (const [dataKey, cfKeys] of Object.entries(modelToCustom)) {
      const value = data[dataKey];
      if (value !== undefined && value !== null && value !== '') {
        for (const cfKey of cfKeys) {
          customData[cfKey] = value instanceof Date ? value.toISOString() : String(value);
        }
      }
    }

    return customData;
  }

  /**
   * Create a single entity in the database using Prisma.
   */
  private createEntity(entityType: ImportEntityType, data: Record<string, any>) {
    switch (entityType) {
      case 'candidate':
        return this.prisma.candidate.create({ data });
      case 'job':
        return this.prisma.job.create({ data });
      case 'client':
        return this.prisma.client.create({ data });
    }
  }

  /**
   * Get field definitions for the given entity type.
   */
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
}
