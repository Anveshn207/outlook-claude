import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { ParsedFileResult } from './types/import.types';

@Injectable()
export class FileParserService {
  private readonly logger = new Logger(FileParserService.name);

  async parseFile(filePath: string, originalName?: string): Promise<ParsedFileResult> {
    // Multer saves files without extensions. Read the buffer and use
    // the original filename extension to determine the correct format.
    const ext = originalName
      ? path.extname(originalName).toLowerCase()
      : path.extname(filePath).toLowerCase();

    const buf = fs.readFileSync(filePath);
    const workbook = ext === '.csv'
      ? XLSX.read(buf.toString('utf-8'), { type: 'string' })
      : XLSX.read(buf, { type: 'buffer' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Detect the real header row — many exported files have title/metadata
    // rows (e.g. "Period: All") before the actual column headers.
    const headerRow = this.detectHeaderRow(sheet);
    this.logger.log(`[FileParser] Detected header row index: ${headerRow}`);

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      raw: false,
      defval: '',
      range: headerRow,
    });

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const fileId = path.basename(filePath);

    this.logger.log(`[FileParser] Parsed ${rows.length} rows, ${columns.length} columns: ${columns.join(', ')}`);

    return {
      fileId,
      columns,
      sampleRows: rows.slice(0, 10),
      totalRows: rows.length,
    };
  }

  /**
   * Detect the actual header row in a sheet. Exported spreadsheets often
   * have title rows, filter descriptions, or blank rows before the real
   * column headers. We scan the first 10 rows and pick the first one
   * that looks like a proper header (multiple unique non-empty text values).
   */
  detectHeaderRow(sheet: XLSX.WorkSheet): number {
    const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
    });

    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const cells = (rawRows[i] || []).map((c) => (c ?? '').toString().trim());
      const nonEmpty = cells.filter((c) => c.length > 0);

      // A valid header row should have at least 3 non-empty cells
      if (nonEmpty.length < 3) continue;

      // Values should be unique (column headers shouldn't repeat)
      const unique = new Set(nonEmpty.map((v) => v.toLowerCase()));
      if (unique.size < nonEmpty.length * 0.8) continue;

      // Values should look like text labels, not data
      const looksLikeLabels = nonEmpty.every(
        (v) => isNaN(Number(v)) && !/^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/.test(v),
      );
      if (!looksLikeLabels) continue;

      return i;
    }

    return 0; // Default to first row
  }
}
