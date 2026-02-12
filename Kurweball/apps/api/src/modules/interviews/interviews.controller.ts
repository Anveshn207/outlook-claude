import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { QueryInterviewsDto } from './dto/query-interviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get()
  @RequirePermissions('interviews:read')
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryInterviewsDto,
  ) {
    return this.interviewsService.findAll(user.tenantId, query);
  }

  @Post()
  @RequirePermissions('interviews:create')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.interviewsService.create(user.tenantId, user.id, dto);
  }

  @Get(':id')
  @RequirePermissions('interviews:read')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.interviewsService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('interviews:update')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.interviewsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('interviews:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.interviewsService.remove(user.tenantId, id);
  }
}
