import type { TestInfo } from '@playwright/test';
import { AuthenticatedApi } from './api.js';

type CleanupAction = {
  label: string;
  run: () => Promise<void>;
};

type ApiQuery = Record<string, string | number | boolean>;

export class MutationTestRun {
  readonly runId: string;
  private readonly actions: CleanupAction[] = [];

  constructor(testInfo: TestInfo) {
    this.runId = `e2e-${Date.now()}-${testInfo.workerIndex}-${testInfo.repeatEachIndex}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  marker(prefix: string): string {
    return `${prefix}-${this.runId}`;
  }

  ruc(): string {
    const suffix = `${Date.now()}${this.runId.replace(/\D/g, '')}`.slice(-10);
    return `099${suffix}`;
  }

  register(label: string, run: () => Promise<void>): void {
    this.actions.push({ label, run });
  }

  registerDelete(api: AuthenticatedApi, path: string, label = path): void {
    this.register(label, async () => {
      await api.delete(path, { ignoreMissing: true });
    });
  }

  registerSearchDelete<T extends { id: string }>(
    api: AuthenticatedApi,
    listPath: string,
    query: ApiQuery,
    resourcePath: (id: string) => string,
    label: string,
  ): void {
    this.register(label, async () => {
      const resources = await api.get<T[]>(listPath, query);
      for (const resource of resources) {
        const path = resourcePath(resource.id);
        await api.delete(path, { ignoreMissing: true });
        await api.expectMissing(path);
      }
    });
  }

  async cleanup(): Promise<void> {
    const errors: string[] = [];

    for (const action of [...this.actions].reverse()) {
      try {
        await action.run();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown cleanup error';
        errors.push(`${action.label}: ${message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Mutable E2E cleanup failed for ${this.runId}: ${errors.join('; ')}`);
    }
  }
}
