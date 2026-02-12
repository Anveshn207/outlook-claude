import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
  HeadingLevel,
  BorderStyle,
} from 'docx';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportFormat } from './types/import.types';

interface ExportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

const CONTENT_TYPES: Record<ExportFormat, string> = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const EXTENSIONS: Record<ExportFormat, string> = {
  csv: 'csv',
  xlsx: 'xlsx',
  docx: 'docx',
};

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportCandidates(
    tenantId: string,
    format: ExportFormat,
    search?: string,
    status?: string,
  ): Promise<ExportResult> {
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const candidates = await this.prisma.candidate.findMany({ where });

    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Title',
      'Employer',
      'Location',
      'Source',
      'Status',
      'Skills',
    ];

    const rows = candidates.map((c) => [
      c.firstName,
      c.lastName,
      c.email ?? '',
      c.phone ?? '',
      c.title ?? '',
      c.currentEmployer ?? '',
      c.location ?? '',
      c.source,
      c.status,
      c.skills.join(', '),
    ]);

    return this.buildExport('candidates', headers, rows, format);
  }

  async exportJobs(
    tenantId: string,
    format: ExportFormat,
    search?: string,
    status?: string,
  ): Promise<ExportResult> {
    const where: any = { tenantId };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    const jobs = await this.prisma.job.findMany({
      where,
      include: { client: true },
    });

    const headers = [
      'Title',
      'Client',
      'Location',
      'Type',
      'Status',
      'Priority',
      'Positions',
      'Bill Rate',
      'Pay Rate',
      'Skills',
    ];

    const rows = jobs.map((j) => [
      j.title,
      j.client.name,
      j.location ?? '',
      j.jobType,
      j.status,
      j.priority,
      String(j.positionsCount),
      j.billRate?.toString() ?? '',
      j.payRate?.toString() ?? '',
      j.skillsRequired.join(', '),
    ]);

    return this.buildExport('jobs', headers, rows, format);
  }

  async exportClients(
    tenantId: string,
    format: ExportFormat,
    search?: string,
    status?: string,
  ): Promise<ExportResult> {
    const where: any = { tenantId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    const clients = await this.prisma.client.findMany({ where });

    const headers = [
      'Name',
      'Industry',
      'Website',
      'City',
      'State',
      'Country',
      'Status',
      'Notes',
    ];

    const rows = clients.map((c) => [
      c.name,
      c.industry ?? '',
      c.website ?? '',
      c.city ?? '',
      c.state ?? '',
      c.country ?? '',
      c.status,
      c.notes ?? '',
    ]);

    return this.buildExport('clients', headers, rows, format);
  }

  async exportSubmissions(
    tenantId: string,
    format: ExportFormat,
    search?: string,
    status?: string,
  ): Promise<ExportResult> {
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { candidate: { firstName: { contains: search, mode: 'insensitive' } } },
        { candidate: { lastName: { contains: search, mode: 'insensitive' } } },
        { job: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const submissions = await this.prisma.submission.findMany({
      where,
      include: {
        candidate: true,
        job: { include: { client: true } },
        submittedBy: true,
        currentStage: true,
      },
    });

    const headers = [
      'Candidate',
      'Email',
      'Job',
      'Client',
      'Status',
      'Stage',
      'Submitted By',
      'Submitted At',
      'Pay Rate',
      'Bill Rate',
    ];

    const rows = submissions.map((s) => [
      `${s.candidate.firstName} ${s.candidate.lastName}`,
      s.candidate.email ?? '',
      s.job.title,
      s.job.client.name,
      s.status,
      s.currentStage?.name ?? '',
      `${s.submittedBy.firstName} ${s.submittedBy.lastName}`,
      s.submittedAt.toISOString().split('T')[0],
      s.payRate?.toString() ?? '',
      s.billRate?.toString() ?? '',
    ]);

    return this.buildExport('submissions', headers, rows, format);
  }

  private async buildExport(
    entity: string,
    headers: string[],
    rows: string[][],
    format: ExportFormat,
  ): Promise<ExportResult> {
    const date = new Date().toISOString().split('T')[0];
    const filename = `${entity}-export-${date}.${EXTENSIONS[format]}`;
    const contentType = CONTENT_TYPES[format];

    let buffer: Buffer;

    switch (format) {
      case 'csv':
        buffer = this.formatCsv(headers, rows);
        break;
      case 'xlsx':
        buffer = this.formatXlsx(headers, rows, entity);
        break;
      case 'docx':
        buffer = await this.formatDocx(headers, rows, entity);
        break;
    }

    return { buffer, filename, contentType };
  }

  private formatCsv(headers: string[], rows: string[][]): Buffer {
    const escapeField = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const lines = [
      headers.map(escapeField).join(','),
      ...rows.map((row) => row.map(escapeField).join(',')),
    ];

    return Buffer.from(lines.join('\n'), 'utf-8');
  }

  private formatXlsx(headers: string[], rows: string[][], sheetName: string): Buffer {
    const data = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(xlsxBuffer);
  }

  private async formatDocx(headers: string[], rows: string[][], title: string): Promise<Buffer> {
    const borderStyle = {
      style: BorderStyle.SINGLE,
      size: 1,
      color: '999999',
    };

    const cellBorders = {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle,
    };

    const headerRow = new TableRow({
      children: headers.map(
        (h) =>
          new TableCell({
            borders: cellBorders,
            width: { size: Math.floor(10000 / headers.length), type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: h, bold: true, size: 20 })],
              }),
            ],
          }),
      ),
    });

    const dataRows = rows.map(
      (row) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                borders: cellBorders,
                width: { size: Math.floor(10000 / headers.length), type: WidthType.DXA },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: cell, size: 18 })],
                  }),
                ],
              }),
          ),
        }),
    );

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: `${title.charAt(0).toUpperCase() + title.slice(1)} Export`,
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({ text: '' }),
            new Table({
              rows: [headerRow, ...dataRows],
            }),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }
}
