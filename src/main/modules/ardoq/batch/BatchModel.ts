import { Component } from './Component';
import { Reference } from './Reference';

type BatchCreate = {
  batchId: string;
  body: Component | Reference;
}
type BatchUpdate = {
  id: string;
  ifVersionMatch: number | 'latest';
  body: Component | Reference;
}

export type BatchActionResult = {
  id: string;
  body: Component | Reference;
  batchId?: string;
}

export type BatchResult = {
  created?: BatchActionResult[];
  updated?: BatchActionResult[];
}

export class BatchModel {

  constructor(private create: BatchCreate[] = [],
              private update: BatchUpdate[] = []) {}

  public addCreate(model: BatchCreate): BatchModel {
    this.create.push(model);
    return this;
  }
  public addUpdate(model: BatchUpdate): BatchModel {
    this.update.push(model);
    return this;
  }

  public getCreateLength(): number {
    return this.create.length;
  }
  public getUpdateLength(): number {
    return this.update.length;
  }
}
