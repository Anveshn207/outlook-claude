import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  // ─── Clear existing data (reverse dependency order) ─────────────────────────
  console.log('Clearing existing data...');
  await prisma.$transaction([
    prisma.submissionStageHistory.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.task.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.resume.deleteMany(),
    prisma.savedView.deleteMany(),
    prisma.customField.deleteMany(),
    prisma.pipelineStage.deleteMany(),
    prisma.pipelineTemplate.deleteMany(),
    prisma.job.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.client.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.user.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);
  console.log('Existing data cleared.\n');

  // ─── 1. Tenant ──────────────────────────────────────────────────────────────
  console.log('Creating tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Acme Staffing',
      slug: 'acme-staffing',
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
      },
    },
  });
  console.log(`  Tenant: ${tenant.name} (${tenant.id})`);

  // ─── 2. Users ───────────────────────────────────────────────────────────────
  console.log('\nCreating users...');
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@acme.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Smith',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`  Admin: ${admin.firstName} ${admin.lastName} (${admin.email})`);

  const recruiter1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'sarah@acme.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'RECRUITER',
      isActive: true,
    },
  });
  console.log(`  Recruiter: ${recruiter1.firstName} ${recruiter1.lastName} (${recruiter1.email})`);

  const recruiter2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'mike@acme.com',
      passwordHash,
      firstName: 'Mike',
      lastName: 'Davis',
      role: 'RECRUITER',
      isActive: true,
    },
  });
  console.log(`  Recruiter: ${recruiter2.firstName} ${recruiter2.lastName} (${recruiter2.email})`);

  // ─── 3. Pipeline Template & Stages ──────────────────────────────────────────
  console.log('\nCreating pipeline template...');
  const pipeline = await prisma.pipelineTemplate.create({
    data: {
      tenantId: tenant.id,
      name: 'Default Pipeline',
      isDefault: true,
      stages: {
        create: [
          { name: 'Sourced', order: 0, color: '#6B7280', isTerminal: false },
          { name: 'Submitted', order: 1, color: '#3B82F6', isTerminal: false },
          { name: 'Shortlisted', order: 2, color: '#8B5CF6', isTerminal: false },
          { name: 'Interview', order: 3, color: '#F59E0B', isTerminal: false },
          { name: 'Offered', order: 4, color: '#10B981', isTerminal: false },
          { name: 'Placed', order: 5, color: '#059669', isTerminal: true },
          { name: 'Rejected', order: 6, color: '#EF4444', isTerminal: true },
        ],
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  });
  console.log(`  Pipeline: ${pipeline.name} with ${pipeline.stages.length} stages`);

  const stageSourced = pipeline.stages[0];
  const stageSubmitted = pipeline.stages[1];
  const stageShortlisted = pipeline.stages[2];
  const stageInterview = pipeline.stages[3];
  const stageOffered = pipeline.stages[4];
  const stagePlaced = pipeline.stages[5];
  const stageRejected = pipeline.stages[6];

  // ─── 4. Clients ─────────────────────────────────────────────────────────────
  console.log('\nCreating clients...');
  const techCorp = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'TechCorp Inc',
      industry: 'Technology',
      website: 'https://techcorp.example.com',
      address: '100 Innovation Drive',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      status: 'ACTIVE',
      notes: 'Major technology client with multiple ongoing positions. Primary contact is VP Engineering.',
      createdById: admin.id,
    },
  });
  console.log(`  Client: ${techCorp.name} (${techCorp.status})`);

  const globalFinance = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'Global Finance Ltd',
      industry: 'Finance',
      website: 'https://globalfinance.example.com',
      address: '200 Wall Street',
      city: 'New York',
      state: 'NY',
      country: 'US',
      status: 'ACTIVE',
      notes: 'Long-standing finance client. Requires background checks for all placements.',
      createdById: admin.id,
    },
  });
  console.log(`  Client: ${globalFinance.name} (${globalFinance.status})`);

  const healthFirst = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'HealthFirst Medical',
      industry: 'Healthcare',
      website: 'https://healthfirst.example.com',
      address: '300 Medical Center Blvd',
      city: 'Boston',
      state: 'MA',
      country: 'US',
      status: 'ACTIVE',
      notes: 'Healthcare client. All candidates require valid medical licenses and certifications.',
      createdById: recruiter1.id,
    },
  });
  console.log(`  Client: ${healthFirst.name} (${healthFirst.status})`);

  const dataStream = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'DataStream Analytics',
      industry: 'Technology',
      website: 'https://datastream.example.com',
      address: '400 Data Parkway',
      city: 'Austin',
      state: 'TX',
      country: 'US',
      status: 'PROSPECT',
      notes: 'New prospect in analytics space. Initial meetings scheduled.',
      createdById: recruiter2.id,
    },
  });
  console.log(`  Client: ${dataStream.name} (${dataStream.status})`);

  const retailMax = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'RetailMax Corp',
      industry: 'Retail',
      website: 'https://retailmax.example.com',
      address: '500 Commerce Way',
      city: 'Chicago',
      state: 'IL',
      country: 'US',
      status: 'INACTIVE',
      notes: 'Previously active client. Currently on pause due to budget freeze.',
      createdById: admin.id,
    },
  });
  console.log(`  Client: ${retailMax.name} (${retailMax.status})`);

  // ─── 5. Contacts ────────────────────────────────────────────────────────────
  console.log('\nCreating contacts...');
  const contactJane = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      clientId: techCorp.id,
      firstName: 'Jane',
      lastName: 'Wilson',
      email: 'jane.wilson@techcorp.example.com',
      phone: '(415) 555-0101',
      title: 'VP Engineering',
      isPrimary: true,
      notes: 'Primary hiring contact. Prefers email communication.',
    },
  });
  console.log(`  Contact: ${contactJane.firstName} ${contactJane.lastName} @ TechCorp`);

  const contactBob = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      clientId: techCorp.id,
      firstName: 'Bob',
      lastName: 'Martinez',
      email: 'bob.martinez@techcorp.example.com',
      phone: '(415) 555-0102',
      title: 'Tech Lead',
      isPrimary: false,
      notes: 'Conducts technical interviews for engineering roles.',
    },
  });
  console.log(`  Contact: ${contactBob.firstName} ${contactBob.lastName} @ TechCorp`);

  const contactEmily = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      clientId: globalFinance.id,
      firstName: 'Emily',
      lastName: 'Chen',
      email: 'emily.chen@globalfinance.example.com',
      phone: '(212) 555-0201',
      title: 'HR Director',
      isPrimary: true,
      notes: 'Manages all external recruiter relationships.',
    },
  });
  console.log(`  Contact: ${contactEmily.firstName} ${contactEmily.lastName} @ Global Finance`);

  const contactDavid = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      clientId: globalFinance.id,
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@globalfinance.example.com',
      phone: '(212) 555-0202',
      title: 'Hiring Manager',
      isPrimary: false,
      notes: 'Hiring manager for risk and compliance roles.',
    },
  });
  console.log(`  Contact: ${contactDavid.firstName} ${contactDavid.lastName} @ Global Finance`);

  const contactAmanda = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      clientId: healthFirst.id,
      firstName: 'Amanda',
      lastName: 'Foster',
      email: 'amanda.foster@healthfirst.example.com',
      phone: '(617) 555-0301',
      title: 'Chief Medical Officer',
      isPrimary: true,
      notes: 'Decision maker for all clinical hires. Prefers phone calls.',
    },
  });
  console.log(`  Contact: Dr. ${contactAmanda.firstName} ${contactAmanda.lastName} @ HealthFirst`);

  const contactLisa = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      clientId: healthFirst.id,
      firstName: 'Lisa',
      lastName: 'Park',
      email: 'lisa.park@healthfirst.example.com',
      phone: '(617) 555-0302',
      title: 'Recruiter',
      isPrimary: false,
      notes: 'Internal recruiter coordinating external agency submissions.',
    },
  });
  console.log(`  Contact: ${contactLisa.firstName} ${contactLisa.lastName} @ HealthFirst`);

  // ─── 6. Jobs ────────────────────────────────────────────────────────────────
  console.log('\nCreating jobs...');
  const jobReactDev = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      clientId: techCorp.id,
      contactId: contactJane.id,
      title: 'Senior React Developer',
      description: 'We are looking for an experienced Senior React Developer to join the frontend team at TechCorp. The ideal candidate will build and maintain complex web applications using React, TypeScript, and modern frontend tooling.',
      requirements: '5+ years of React experience. Strong TypeScript skills. Experience with Node.js and REST APIs. Familiarity with CI/CD pipelines and testing frameworks.',
      location: 'San Francisco, CA (Hybrid)',
      jobType: 'FULLTIME',
      status: 'OPEN',
      positionsCount: 2,
      billRate: 150,
      payRate: 95,
      priority: 'HOT',
      skillsRequired: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'Jest'],
      pipelineTemplateId: pipeline.id,
      createdById: recruiter1.id,
    },
  });
  console.log(`  Job: ${jobReactDev.title} @ TechCorp (${jobReactDev.priority})`);

  const jobJavaBackend = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      clientId: techCorp.id,
      contactId: contactBob.id,
      title: 'Java Backend Engineer',
      description: 'TechCorp is seeking a Java Backend Engineer to design and implement scalable microservices. You will work closely with the platform team to build reliable backend systems.',
      requirements: '3+ years of Java/Spring Boot experience. Knowledge of microservices architecture, message queues, and relational databases.',
      location: 'San Francisco, CA (Remote)',
      jobType: 'CONTRACT',
      status: 'OPEN',
      positionsCount: 1,
      billRate: 130,
      payRate: 85,
      priority: 'NORMAL',
      skillsRequired: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL', 'Kafka'],
      pipelineTemplateId: pipeline.id,
      createdById: recruiter1.id,
    },
  });
  console.log(`  Job: ${jobJavaBackend.title} @ TechCorp (${jobJavaBackend.priority})`);

  const jobDevOps = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      clientId: techCorp.id,
      contactId: contactJane.id,
      title: 'DevOps Lead',
      description: 'Lead the DevOps team at TechCorp. Responsible for CI/CD pipelines, cloud infrastructure, and platform reliability across all product lines.',
      requirements: '7+ years in DevOps/SRE roles. AWS or GCP expertise. Terraform, Kubernetes, and monitoring tools experience required.',
      location: 'San Francisco, CA (Hybrid)',
      jobType: 'FULLTIME',
      status: 'ON_HOLD',
      positionsCount: 1,
      billRate: 170,
      payRate: 110,
      priority: 'NORMAL',
      skillsRequired: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Docker', 'Monitoring'],
      pipelineTemplateId: pipeline.id,
      createdById: admin.id,
    },
  });
  console.log(`  Job: ${jobDevOps.title} @ TechCorp (${jobDevOps.priority})`);

  const jobFinancialAnalyst = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      clientId: globalFinance.id,
      contactId: contactEmily.id,
      title: 'Financial Analyst',
      description: 'Global Finance is hiring a Financial Analyst to support portfolio management and financial modeling. You will prepare reports, analyze market trends, and present findings to senior leadership.',
      requirements: '3+ years in financial analysis. CFA preferred. Advanced Excel and financial modeling skills. Experience with Bloomberg Terminal.',
      location: 'New York, NY (On-site)',
      jobType: 'FULLTIME',
      status: 'OPEN',
      positionsCount: 1,
      billRate: 120,
      payRate: 75,
      priority: 'NORMAL',
      skillsRequired: ['Financial Modeling', 'Excel', 'Bloomberg', 'SQL', 'Python'],
      pipelineTemplateId: pipeline.id,
      createdById: recruiter2.id,
    },
  });
  console.log(`  Job: ${jobFinancialAnalyst.title} @ Global Finance (${jobFinancialAnalyst.priority})`);

  const jobRiskManager = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      clientId: globalFinance.id,
      contactId: contactDavid.id,
      title: 'Risk Manager',
      description: 'Seeking an experienced Risk Manager to lead the enterprise risk management program. Responsibilities include identifying, assessing, and mitigating financial and operational risks.',
      requirements: '5+ years in risk management. FRM or PRM certification preferred. Strong regulatory knowledge (Basel III, Dodd-Frank).',
      location: 'New York, NY (Hybrid)',
      jobType: 'CONTRACT',
      status: 'OPEN',
      positionsCount: 1,
      billRate: 160,
      payRate: 100,
      priority: 'HOT',
      skillsRequired: ['Risk Management', 'Basel III', 'Regulatory Compliance', 'SAS', 'Python'],
      pipelineTemplateId: pipeline.id,
      createdById: recruiter2.id,
    },
  });
  console.log(`  Job: ${jobRiskManager.title} @ Global Finance (${jobRiskManager.priority})`);

  const jobNurse = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      clientId: healthFirst.id,
      contactId: contactAmanda.id,
      title: 'Registered Nurse',
      description: 'HealthFirst Medical is seeking Registered Nurses for the ICU department. Candidates must hold a valid RN license and have acute care experience.',
      requirements: 'Active RN license in Massachusetts. 2+ years of ICU or acute care experience. BLS and ACLS certifications required.',
      location: 'Boston, MA (On-site)',
      jobType: 'FULLTIME',
      status: 'OPEN',
      positionsCount: 3,
      billRate: 90,
      payRate: 55,
      priority: 'NORMAL',
      skillsRequired: ['RN License', 'ICU', 'BLS', 'ACLS', 'Patient Care'],
      pipelineTemplateId: pipeline.id,
      createdById: recruiter1.id,
    },
  });
  console.log(`  Job: ${jobNurse.title} @ HealthFirst (${jobNurse.priority})`);

  const jobDataScientist = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      clientId: dataStream.id,
      title: 'Data Scientist',
      description: 'DataStream Analytics is looking for a Data Scientist to develop machine learning models and build data pipelines. This is a contract-to-hire opportunity with a growing analytics startup.',
      requirements: 'MS or PhD in a quantitative field. 3+ years of ML/AI experience. Python, TensorFlow/PyTorch, and SQL proficiency.',
      location: 'Austin, TX (Remote)',
      jobType: 'C2H',
      status: 'OPEN',
      positionsCount: 1,
      billRate: 140,
      payRate: 90,
      priority: 'HOT',
      skillsRequired: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics'],
      pipelineTemplateId: pipeline.id,
      createdById: recruiter2.id,
    },
  });
  console.log(`  Job: ${jobDataScientist.title} @ DataStream (${jobDataScientist.priority})`);

  const jobStoreManager = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      clientId: retailMax.id,
      title: 'Store Manager',
      description: 'RetailMax is hiring a Store Manager for their flagship Chicago location. Responsibilities include staff management, inventory control, and achieving sales targets.',
      requirements: '5+ years of retail management experience. Strong leadership and communication skills. P&L management experience.',
      location: 'Chicago, IL (On-site)',
      jobType: 'FULLTIME',
      status: 'CLOSED',
      positionsCount: 1,
      priority: 'LOW',
      skillsRequired: ['Retail Management', 'P&L', 'Team Leadership', 'Inventory Management'],
      pipelineTemplateId: pipeline.id,
      createdById: admin.id,
    },
  });
  console.log(`  Job: ${jobStoreManager.title} @ RetailMax (${jobStoreManager.priority})`);

  // ─── 7. Candidates ──────────────────────────────────────────────────────────
  console.log('\nCreating candidates...');
  const candidates = await prisma.$transaction([
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Alex',
        lastName: 'Thompson',
        email: 'alex.thompson@gmail.com',
        phone: '(415) 555-1001',
        source: 'LINKEDIN',
        status: 'ACTIVE',
        title: 'Senior Frontend Developer',
        currentEmployer: 'StartupXYZ',
        location: 'San Francisco, CA',
        visaStatus: 'US Citizen',
        linkedinUrl: 'https://linkedin.com/in/alexthompson',
        rate: 95,
        rateType: 'HOURLY',
        availability: 'Immediate',
        skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'CSS'],
        tags: ['frontend', 'senior', 'hot-candidate'],
        customData: {
          visa_status: 'US Citizen',
          linkedin: 'https://linkedin.com/in/alexthompson',
          rate: '$95/hr',
          notice_period: 'Immediate',
        },
        createdById: recruiter1.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@outlook.com',
        phone: '(212) 555-1002',
        source: 'REFERRAL',
        status: 'ACTIVE',
        title: 'Full Stack Developer',
        currentEmployer: 'MegaTech Solutions',
        location: 'New York, NY',
        visaStatus: 'Green Card',
        linkedinUrl: 'https://linkedin.com/in/mariagarcia',
        rate: 85,
        rateType: 'HOURLY',
        availability: '2 weeks',
        skills: ['React', 'Java', 'Spring Boot', 'PostgreSQL', 'AWS'],
        tags: ['fullstack', 'bilingual'],
        customData: {
          visa_status: 'Green Card',
          linkedin: 'https://linkedin.com/in/mariagarcia',
          rate: '$85/hr',
          notice_period: '2 weeks',
        },
        createdById: recruiter1.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@yahoo.com',
        phone: '(617) 555-1003',
        source: 'JOBBOARD',
        status: 'ACTIVE',
        title: 'Java Developer',
        currentEmployer: 'Enterprise Solutions Inc',
        location: 'Boston, MA',
        visaStatus: 'H1B',
        linkedinUrl: 'https://linkedin.com/in/jameswilson',
        rate: 120000,
        rateType: 'ANNUAL',
        availability: '1 month',
        skills: ['Java', 'Spring Boot', 'Kafka', 'Docker', 'Kubernetes'],
        tags: ['backend', 'java'],
        customData: {
          visa_status: 'H1B',
          linkedin: 'https://linkedin.com/in/jameswilson',
          rate: '$120K/yr',
          notice_period: '1 month',
          sponsor_required: true,
        },
        createdById: recruiter2.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@gmail.com',
        phone: '(512) 555-1004',
        source: 'LINKEDIN',
        status: 'ACTIVE',
        title: 'Data Scientist',
        currentEmployer: 'DataMinds Corp',
        location: 'Austin, TX',
        visaStatus: 'OPT',
        linkedinUrl: 'https://linkedin.com/in/priyapatel',
        rate: 90,
        rateType: 'HOURLY',
        availability: '2 weeks',
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'R', 'Statistics'],
        tags: ['data-science', 'ml', 'phd'],
        customData: {
          visa_status: 'OPT',
          linkedin: 'https://linkedin.com/in/priyapatel',
          rate: '$90/hr',
          education: 'PhD Computer Science, UT Austin',
        },
        createdById: recruiter2.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Robert',
        lastName: 'Brown',
        email: 'robert.brown@protonmail.com',
        phone: '(312) 555-1005',
        source: 'DIRECT',
        status: 'PASSIVE',
        title: 'DevOps Engineer',
        currentEmployer: 'CloudNative Systems',
        location: 'Chicago, IL',
        visaStatus: 'US Citizen',
        linkedinUrl: 'https://linkedin.com/in/robertbrown',
        rate: 140000,
        rateType: 'ANNUAL',
        availability: '2 months',
        skills: ['AWS', 'Terraform', 'Kubernetes', 'Docker', 'Python', 'Jenkins'],
        tags: ['devops', 'cloud', 'senior'],
        customData: {
          visa_status: 'US Citizen',
          linkedin: 'https://linkedin.com/in/robertbrown',
          rate: '$140K/yr',
          notice_period: '2 months',
        },
        createdById: recruiter1.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Sarah',
        lastName: 'Lee',
        email: 'sarah.lee@gmail.com',
        phone: '(415) 555-1006',
        source: 'LINKEDIN',
        status: 'PLACED',
        title: 'Senior React Developer',
        currentEmployer: 'TechCorp Inc',
        location: 'San Francisco, CA',
        visaStatus: 'US Citizen',
        linkedinUrl: 'https://linkedin.com/in/sarahlee',
        rate: 100,
        rateType: 'HOURLY',
        availability: 'Currently placed',
        skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'GraphQL'],
        tags: ['frontend', 'placed', 'top-performer'],
        customData: {
          visa_status: 'US Citizen',
          linkedin: 'https://linkedin.com/in/sarahlee',
          rate: '$100/hr',
          placement_date: '2025-11-15',
          placement_client: 'TechCorp Inc',
        },
        createdById: recruiter1.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@outlook.com',
        phone: '(212) 555-1007',
        source: 'REFERRAL',
        status: 'ACTIVE',
        title: 'Financial Analyst',
        currentEmployer: 'Morgan & Associates',
        location: 'New York, NY',
        visaStatus: 'US Citizen',
        linkedinUrl: 'https://linkedin.com/in/michaelchen',
        rate: 110000,
        rateType: 'ANNUAL',
        availability: '2 weeks',
        skills: ['Financial Modeling', 'Excel', 'Bloomberg', 'Python', 'SQL'],
        tags: ['finance', 'cfa'],
        customData: {
          visa_status: 'US Citizen',
          linkedin: 'https://linkedin.com/in/michaelchen',
          rate: '$110K/yr',
          certifications: 'CFA Level III',
        },
        createdById: recruiter2.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Jennifer',
        lastName: 'Adams',
        email: 'jennifer.adams@gmail.com',
        phone: '(617) 555-1008',
        source: 'JOBBOARD',
        status: 'ACTIVE',
        title: 'Registered Nurse',
        currentEmployer: 'Boston General Hospital',
        location: 'Boston, MA',
        visaStatus: 'US Citizen',
        linkedinUrl: 'https://linkedin.com/in/jenniferadams',
        rate: 55,
        rateType: 'HOURLY',
        availability: '2 weeks',
        skills: ['RN License', 'ICU', 'BLS', 'ACLS', 'Critical Care', 'Patient Assessment'],
        tags: ['nursing', 'icu', 'experienced'],
        customData: {
          visa_status: 'US Citizen',
          certifications: 'RN, BLS, ACLS, CCRN',
          license_state: 'MA',
          years_experience: 8,
        },
        createdById: recruiter1.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'David',
        lastName: 'Nguyen',
        email: 'david.nguyen@gmail.com',
        phone: '(408) 555-1009',
        source: 'LINKEDIN',
        status: 'DND',
        title: 'Staff Engineer',
        currentEmployer: 'FAANG Corp',
        location: 'San Jose, CA',
        visaStatus: 'Green Card',
        linkedinUrl: 'https://linkedin.com/in/davidnguyen',
        rate: 200000,
        rateType: 'ANNUAL',
        availability: 'Not looking',
        skills: ['React', 'TypeScript', 'Go', 'Kubernetes', 'System Design'],
        tags: ['senior', 'faang', 'dnd'],
        customData: {
          visa_status: 'Green Card',
          linkedin: 'https://linkedin.com/in/davidnguyen',
          rate: '$200K/yr',
          dnd_reason: 'Recently promoted, not interested in new roles',
          dnd_until: '2026-06-01',
        },
        createdById: recruiter1.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Angela',
        lastName: 'Rodriguez',
        email: 'angela.rodriguez@yahoo.com',
        phone: '(713) 555-1010',
        source: 'REFERRAL',
        status: 'ACTIVE',
        title: 'Risk Analyst',
        currentEmployer: 'Southwest Financial',
        location: 'Houston, TX',
        visaStatus: 'US Citizen',
        linkedinUrl: 'https://linkedin.com/in/angelarodriguez',
        rate: 95000,
        rateType: 'ANNUAL',
        availability: '1 month',
        skills: ['Risk Management', 'Basel III', 'SAS', 'Python', 'Regulatory Compliance'],
        tags: ['finance', 'risk', 'compliance'],
        customData: {
          visa_status: 'US Citizen',
          linkedin: 'https://linkedin.com/in/angelarodriguez',
          rate: '$95K/yr',
          certifications: 'FRM',
        },
        createdById: recruiter2.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Kevin',
        lastName: 'O\'Brien',
        email: 'kevin.obrien@gmail.com',
        phone: '(858) 555-1011',
        source: 'JOBBOARD',
        status: 'ACTIVE',
        title: 'React Developer',
        currentEmployer: 'Freelance',
        location: 'San Diego, CA',
        visaStatus: 'US Citizen',
        linkedinUrl: 'https://linkedin.com/in/kevinobrien',
        rate: 80,
        rateType: 'HOURLY',
        availability: 'Immediate',
        skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML', 'Redux'],
        tags: ['frontend', 'freelance', 'available-now'],
        customData: {
          visa_status: 'US Citizen',
          linkedin: 'https://linkedin.com/in/kevinobrien',
          rate: '$80/hr',
          notice_period: 'Immediate',
          willing_to_relocate: true,
        },
        createdById: recruiter1.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Fatima',
        lastName: 'Hassan',
        email: 'fatima.hassan@outlook.com',
        phone: '(571) 555-1012',
        source: 'LINKEDIN',
        status: 'ACTIVE',
        title: 'Machine Learning Engineer',
        currentEmployer: 'AI Innovations',
        location: 'Washington, DC',
        visaStatus: 'H1B',
        linkedinUrl: 'https://linkedin.com/in/fatimahassan',
        rate: 95,
        rateType: 'HOURLY',
        availability: '2 weeks',
        skills: ['Python', 'PyTorch', 'Machine Learning', 'Deep Learning', 'NLP', 'SQL'],
        tags: ['ml', 'ai', 'nlp'],
        customData: {
          visa_status: 'H1B',
          linkedin: 'https://linkedin.com/in/fatimahassan',
          rate: '$95/hr',
          education: 'MS Computer Science, Georgetown University',
          sponsor_required: true,
        },
        createdById: recruiter2.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Thomas',
        lastName: 'Wright',
        email: 'thomas.wright@gmail.com',
        phone: '(312) 555-1013',
        source: 'DIRECT',
        status: 'PASSIVE',
        title: 'Store Manager',
        currentEmployer: 'BigBox Retail',
        location: 'Chicago, IL',
        visaStatus: 'US Citizen',
        rate: 85000,
        rateType: 'ANNUAL',
        availability: '1 month',
        skills: ['Retail Management', 'P&L', 'Team Leadership', 'Inventory Management', 'CRM'],
        tags: ['retail', 'management'],
        customData: {
          visa_status: 'US Citizen',
          rate: '$85K/yr',
          years_experience: 12,
          notice_period: '1 month',
        },
        createdById: admin.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Lisa',
        lastName: 'Chang',
        email: 'lisa.chang@gmail.com',
        phone: '(617) 555-1014',
        source: 'REFERRAL',
        status: 'ACTIVE',
        title: 'Nurse Practitioner',
        currentEmployer: 'Beacon Hill Health',
        location: 'Boston, MA',
        visaStatus: 'US Citizen',
        linkedinUrl: 'https://linkedin.com/in/lisachang',
        rate: 65,
        rateType: 'HOURLY',
        availability: '2 weeks',
        skills: ['RN License', 'NP License', 'ICU', 'BLS', 'ACLS', 'Pediatric Care'],
        tags: ['nursing', 'np', 'senior'],
        customData: {
          visa_status: 'US Citizen',
          certifications: 'RN, NP, BLS, ACLS',
          license_state: 'MA',
          years_experience: 12,
        },
        createdById: recruiter1.id,
      },
    }),
    prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Marcus',
        lastName: 'Johnson',
        email: 'marcus.johnson@protonmail.com',
        phone: '(646) 555-1015',
        source: 'LINKEDIN',
        status: 'ACTIVE',
        title: 'Senior Java Developer',
        currentEmployer: 'FinTech Startup',
        location: 'New York, NY',
        visaStatus: 'L1',
        linkedinUrl: 'https://linkedin.com/in/marcusjohnson',
        rate: 90,
        rateType: 'HOURLY',
        availability: '2 weeks',
        skills: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL', 'Redis', 'Kafka'],
        tags: ['backend', 'java', 'fintech'],
        customData: {
          visa_status: 'L1',
          linkedin: 'https://linkedin.com/in/marcusjohnson',
          rate: '$90/hr',
          notice_period: '2 weeks',
          sponsor_required: true,
        },
        createdById: recruiter2.id,
      },
    }),
  ]);

  for (const c of candidates) {
    console.log(`  Candidate: ${c.firstName} ${c.lastName} (${c.status}, ${c.source})`);
  }

  // Alias candidates for easier reference
  const [
    cAlex, cMaria, cJames, cPriya, cRobert,
    cSarah, cMichael, cJennifer, cDavid, cAngela,
    cKevin, cFatima, cThomas, cLisa2, cMarcus,
  ] = candidates;

  // ─── 8. Submissions ─────────────────────────────────────────────────────────
  console.log('\nCreating submissions...');
  const submissions = await prisma.$transaction([
    // Alex Thompson -> Senior React Developer (Interview stage)
    prisma.submission.create({
      data: {
        tenantId: tenant.id,
        candidateId: cAlex.id,
        jobId: jobReactDev.id,
        submittedById: recruiter1.id,
        status: 'INTERVIEW',
        payRate: 95,
        billRate: 150,
        notes: 'Strong React candidate with excellent portfolio. Passed phone screen, moving to technical interview.',
        currentStageId: stageInterview.id,
      },
    }),
    // Maria Garcia -> Senior React Developer (Submitted stage)
    prisma.submission.create({
      data: {
        tenantId: tenant.id,
        candidateId: cMaria.id,
        jobId: jobReactDev.id,
        submittedById: recruiter1.id,
        status: 'SUBMITTED',
        payRate: 85,
        billRate: 150,
        notes: 'Full stack developer with strong React skills. Submitted for client review.',
        currentStageId: stageSubmitted.id,
      },
    }),
    // Kevin O'Brien -> Senior React Developer (Shortlisted)
    prisma.submission.create({
      data: {
        tenantId: tenant.id,
        candidateId: cKevin.id,
        jobId: jobReactDev.id,
        submittedById: recruiter1.id,
        status: 'SHORTLISTED',
        payRate: 80,
        billRate: 150,
        notes: 'Freelance React developer. Good skills but less enterprise experience. Client wants to see more candidates.',
        currentStageId: stageShortlisted.id,
      },
    }),
    // Sarah Lee -> Senior React Developer (Placed -- previously placed candidate)
    prisma.submission.create({
      data: {
        tenantId: tenant.id,
        candidateId: cSarah.id,
        jobId: jobReactDev.id,
        submittedById: recruiter1.id,
        status: 'PLACED',
        payRate: 100,
        billRate: 150,
        notes: 'Excellent candidate. Accepted offer and started on Nov 15, 2025.',
        currentStageId: stagePlaced.id,
      },
    }),
    // James Wilson -> Java Backend Engineer (Submitted)
    prisma.submission.create({
      data: {
        tenantId: tenant.id,
        candidateId: cJames.id,
        jobId: jobJavaBackend.id,
        submittedById: recruiter2.id,
        status: 'SUBMITTED',
        payRate: 85,
        billRate: 130,
        notes: 'Solid Java developer with Spring Boot experience. H1B transfer required.',
        currentStageId: stageSubmitted.id,
      },
    }),
    // Marcus Johnson -> Java Backend Engineer (Interview)
    prisma.submission.create({
      data: {
        tenantId: tenant.id,
        candidateId: cMarcus.id,
        jobId: jobJavaBackend.id,
        submittedById: recruiter2.id,
        status: 'INTERVIEW',
        payRate: 90,
        billRate: 130,
        notes: 'Senior Java developer from fintech background. L1 visa. Technical interview scheduled.',
        currentStageId: stageInterview.id,
      },
    }),
    // Michael Chen -> Financial Analyst (Offered)
    prisma.submission.create({
      data: {
        tenantId: tenant.id,
        candidateId: cMichael.id,
        jobId: jobFinancialAnalyst.id,
        submittedById: recruiter2.id,
        status: 'OFFERED',
        payRate: 75,
        billRate: 120,
        notes: 'CFA Level III. Impressed the hiring team. Offer extended at $110K base.',
        currentStageId: stageOffered.id,
      },
    }),
    // Angela Rodriguez -> Risk Manager (Shortlisted)
    prisma.submission.create({
      data: {
        tenantId: tenant.id,
        candidateId: cAngela.id,
        jobId: jobRiskManager.id,
        submittedById: recruiter2.id,
        status: 'SHORTLISTED',
        payRate: 100,
        billRate: 160,
        notes: 'FRM certified with strong Basel III knowledge. Shortlisted for final round.',
        currentStageId: stageShortlisted.id,
      },
    }),
    // Jennifer Adams -> Registered Nurse (Submitted)
    prisma.submission.create({
      data: {
        tenantId: tenant.id,
        candidateId: cJennifer.id,
        jobId: jobNurse.id,
        submittedById: recruiter1.id,
        status: 'SUBMITTED',
        payRate: 55,
        billRate: 90,
        notes: '8 years ICU experience. BLS and ACLS certified. Waiting for credential verification.',
        currentStageId: stageSubmitted.id,
      },
    }),
    // Priya Patel -> Data Scientist (Interview)
    prisma.submission.create({
      data: {
        tenantId: tenant.id,
        candidateId: cPriya.id,
        jobId: jobDataScientist.id,
        submittedById: recruiter2.id,
        status: 'INTERVIEW',
        payRate: 90,
        billRate: 140,
        notes: 'PhD in CS from UT Austin. Strong ML background. OPT status -- will need sponsorship eventually.',
        currentStageId: stageInterview.id,
      },
    }),
  ]);

  for (const s of submissions) {
    console.log(`  Submission: candidate ${s.candidateId} -> job ${s.jobId} (${s.status})`);
  }

  // Alias submissions
  const [
    subAlexReact, subMariaReact, subKevinReact, subSarahReact,
    subJamesJava, subMarcusJava, subMichaelFinance, subAngelaRisk,
    subJenniferNurse, subPriyaData,
  ] = submissions;

  // ─── 9. Interviews ──────────────────────────────────────────────────────────
  console.log('\nCreating interviews...');
  const now = new Date();
  const interviews = await prisma.$transaction([
    // Alex Thompson - Technical Interview for React Dev (upcoming)
    prisma.interview.create({
      data: {
        tenantId: tenant.id,
        submissionId: subAlexReact.id,
        candidateId: cAlex.id,
        jobId: jobReactDev.id,
        type: 'TECHNICAL',
        scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        durationMinutes: 90,
        location: 'Google Meet',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        status: 'SCHEDULED',
        interviewerName: 'Bob Martinez',
        interviewerEmail: 'bob.martinez@techcorp.example.com',
        createdById: recruiter1.id,
      },
    }),
    // Alex Thompson - Completed Phone Screen
    prisma.interview.create({
      data: {
        tenantId: tenant.id,
        submissionId: subAlexReact.id,
        candidateId: cAlex.id,
        jobId: jobReactDev.id,
        type: 'PHONE_SCREEN',
        scheduledAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        durationMinutes: 30,
        location: 'Phone',
        status: 'COMPLETED',
        feedback: 'Strong communication skills. Good understanding of React ecosystem. Recommended for technical round.',
        rating: 4,
        interviewerName: 'Jane Wilson',
        interviewerEmail: 'jane.wilson@techcorp.example.com',
        createdById: recruiter1.id,
      },
    }),
    // Marcus Johnson - Technical Interview for Java Backend (upcoming)
    prisma.interview.create({
      data: {
        tenantId: tenant.id,
        submissionId: subMarcusJava.id,
        candidateId: cMarcus.id,
        jobId: jobJavaBackend.id,
        type: 'TECHNICAL',
        scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        durationMinutes: 60,
        location: 'Zoom',
        meetingLink: 'https://zoom.us/j/1234567890',
        status: 'SCHEDULED',
        interviewerName: 'Bob Martinez',
        interviewerEmail: 'bob.martinez@techcorp.example.com',
        createdById: recruiter2.id,
      },
    }),
    // Priya Patel - Technical Interview for Data Scientist (upcoming)
    prisma.interview.create({
      data: {
        tenantId: tenant.id,
        submissionId: subPriyaData.id,
        candidateId: cPriya.id,
        jobId: jobDataScientist.id,
        type: 'TECHNICAL',
        scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        durationMinutes: 120,
        location: 'Microsoft Teams',
        meetingLink: 'https://teams.microsoft.com/l/meetup-join/abc123',
        status: 'SCHEDULED',
        interviewerName: 'CTO DataStream',
        interviewerEmail: 'cto@datastream.example.com',
        createdById: recruiter2.id,
      },
    }),
    // Michael Chen - Final Interview for Financial Analyst (completed, led to offer)
    prisma.interview.create({
      data: {
        tenantId: tenant.id,
        submissionId: subMichaelFinance.id,
        candidateId: cMichael.id,
        jobId: jobFinancialAnalyst.id,
        type: 'FINAL',
        scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        durationMinutes: 60,
        location: '200 Wall Street, New York, NY',
        status: 'COMPLETED',
        feedback: 'Exceptional candidate. Deep financial modeling knowledge. CFA Level III is a plus. Team unanimously recommends hiring.',
        rating: 5,
        interviewerName: 'Emily Chen',
        interviewerEmail: 'emily.chen@globalfinance.example.com',
        createdById: recruiter2.id,
      },
    }),
  ]);

  for (const i of interviews) {
    console.log(`  Interview: ${i.type} for candidate ${i.candidateId} (${i.status})`);
  }

  // ─── 10. Activities ─────────────────────────────────────────────────────────
  console.log('\nCreating activities...');
  const activities = await prisma.$transaction([
    // Candidate activities
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        entityId: cAlex.id,
        type: 'NOTE',
        subject: 'Initial Screening Notes',
        body: 'Spoke with Alex about the Senior React Developer role at TechCorp. Very interested in the position. Has 6 years of React experience and strong TypeScript skills. Currently at StartupXYZ but looking for a more established company.',
        createdById: recruiter1.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        entityId: cAlex.id,
        type: 'CALL',
        subject: 'Phone Screen Prep Call',
        body: 'Briefed Alex on the TechCorp phone screen format. Discussed salary expectations ($95/hr) and confirmed availability for next week. Sent him the job description and company overview.',
        createdById: recruiter1.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        entityId: cMaria.id,
        type: 'EMAIL',
        subject: 'Resume Submission Confirmation',
        body: 'Sent Maria confirmation that her resume has been submitted to TechCorp for the Senior React Developer position. Explained next steps and expected timeline (1-2 weeks for client feedback).',
        createdById: recruiter1.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        entityId: cJames.id,
        type: 'NOTE',
        subject: 'Visa Status Discussion',
        body: 'James is currently on H1B with Enterprise Solutions Inc. Transfer will be needed. Client (TechCorp) has confirmed they can sponsor H1B transfers for the right candidate.',
        createdById: recruiter2.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        entityId: cPriya.id,
        type: 'CALL',
        subject: 'Initial Introduction Call',
        body: 'Connected with Priya about the Data Scientist role at DataStream Analytics. She has a PhD from UT Austin and 4 years of ML experience. Very excited about the opportunity. Currently on OPT with EAD.',
        createdById: recruiter2.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        entityId: cMichael.id,
        type: 'STATUS_CHANGE',
        subject: 'Moved to Offered',
        body: 'Michael Chen has been extended an offer for the Financial Analyst position at Global Finance. Offer: $110K base + 15% bonus. Waiting for his response.',
        metadata: { fromStatus: 'INTERVIEW', toStatus: 'OFFERED' },
        createdById: recruiter2.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        entityId: cDavid.id,
        type: 'NOTE',
        subject: 'DND - Not Interested',
        body: 'David Nguyen was recently promoted to Staff Engineer at FAANG Corp. Not interested in new roles until at least mid-2026. Marked as DND. Will follow up in Q3 2026.',
        createdById: recruiter1.id,
      },
    }),
    // Job activities
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'job',
        entityId: jobReactDev.id,
        type: 'NOTE',
        subject: 'Job Intake Meeting Notes',
        body: 'Met with Jane Wilson (VP Engineering) to discuss the Senior React Developer position. Team is growing rapidly and needs 2 senior devs ASAP. Tech stack: React, TypeScript, Node.js. Budget approved for up to $150/hr bill rate.',
        createdById: recruiter1.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'job',
        entityId: jobReactDev.id,
        type: 'EMAIL',
        subject: 'Updated Job Description Received',
        body: 'Received updated job description from TechCorp with additional details on the tech stack and team structure. Updated the job listing accordingly.',
        createdById: recruiter1.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'job',
        entityId: jobDevOps.id,
        type: 'STATUS_CHANGE',
        subject: 'Job Put On Hold',
        body: 'TechCorp has put the DevOps Lead position on hold pending budget review for Q1 2026. Will revisit in February.',
        metadata: { fromStatus: 'OPEN', toStatus: 'ON_HOLD' },
        createdById: admin.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'job',
        entityId: jobRiskManager.id,
        type: 'NOTE',
        subject: 'Urgent Hiring Need',
        body: 'David Kim (Hiring Manager) escalated the Risk Manager position to HOT priority. Regulatory audit coming in Q2 and they need someone onboarded by March.',
        createdById: recruiter2.id,
      },
    }),
    // Client activities
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'client',
        entityId: techCorp.id,
        type: 'MEETING',
        subject: 'Quarterly Business Review',
        body: 'Held QBR with TechCorp leadership. Reviewed placements from last quarter (3 successful). Discussed upcoming headcount: 5 new positions expected in Q1 2026. Very satisfied with our service.',
        createdById: admin.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'client',
        entityId: globalFinance.id,
        type: 'CALL',
        subject: 'New Requirements Discussion',
        body: 'Emily Chen called to discuss additional headcount for Q1. They are looking to add 2 more positions: a Compliance Officer and a Quantitative Analyst. Will send formal job descriptions by end of week.',
        createdById: recruiter2.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'client',
        entityId: dataStream.id,
        type: 'EMAIL',
        subject: 'MSA and Rate Card Sent',
        body: 'Sent the Master Services Agreement and rate card to DataStream Analytics for review. They are a new prospect and we are finalizing the commercial terms. Expected turnaround: 1-2 weeks.',
        createdById: recruiter2.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'client',
        entityId: retailMax.id,
        type: 'STATUS_CHANGE',
        subject: 'Client Moved to Inactive',
        body: 'RetailMax has paused all external hiring due to a company-wide budget freeze. Moved to Inactive status. Will check in again in Q2 2026.',
        metadata: { fromStatus: 'ACTIVE', toStatus: 'INACTIVE' },
        createdById: admin.id,
      },
    }),
    // Submission activities
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'submission',
        entityId: subSarahReact.id,
        type: 'SUBMISSION',
        subject: 'Candidate Placed Successfully',
        body: 'Sarah Lee has accepted the offer and started at TechCorp on Nov 15, 2025. Position: Senior React Developer. Bill rate: $150/hr, Pay rate: $100/hr.',
        createdById: recruiter1.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'submission',
        entityId: subAlexReact.id,
        type: 'STATUS_CHANGE',
        subject: 'Moved to Interview Stage',
        body: 'Alex Thompson passed the phone screen with Jane Wilson. Moving to technical interview stage. Technical interview scheduled with Bob Martinez.',
        metadata: { fromStage: 'Submitted', toStage: 'Interview' },
        createdById: recruiter1.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'submission',
        entityId: subMichaelFinance.id,
        type: 'STATUS_CHANGE',
        subject: 'Offer Extended',
        body: 'Global Finance has extended an offer to Michael Chen. Package: $110K base salary, 15% annual bonus, standard benefits. Awaiting candidate response.',
        metadata: { fromStage: 'Interview', toStage: 'Offered' },
        createdById: recruiter2.id,
      },
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        entityType: 'submission',
        entityId: subAngelaRisk.id,
        type: 'NOTE',
        subject: 'Client Feedback - Positive',
        body: 'David Kim provided positive feedback on Angela Rodriguez. Likes her FRM certification and Basel III experience. Moving her to shortlist for final interviews next week.',
        createdById: recruiter2.id,
      },
    }),
  ]);
  console.log(`  Created ${activities.length} activities`);

  // ─── 11. Tasks ──────────────────────────────────────────────────────────────
  console.log('\nCreating tasks...');
  const tasks = await prisma.$transaction([
    prisma.task.create({
      data: {
        tenantId: tenant.id,
        assignedToId: recruiter1.id,
        entityType: 'candidate',
        entityId: cAlex.id,
        title: 'Prep Alex Thompson for TechCorp technical interview',
        description: 'Send Alex the technical interview prep guide and schedule a 30-minute prep call. Ensure he has the Zoom link and knows the format (live coding + system design).',
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        createdById: recruiter1.id,
      },
    }),
    prisma.task.create({
      data: {
        tenantId: tenant.id,
        assignedToId: recruiter2.id,
        entityType: 'candidate',
        entityId: cMichael.id,
        title: 'Follow up on Michael Chen offer response',
        description: 'Michael was extended an offer 3 days ago for the Financial Analyst position. Follow up to check if he has any questions and when we can expect a decision.',
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // tomorrow
        priority: 'HIGH',
        status: 'PENDING',
        createdById: recruiter2.id,
      },
    }),
    prisma.task.create({
      data: {
        tenantId: tenant.id,
        assignedToId: recruiter1.id,
        entityType: 'job',
        entityId: jobNurse.id,
        title: 'Source 5 more RN candidates for HealthFirst',
        description: 'HealthFirst needs 3 nurses total. We only have 1 submission so far. Source at least 5 more qualified RN candidates from job boards and LinkedIn.',
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        priority: 'MEDIUM',
        status: 'PENDING',
        createdById: admin.id,
      },
    }),
    prisma.task.create({
      data: {
        tenantId: tenant.id,
        assignedToId: recruiter2.id,
        entityType: 'client',
        entityId: dataStream.id,
        title: 'Follow up on DataStream MSA signature',
        description: 'MSA and rate card were sent to DataStream Analytics last week. Follow up to check on the status and answer any questions about the terms.',
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        priority: 'MEDIUM',
        status: 'PENDING',
        createdById: admin.id,
      },
    }),
    prisma.task.create({
      data: {
        tenantId: tenant.id,
        assignedToId: admin.id,
        entityType: 'client',
        entityId: techCorp.id,
        title: 'Prepare Q1 2026 staffing forecast for TechCorp',
        description: 'Based on the QBR, TechCorp expects 5 new positions in Q1. Prepare a staffing forecast document with estimated timelines, sourcing strategies, and resource allocation.',
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        priority: 'LOW',
        status: 'PENDING',
        createdById: admin.id,
      },
    }),
  ]);
  console.log(`  Created ${tasks.length} tasks`);

  // ─── 12. Custom Fields ──────────────────────────────────────────────────────
  console.log('\nCreating custom fields...');
  const customFields = await prisma.$transaction([
    prisma.customField.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        fieldName: 'Visa Status',
        fieldKey: 'visa_status',
        fieldType: 'SELECT',
        options: ['H1B', 'Green Card', 'US Citizen', 'OPT', 'L1', 'TN'],
        isRequired: false,
        isFilterable: true,
        isVisibleInList: true,
        displayOrder: 0,
      },
    }),
    prisma.customField.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        fieldName: 'LinkedIn URL',
        fieldKey: 'linkedin_url',
        fieldType: 'URL',
        isRequired: false,
        isFilterable: false,
        isVisibleInList: false,
        displayOrder: 1,
      },
    }),
    prisma.customField.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        fieldName: 'Expected Rate',
        fieldKey: 'expected_rate',
        fieldType: 'CURRENCY',
        isRequired: false,
        isFilterable: true,
        isVisibleInList: true,
        displayOrder: 2,
      },
    }),
    prisma.customField.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        fieldName: 'Availability',
        fieldKey: 'availability',
        fieldType: 'TEXT',
        isRequired: false,
        isFilterable: true,
        isVisibleInList: true,
        displayOrder: 3,
      },
    }),
    prisma.customField.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        fieldName: 'Notice Period',
        fieldKey: 'notice_period',
        fieldType: 'SELECT',
        options: ['Immediate', '2 weeks', '1 month', '2 months'],
        isRequired: false,
        isFilterable: true,
        isVisibleInList: true,
        displayOrder: 4,
      },
    }),
    // Job custom fields
    prisma.customField.create({
      data: {
        tenantId: tenant.id,
        entityType: 'job',
        fieldName: 'Remote Policy',
        fieldKey: 'remote_policy',
        fieldType: 'SELECT',
        options: ['Fully Remote', 'Hybrid', 'On-site'],
        isRequired: false,
        isFilterable: true,
        isVisibleInList: true,
        displayOrder: 0,
      },
    }),
    prisma.customField.create({
      data: {
        tenantId: tenant.id,
        entityType: 'job',
        fieldName: 'Clearance Required',
        fieldKey: 'clearance_required',
        fieldType: 'CHECKBOX',
        isRequired: false,
        isFilterable: true,
        isVisibleInList: true,
        displayOrder: 1,
      },
    }),
    // Client custom fields
    prisma.customField.create({
      data: {
        tenantId: tenant.id,
        entityType: 'client',
        fieldName: 'Payment Terms',
        fieldKey: 'payment_terms',
        fieldType: 'SELECT',
        options: ['Net 15', 'Net 30', 'Net 45', 'Net 60'],
        isRequired: false,
        isFilterable: true,
        isVisibleInList: true,
        displayOrder: 0,
      },
    }),
    prisma.customField.create({
      data: {
        tenantId: tenant.id,
        entityType: 'client',
        fieldName: 'Account Manager Email',
        fieldKey: 'account_manager_email',
        fieldType: 'EMAIL',
        isRequired: false,
        isFilterable: false,
        isVisibleInList: false,
        displayOrder: 1,
      },
    }),
  ]);
  console.log(`  Created ${customFields.length} custom fields`);

  // ─── 13. Saved Views ────────────────────────────────────────────────────────
  console.log('\nCreating saved views...');
  const savedViews = await prisma.$transaction([
    prisma.savedView.create({
      data: {
        tenantId: tenant.id,
        entityType: 'candidate',
        name: 'Active Candidates',
        isDefault: true,
        isShared: true,
        config: {
          filters: { status: 'ACTIVE' },
          sortBy: 'createdAt',
          sortOrder: 'desc',
          visibleColumns: ['name', 'email', 'status', 'source', 'title', 'location', 'skills'],
        },
        createdById: admin.id,
      },
    }),
    prisma.savedView.create({
      data: {
        tenantId: tenant.id,
        entityType: 'job',
        name: 'Open Hot Jobs',
        isDefault: false,
        isShared: true,
        config: {
          filters: { status: 'OPEN', priority: 'HOT' },
          sortBy: 'createdAt',
          sortOrder: 'desc',
          visibleColumns: ['title', 'client', 'status', 'priority', 'location', 'positionsCount'],
        },
        createdById: recruiter1.id,
      },
    }),
    prisma.savedView.create({
      data: {
        tenantId: tenant.id,
        entityType: 'client',
        name: 'Active Clients',
        isDefault: true,
        isShared: true,
        config: {
          filters: { status: 'ACTIVE' },
          sortBy: 'name',
          sortOrder: 'asc',
          visibleColumns: ['name', 'industry', 'status', 'city', 'contacts', 'jobs'],
        },
        createdById: admin.id,
      },
    }),
  ]);
  console.log(`  Created ${savedViews.length} saved views`);

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log(`  Tenant:      1`);
  console.log(`  Users:       3`);
  console.log(`  Pipeline:    1 (${pipeline.stages.length} stages)`);
  console.log(`  Clients:     5`);
  console.log(`  Contacts:    6`);
  console.log(`  Jobs:        8`);
  console.log(`  Candidates:  ${candidates.length}`);
  console.log(`  Submissions: ${submissions.length}`);
  console.log(`  Interviews:  ${interviews.length}`);
  console.log(`  Activities:  ${activities.length}`);
  console.log(`  Tasks:       ${tasks.length}`);
  console.log(`  Custom Fields: ${customFields.length}`);
  console.log(`  Saved Views: ${savedViews.length}`);
  console.log('\nLogin credentials:');
  console.log('  admin@acme.com    / password123 (ADMIN)');
  console.log('  sarah@acme.com    / password123 (RECRUITER)');
  console.log('  mike@acme.com     / password123 (RECRUITER)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
