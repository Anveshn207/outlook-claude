import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { ParsedFileResult } from './types/import.types';

@Injectable()
export class FileParserService {
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

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      raw: false,
      defval: '',
    });

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const fileId = path.basename(filePath);

    return {
      fileId,
      columns,
      sampleRows: rows.slice(0, 10),
      totalRows: rows.length,
    };
  }
}
