import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';
import { PrismaService } from '../../prisma/prisma.service';

interface CandidateDocument {
  tenantId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  title: string | null;
  currentEmployer: string | null;
  location: string | null;
  skills: string;
  resumeText?: string;
  source: string;
  status: string;
  createdAt: Date;
}

interface SearchHit {
  id: string;
  score: number | null;
  highlight: Record<string, string[]> | undefined;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  title: string | null;
  currentEmployer: string | null;
  location: string | null;
  skills: string;
  source: string;
  status: string;
  createdAt: Date;
}

export interface SearchResult {
  data: SearchHit[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

@Injectable()
export class SearchService implements OnModuleInit {
  private client: Client;
  private readonly indexName = 'kurweball-candidates';
  private available = false;

  constructor(private readonly configService: ConfigService) {
    const node = this.configService.get<string>(
      'OPENSEARCH_URL',
      'http://localhost:9200',
    );
    this.client = new Client({ node });
  }

  async onModuleInit(): Promise<void> {
    try {
      const { body: exists } = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                tenantId: { type: 'keyword' },
                firstName: { type: 'text', analyzer: 'standard' },
                lastName: { type: 'text', analyzer: 'standard' },
                fullName: { type: 'text', analyzer: 'standard' },
                email: {
                  type: 'text',
                  analyzer: 'standard',
                  fields: { keyword: { type: 'keyword' } },
                },
                title: { type: 'text', analyzer: 'standard' },
                currentEmployer: { type: 'text', analyzer: 'standard' },
                location: { type: 'text', analyzer: 'standard' },
                skills: { type: 'text', analyzer: 'standard' },
                resumeText: { type: 'text', analyzer: 'standard' },
                source: { type: 'keyword' },
                status: { type: 'keyword' },
                createdAt: { type: 'date' },
              },
            },
          },
        });
        console.warn('[SearchService] Created index: %s', this.indexName);
      }

      this.available = true;
      console.warn('[SearchService] OpenSearch connected');
    } catch (error) {
      this.available = false;
      console.warn(
        '[SearchService] OpenSearch unavailable, search features disabled:',
        error instanceof Error ? error.message : error,
      );
    }
  }

  async indexCandidate(candidate: {
    id: string;
    tenantId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    title: string | null;
    currentEmployer: string | null;
    location: string | null;
    skills: string[];
    source: string;
    status: string;
    createdAt: Date;
  }): Promise<void> {
    if (!this.available) return;

    try {
      const document: CandidateDocument = {
        tenantId: candidate.tenantId,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        fullName: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        title: candidate.title,
        currentEmployer: candidate.currentEmployer,
        location: candidate.location,
        skills: candidate.skills.join(' '),
        source: candidate.source,
        status: candidate.status,
        createdAt: candidate.createdAt,
      };

      await this.client.index({
        index: this.indexName,
        id: candidate.id,
        body: document,
        refresh: 'wait_for',
      });
    } catch (error) {
      console.error(
        '[SearchService] Failed to index candidate %s:',
        candidate.id,
        error instanceof Error ? error.message : error,
      );
    }
  }

  async indexResumeText(
    candidateId: string,
    resumeText: string,
  ): Promise<void> {
    if (!this.available) return;

    try {
      await this.client.update({
        index: this.indexName,
        id: candidateId,
        body: {
          doc: { resumeText },
        },
        refresh: 'wait_for',
      });
    } catch (error) {
      console.error(
        '[SearchService] Failed to index resume text for candidate %s:',
        candidateId,
        error instanceof Error ? error.message : error,
      );
    }
  }

  async searchCandidates(
    tenantId: string,
    query: string,
    filters?: { status?: string; source?: string },
    page = 1,
    limit = 25,
  ): Promise<SearchResult> {
    if (!this.available) {
      return { data: [], meta: { total: 0, page, limit } };
    }

    try {
      const must: object[] = [{ term: { tenantId } }];

      if (filters?.status) {
        must.push({ term: { status: filters.status } });
      }

      if (filters?.source) {
        must.push({ term: { source: filters.source } });
      }

      const from = (page - 1) * limit;

      const { body } = await this.client.search({
        index: this.indexName,
        body: {
          from,
          size: limit,
          query: {
            bool: {
              must,
              should: [
                {
                  multi_match: {
                    query,
                    fields: [
                      'fullName^3',
                      'title^2',
                      'email',
                      'currentEmployer',
                      'location',
                      'skills',
                      'resumeText',
                    ],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
          highlight: {
            fields: {
              fullName: { fragment_size: 150 },
              title: { fragment_size: 150 },
              resumeText: { fragment_size: 150 },
            },
          },
        },
      });

      const hits = body.hits.hits;
      const total =
        typeof body.hits.total === 'number'
          ? body.hits.total
          : body.hits.total?.value ?? 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: SearchHit[] = hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score ?? null,
        highlight: hit.highlight,
        firstName: hit._source.firstName,
        lastName: hit._source.lastName,
        fullName: hit._source.fullName,
        email: hit._source.email,
        title: hit._source.title,
        currentEmployer: hit._source.currentEmployer,
        location: hit._source.location,
        skills: hit._source.skills,
        source: hit._source.source,
        status: hit._source.status,
        createdAt: hit._source.createdAt,
      }));

      return {
        data,
        meta: {
          total,
          page,
          limit,
        },
      };
    } catch (error) {
      console.error(
        '[SearchService] Search failed:',
        error instanceof Error ? error.message : error,
      );
      return { data: [], meta: { total: 0, page, limit } };
    }
  }

  async removeCandidate(candidateId: string): Promise<void> {
    if (!this.available) return;

    try {
      await this.client.delete({
        index: this.indexName,
        id: candidateId,
        refresh: 'wait_for',
      });
    } catch (error) {
      console.error(
        '[SearchService] Failed to remove candidate %s from index:',
        candidateId,
        error instanceof Error ? error.message : error,
      );
    }
  }

  async reindexAll(tenantId: string, prisma: PrismaService): Promise<void> {
    if (!this.available) {
      console.warn(
        '[SearchService] Cannot reindex: OpenSearch is not available',
      );
      return;
    }

    try {
      const candidates = await prisma.candidate.findMany({
        where: { tenantId },
        include: {
          resumes: {
            where: { rawText: { not: null } },
            select: { rawText: true },
            orderBy: { uploadedAt: 'desc' },
            take: 1,
          },
        },
      });

      console.warn(
        '[SearchService] Reindexing %d candidates for tenant %s',
        candidates.length,
        tenantId,
      );

      if (candidates.length === 0) {
        console.warn('[SearchService] No candidates to reindex');
        return;
      }

      const bulkBody: object[] = [];
      for (const candidate of candidates) {
        const resumeText = candidate.resumes[0]?.rawText ?? undefined;

        bulkBody.push({
          index: { _index: this.indexName, _id: candidate.id },
        });
        bulkBody.push({
          tenantId: candidate.tenantId,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          fullName: `${candidate.firstName} ${candidate.lastName}`,
          email: candidate.email,
          title: candidate.title,
          currentEmployer: candidate.currentEmployer,
          location: candidate.location,
          skills: candidate.skills.join(' '),
          resumeText,
          source: candidate.source,
          status: candidate.status,
          createdAt: candidate.createdAt,
        });
      }

      const { body: bulkResponse } = await this.client.bulk({
        body: bulkBody,
        refresh: 'wait_for',
      });

      if (bulkResponse.errors) {
        const errorItems = bulkResponse.items.filter(
          (item: { index?: { error?: unknown } }) => item.index?.error,
        );
        console.error(
          '[SearchService] Bulk index had %d errors',
          errorItems.length,
        );
      }

      console.warn(
        '[SearchService] Reindex complete: %d candidates indexed',
        candidates.length,
      );
    } catch (error) {
      console.error(
        '[SearchService] Reindex failed:',
        error instanceof Error ? error.message : error,
      );
    }
  }
}
