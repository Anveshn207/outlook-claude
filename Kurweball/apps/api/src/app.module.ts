import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ClientsModule } from './modules/clients/clients.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { SearchModule } from './modules/search/search.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { SavedViewsModule } from './modules/saved-views/saved-views.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { HealthModule } from './modules/health/health.module';
import { InvitesModule } from './modules/invites/invites.module';
import { RolePermissionsModule } from './modules/role-permissions/role-permissions.module';
import { RolesGuard } from './modules/auth/rbac/roles.guard';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RequestLoggerMiddleware } from './common/middleware';
import { validate } from './common/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
      validate,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    CandidatesModule,
    JobsModule,
    ClientsModule,
    PipelineModule,
    SubmissionsModule,
    InterviewsModule,
    ResumesModule,
    SearchModule,
    ActivitiesModule,
    ReportsModule,
    TasksModule,
    CustomFieldsModule,
    SavedViewsModule,
    NotificationsModule,
    UsersModule,
    ImportExportModule,
    HealthModule,
    InvitesModule,
    RolePermissionsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
