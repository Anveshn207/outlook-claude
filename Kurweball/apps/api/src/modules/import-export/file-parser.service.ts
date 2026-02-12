import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { ParsedFileResult } from './types/import.types';

@Injectable()
export class FileParserService {
  async parseFile(filePath: string): Promise<ParsedFileResult> {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      raw: false,
      defval: '',
    });

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const fileId = path.basename(filePath, path.extname(filePath));

    return {
      fileId,
      columns,
      sampleRows: rows.slice(0, 10),
      totalRows: rows.length,
    };
  }
}
