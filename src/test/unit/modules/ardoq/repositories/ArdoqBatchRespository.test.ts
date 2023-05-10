import { jest } from '@jest/globals';
import { app } from '../../../../../main/app';
import { describe, expect, it } from '@jest/globals';
import axios from 'axios';
import { ArdoqComponentCreatedStatus } from '../../../../../main/modules/ardoq/ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from '../../../../../main/modules/ardoq/ArdoqRelationship';
import { BatchRequest } from '../../../../../main/modules/ardoq/batch/BatchRequest';
import { ArdoqBatchRespository } from '../../../../../main/modules/ardoq/repositories/ArdoqBatchRespository';
import { PropertiesVolume } from '../../../../../main/modules/properties-volume';

jest.mock('axios');
describe('RequestProcessor', () => {
  new PropertiesVolume().enableFor(app);
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  // @ts-ignore
  mockedAxios.post.mockImplementation((url: string, br: BatchRequest) => {
    if (br.components.getCreateLength() === 1) {
      return Promise.resolve({
        status: 200,
        data: {
          components: {
            created: [
              {
                id: 'string',
                body: {
                  rootWorkspace: '63ea3291bbed2e0001a19a9d',
                  name: 'componentName',
                  typeId: 'componentTypeId',
                  _id: '63ea1a02bbed2e0001a19a9c',
                },
              },
            ],
            updated: [],
            deleted: [],
          },
          references: {
            created: [],
            updated: [],
            deleted: [],
          },
        },
      });
    }
    if (br.components.getCreateLength() === 2) {
      throw new Error('Network error');
    }
    return Promise.resolve({
      status: 200,
      data: {
        values: [],
      },
    });
  });

  // @ts-ignore
  mockedAxios.interceptors = {
    response: {
      // @ts-ignore
      use(onFulfilled: any, onRejected: any) {},
    },
  };

  it('Returns a OK with empty batch request', async () => {
    const repo = new ArdoqBatchRespository(mockedAxios);
    const br = new BatchRequest();
    const result = await repo.create(br);
    expect(result).toEqual(
      new Map([
        [ArdoqComponentCreatedStatus.CREATED, 0],
        [ArdoqComponentCreatedStatus.EXISTING, 0],
      ])
    );
  });

  it('Returns with correct statuses ignoring references', async () => {
    const repo = new ArdoqBatchRespository(mockedAxios);
    const br = new BatchRequest();
    br.components.addCreate({
      body: {
        rootWorkspace: 'fooWorkspace',
        name: 'componentName',
        typeId: 'componentTypeId',
      },
    });
    br.references.addCreate({
      body: {
        source: 'fooSource',
        target: 'fooTarget',
        type: ArdoqRelationship.HOSTS,
      },
    });
    br.references.addUpdate({
      id: 'fooId2',
      ifVersionMatch: 'latest',
      body: {
        source: 'fooSource',
        target: 'fooTarget',
        type: ArdoqRelationship.HOSTS,
        customFields: {
          version: '1.1.1',
        },
      },
    });
    const result = await repo.create(br);
    expect(result).toEqual(
      new Map([
        [ArdoqComponentCreatedStatus.CREATED, 1],
        [ArdoqComponentCreatedStatus.EXISTING, 0],
      ])
    );
  });

  it(' Errors everything when something goes wrong', async () => {
    const repo = new ArdoqBatchRespository(mockedAxios);
    const br = new BatchRequest();
    br.components.addCreate({
      body: {
        rootWorkspace: 'fooWorkspace2',
        name: 'componentName2',
        typeId: 'componentTypeId',
      },
    });
    br.components.addCreate({
      body: {
        rootWorkspace: 'fooWorkspace2',
        name: 'componentName3',
        typeId: 'componentTypeId',
      },
    });
    const result = await repo.create(br);
    expect(result).toEqual(new Map([[ArdoqComponentCreatedStatus.ERROR, 2]]));
  });
});
