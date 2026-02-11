import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

const userSelect = { id: true, firstName: true, lastName: true };

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(tenantId: string, query: QueryTasksDto) {
    const {
      page = 1,
      limit = 25,
      assignedToId,
      status,
      priority,
      entityType,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = query;

    const where: Prisma.TaskWhereInput = { tenantId };

    if (assignedToId) where.assignedToId = assignedToId;
    if (status) where.status = status as Prisma.EnumTaskStatusFilter['equals'];
    if (priority)
      where.priority = priority as Prisma.EnumTaskPriorityFilter['equals'];
    if (entityType) where.entityType = entityType;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: { select: userSelect },
          createdBy: { select: userSelect },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    console.log(
      `[TasksService] findAll tenant=${tenantId} total=${total} page=${page}`,
    );

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
    const task = await this.prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        assignedTo: { select: userSelect },
        createdBy: { select: userSelect },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    return task;
  }

  async getUpcoming(tenantId: string, limit = 5) {
    const data = await this.prisma.task.findMany({
      where: {
        tenantId,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
      },
      orderBy: [
        { dueDate: { sort: 'asc', nulls: 'last' } },
      ],
      take: limit,
      include: {
        assignedTo: { select: userSelect },
      },
    });

    console.log(
      `[TasksService] getUpcoming tenant=${tenantId} count=${data.length}`,
    );

    return data;
  }

  async create(tenantId: string, userId: string, dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        assignedToId: dto.assignedToId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority,
        status: TaskStatus.PENDING,
        tenantId,
        createdById: userId,
      },
      include: {
        assignedTo: { select: userSelect },
        createdBy: { select: userSelect },
      },
    });

    console.log(
      `[TasksService] created task=${task.id} tenant=${tenantId} by=${userId}`,
    );

    // Notify the assigned user about the new task
    if (dto.assignedToId && dto.assignedToId !== userId) {
      try {
        await this.notificationsService.createNotification({
          tenantId,
          userId: dto.assignedToId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task Assigned',
          message: `You have been assigned: ${dto.title}`,
          link: `/tasks`,
        });
      } catch (err) {
        console.error('[TasksService] Failed to create notification:', err);
      }
    }

    return task;
  }

  async update(tenantId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    const updateData: Prisma.TaskUpdateInput = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.assignedToId !== undefined)
      updateData.assignedTo = { connect: { id: dto.assignedToId } };
    if (dto.dueDate !== undefined)
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (
        dto.status === TaskStatus.COMPLETED &&
        existing.status !== TaskStatus.COMPLETED
      ) {
        updateData.completedAt = new Date();
      }
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: userSelect },
        createdBy: { select: userSelect },
      },
    });

    console.log(`[TasksService] updated task=${id} tenant=${tenantId}`);

    return task;
  }

  async complete(tenantId: string, id: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        assignedTo: { select: userSelect },
        createdBy: { select: userSelect },
      },
    });

    console.log(`[TasksService] completed task=${id} tenant=${tenantId}`);

    return task;
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    await this.prisma.task.delete({ where: { id } });

    console.log(`[TasksService] deleted task=${id} tenant=${tenantId}`);

    return { deleted: true };
  }
}
