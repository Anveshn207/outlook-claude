import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),
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
  ],
})
export class AppModule {}
