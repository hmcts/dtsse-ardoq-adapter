import { Component } from './Component';
import { Reference } from './Reference';

export enum BatchType {
  COMPONENT = 'components',
  REFERENCE = 'references',
}
export enum BatchAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export type BatchCreate = {
  batchId?: string;
  body: Component | Reference;
};

export type BatchUpdate = {
  id: string;
  ifVersionMatch: number | 'latest';
  body: Component | Reference;
};

export type GenericBatchItem = {
  id: string;
};

export type BatchActionResult = {
  id: string;
  body: Component | Reference;
  batchId?: string;
};

export type BatchResult = {
  created?: GenericBatchItem[];
  updated?: GenericBatchItem[];
  deleted?: GenericBatchItem[];
};

export class BatchModel {
  private create: BatchCreate[] = [];
  private update: BatchUpdate[] = [];
  private delete: GenericBatchItem[] = [];

  public addCreate(model: BatchCreate): BatchModel {
    this.create.push(model);
    return this;
  }

  public addUpdate(model: BatchUpdate): BatchModel {
    this.update.push(model);
    return this;
  }

  public setDeleteIds(model: GenericBatchItem[]): BatchModel {
    this.delete.push(...model);
    return this;
  }

  public getUpdateIds(): string[] {
    return this.update.map(u => u.id);
  }

  public getCreateLength(): number {
    return this.create.length;
  }

  public getUpdateLength(): number {
    return this.update.length;
  }

  public getDeleteLength(): number {
    return this.delete.length;
  }
}
