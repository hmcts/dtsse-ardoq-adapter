import { Component } from './Component';
import { Reference } from './Reference';

export type BatchCreate = {
  batchId?: string;
  body: Component | Reference;
};

export type BatchUpdate = {
  id: string;
  ifVersionMatch: number | 'latest';
  body: Component | Reference;
};

export type BatchDelete = {
  id: string;
};

export type BatchActionResult = {
  id: string;
  body: Component | Reference;
  batchId?: string;
};

export type BatchResult = {
  created?: BatchActionResult[];
  updated?: BatchActionResult[];
  deleted?: BatchDelete[];
};

export class BatchModel {
  private create: BatchCreate[] = [];
  private update: BatchUpdate[] = [];
  private delete: BatchDelete[] = [];

  public addCreate(model: BatchCreate): BatchModel {
    this.create.push(model);
    return this;
  }

  public addUpdate(model: BatchUpdate): BatchModel {
    this.update.push(model);
    return this;
  }

  public setDeleteIds(model: BatchDelete[]): BatchModel {
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
