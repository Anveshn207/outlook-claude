import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResumesService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(
    tenantId: string,
    userId: string,
    candidateId: string,
    file: Express.Multer.File,
  ) {
    // Verify candidate belongs to tenant
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
    });

    if (!candidate) {
      throw new BadRequestException(
        `Candidate with ID "${candidateId}" not found in this tenant`,
      );
    }

    // Check if this is the first resume for the candidate
    const existingCount = await this.prisma.resume.count({
      where: { candidateId, tenantId },
    });
    const isPrimary = existingCount === 0;

    // Extract text from PDF files
    let rawText: string | null = null;
    if (file.mimetype === 'application/pdf') {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        const parser = new PDFParse({ data: fileBuffer });
        const textResult = await parser.getText();
        rawText = textResult.text;
        await parser.destroy();
      } catch (error) {
        console.error(
          '[ResumesService] Failed to extract text from PDF:',
          error instanceof Error ? error.message : error,
        );
      }
    }

    const resume = await this.prisma.resume.create({
      data: {
        tenantId,
        candidateId,
        fileUrl: file.path,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        rawText,
        isPrimary,
      },
    });

    return resume;
  }

  async findByCandidate(tenantId: string, candidateId: string) {
    return this.prisma.resume.findMany({
      where: { tenantId, candidateId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, tenantId },
    });

    if (!resume) {
      throw new NotFoundException(`Resume with ID "${id}" not found`);
    }

    return resume;
  }

  async setPrimary(tenantId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, tenantId },
    });

    if (!resume) {
      throw new NotFoundException(`Resume with ID "${id}" not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Set all resumes for this candidate to non-primary
      await tx.resume.updateMany({
        where: { candidateId: resume.candidateId, tenantId },
        data: { isPrimary: false },
      });

      // Set the target resume as primary
      return tx.resume.update({
        where: { id },
        data: { isPrimary: true },
      });
    });
  }

  async remove(tenantId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, tenantId },
    });

    if (!resume) {
      throw new NotFoundException(`Resume with ID "${id}" not found`);
    }

    // Delete file from disk (handle error silently)
    try {
      const filePath = path.resolve(resume.fileUrl);
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(
        '[ResumesService] Failed to delete file from disk:',
        error instanceof Error ? error.message : error,
      );
    }

    await this.prisma.resume.delete({
      where: { id },
    });

    return { deleted: true };
  }
}
