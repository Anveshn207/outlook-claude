import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { QueryInterviewsDto } from './dto/query-interviews.dto';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(tenantId: string, query: QueryInterviewsDto) {
    const {
      page = 1,
      limit = 25,
      candidateId,
      jobId,
      submissionId,
      status,
      type,
      sortBy = 'scheduledAt',
      sortOrder = 'asc',
    } = query;

    const where: Prisma.InterviewWhereInput = { tenantId };

    if (candidateId) where.candidateId = candidateId;
    if (jobId) where.jobId = jobId;
    if (submissionId) where.submissionId = submissionId;
    if (status) where.status = status;
    if (type) where.type = type;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.interview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          candidate: {
            select: { id: true, firstName: true, lastName: true },
          },
          job: {
            select: { id: true, title: true },
          },
          submission: {
            select: { id: true, status: true },
          },
        },
      }),
      this.prisma.interview.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id, tenantId },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: {
          select: {
            id: true,
            title: true,
            client: { select: { id: true, name: true } },
          },
        },
        submission: {
          select: { id: true, status: true, submittedAt: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with id "${id}" not found`);
    }

    return interview;
  }

  async create(tenantId: string, userId: string, dto: CreateInterviewDto) {
    // Verify candidateId belongs to the tenant
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: dto.candidateId, tenantId },
    });

    if (!candidate) {
      throw new BadRequestException(
        `Candidate with id "${dto.candidateId}" not found in your organization`,
      );
    }

    // Verify jobId belongs to the tenant
    const job = await this.prisma.job.findFirst({
      where: { id: dto.jobId, tenantId },
    });

    if (!job) {
      throw new BadRequestException(
        `Job with id "${dto.jobId}" not found in your organization`,
      );
    }

    // If submissionId is provided, verify it belongs to the tenant
    if (dto.submissionId) {
      const submission = await this.prisma.submission.findFirst({
        where: { id: dto.submissionId, tenantId },
      });

      if (!submission) {
        throw new BadRequestException(
          `Submission with id "${dto.submissionId}" not found in your organization`,
        );
      }
    }

    const interview = await this.prisma.interview.create({
      data: {
        tenantId,
        createdById: userId,
        candidateId: dto.candidateId,
        jobId: dto.jobId,
        submissionId: dto.submissionId,
        type: dto.type,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes ?? 60,
        location: dto.location,
        meetingLink: dto.meetingLink,
        interviewerName: dto.interviewerName,
        interviewerEmail: dto.interviewerEmail,
      },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true },
        },
        job: {
          select: { id: true, title: true },
        },
        submission: {
          select: { id: true, status: true },
        },
      },
    });

    // Notify the interview creator (recruiter) about the scheduled interview
    try {
      await this.notificationsService.createNotification({
        tenantId,
        userId,
        type: NotificationType.INTERVIEW_SCHEDULED,
        title: 'Interview Scheduled',
        message: `${interview.candidate.firstName} ${interview.candidate.lastName} — ${interview.job.title} (${dto.type.replace('_', ' ')})`,
        link: `/interviews`,
      });
    } catch (err) {
      console.error('[InterviewsService] Failed to create notification:', err);
    }

    return interview;
  }

  async update(tenantId: string, id: string, dto: UpdateInterviewDto) {
    const existing = await this.prisma.interview.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Interview with id "${id}" not found`);
    }

    // Build update data explicitly to handle date conversion
    const updateData: Prisma.InterviewUpdateInput = {};

    if (dto.candidateId !== undefined) updateData.candidate = { connect: { id: dto.candidateId } };
    if (dto.jobId !== undefined) updateData.job = { connect: { id: dto.jobId } };
    if (dto.submissionId !== undefined) {
      updateData.submission = dto.submissionId
        ? { connect: { id: dto.submissionId } }
        : { disconnect: true };
    }
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.scheduledAt !== undefined) updateData.scheduledAt = new Date(dto.scheduledAt);
    if (dto.durationMinutes !== undefined) updateData.durationMinutes = dto.durationMinutes;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.meetingLink !== undefined) updateData.meetingLink = dto.meetingLink;
    if (dto.interviewerName !== undefined) updateData.interviewerName = dto.interviewerName;
    if (dto.interviewerEmail !== undefined) updateData.interviewerEmail = dto.interviewerEmail;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.feedback !== undefined) updateData.feedback = dto.feedback;
    if (dto.rating !== undefined) updateData.rating = dto.rating;

    return this.prisma.interview.update({
      where: { id },
      data: updateData,
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true },
        },
        job: {
          select: { id: true, title: true },
        },
        submission: {
          select: { id: true, status: true },
        },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.interview.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Interview with id "${id}" not found`);
    }

    await this.prisma.interview.delete({ where: { id } });

    return { deleted: true };
  }
}
