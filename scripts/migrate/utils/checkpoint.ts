import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { config } from '../config.js';

export interface Checkpoint {
  completed: string[];
  lastRun: string | null;
}

const DEFAULT_CHECKPOINT: Checkpoint = {
  completed: [],
  lastRun: null,
};

export function readCheckpoint(): Checkpoint {
  if (!existsSync(config.checkpointFile)) {
    return { ...DEFAULT_CHECKPOINT };
  }

  try {
    const parsed = JSON.parse(readFileSync(config.checkpointFile, 'utf8')) as Checkpoint;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      lastRun: parsed.lastRun ?? null,
    };
  } catch {
    return { ...DEFAULT_CHECKPOINT };
  }
}

export function markStepComplete(stepId: string): void {
  const checkpoint = readCheckpoint();
  if (!checkpoint.completed.includes(stepId)) {
    checkpoint.completed.push(stepId);
  }
  checkpoint.lastRun = new Date().toISOString();
  writeFileSync(config.checkpointFile, JSON.stringify(checkpoint, null, 2));
}

export function isStepComplete(stepId: string): boolean {
  return readCheckpoint().completed.includes(stepId);
}

export function resetCheckpoint(): void {
  writeFileSync(config.checkpointFile, JSON.stringify(DEFAULT_CHECKPOINT, null, 2));
}
