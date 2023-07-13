import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import axios from 'axios';
import { app } from '../../../../main/app';
import { ArdoqCache } from '../../../../main/modules/ardoq/ArdoqCache';

import { ArdoqClient } from '../../../../main/modules/ardoq/ArdoqClient';
import { ArdoqComponentCreatedStatus } from '../../../../main/modules/ardoq/ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from '../../../../main/modules/ardoq/ArdoqRelationship';
import { ArdoqWorkspace } from '../../../../main/modules/ardoq/ArdoqWorkspace';
import { BatchUpdate } from '../../../../main/modules/ardoq/batch/BatchModel';
import { BatchRequest } from '../../../../main/modules/ardoq/batch/BatchRequest';
import { PropertiesVolume } from '../../../../main/modules/properties-volume';

jest.mock('axios');
describe('ArdoqClient', () => {
  new PropertiesVolume().enableFor(app);

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  // @ts-ignore
  mockedAxios.get.mockImplementation((url: string, config: object) => {
    if (url.startsWith('/api/v2/references')) {
      // @ts-ignore
      if (config.params.source === 'refSource' && config.params.target === 'refTarget') {
        return Promise.resolve({
          status: 200,
          data: {
            values: [
              {
                _id: '1234',
                customFields: {
                  sf_version: '1.0.0',
                },
              },
            ],
          },
        });
      }
      // @ts-ignore
      if (config.params.source === 'refSource2' && config.params.target === 'refTarget2') {
        return Promise.resolve({
          status: 404,
        });
      }
      // @ts-ignore
      if (config.params.source === 'refSource3' && config.params.target === 'refTarget3') {
        throw new Error('Network Error');
      }
      return Promise.resolve({
        status: 200,
        data: {
          values: [],
        },
      });
    }
    // @ts-ignore
    const paramName = config.params.name;
    if (paramName === 'github.com/hmcts') {
      return Promise.resolve({
        status: 200,
        data: {
          values: [
            {
              _id: '5678',
            },
          ],
        },
      });
    }
    if (paramName === 'github.com/blah') {
      return Promise.resolve({
        status: 500,
        data: {
          values: [],
        },
      });
    }

    if (paramName === 'known-but-not-cached') {
      return Promise.resolve({
        status: 200,
        data: {
          values: [
            {
              _id: '91011',
            },
          ],
        },
      });
    }

    return Promise.resolve({
      status: 200,
      data: {
        values: [],
      },
    });
  });
  // @ts-ignore
  mockedAxios.post.mockImplementation((url: string, data: string | object, config: object) => {
    if (url === '/api/v2/batch') {
      const d = typeof data === 'string' ? JSON.parse(data) : data;
      if (d.components.update[0].id == 'foo') {
        throw new Error('Network Error');
      }
    }
    // @ts-ignore
    const paramName = config.params.name;

    if (paramName === 'github.com/new-created') {
      return Promise.resolve({
        status: 201,
        data: {
          _id: '121314',
        },
      });
    }

    return Promise.resolve({
      status: 500,
    });
  });

  // @ts-ignore
  mockedAxios.interceptors = {
    response: {
      // @ts-ignore
      use(onFulfilled: any, onRejected: any) {},
    },
  };

  const cache = new ArdoqCache();

  beforeEach(() => {
    cache.clear();
  });

  it('createVcsHostingComponent exists', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.createCodeRepoComponent('github.com/hmcts').then(result => {
      expect(result).toEqual([ArdoqComponentCreatedStatus.EXISTING, '5678']);
    });
  });

  it('createVcsHostingComponent cache exists', async () => {
    cache.set(ArdoqWorkspace.ARDOQ_VCS_HOSTING_WORKSPACE, 'github.com/jp', '91011');
    const client = new ArdoqClient(mockedAxios, cache);
    client.createVcsHostingComponent('github.com/jp').then(result => {
      expect(result).toEqual([ArdoqComponentCreatedStatus.EXISTING, '91011']);
    });
  });

  it('createVcsHostingComponent err', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.createVcsHostingComponent('github.com/blah').then(result => {
      expect(result).toEqual([ArdoqComponentCreatedStatus.ERROR, null]);
    });
  });

  it('createVcsHostingComponent created', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.createVcsHostingComponent('github.com/new-created').then(result => {
      expect(result).toEqual([ArdoqComponentCreatedStatus.CREATED, '121314']);
    });
  });

  it('createCodeRepoComponent exists', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.createCodeRepoComponent('github.com/hmcts').then(result => {
      expect(result).toEqual([ArdoqComponentCreatedStatus.EXISTING, '5678']);
    });
  });

  it('createCodeRepoComponent cache exists', async () => {
    cache.set(ArdoqWorkspace.ARDOQ_CODE_REPOSITORY_WORKSPACE, 'github.com/jp', '91011');
    const client = new ArdoqClient(mockedAxios, cache);
    client.createCodeRepoComponent('github.com/jp').then(result => {
      expect(result).toEqual([ArdoqComponentCreatedStatus.EXISTING, '91011']);
    });
  });

  it('createCodeRepoComponent err', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.createCodeRepoComponent('github.com/blah').then(result => {
      expect(result).toEqual([ArdoqComponentCreatedStatus.ERROR, null]);
    });
  });

  it('createCodeRepoComponent created', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.createCodeRepoComponent('github.com/new-created').then(result => {
      expect(result).toEqual([ArdoqComponentCreatedStatus.CREATED, '121314']);
    });
  });

  it('searchForReference found', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.searchForReference('refSource', 'refTarget').then(result => {
      expect(result?.id).toEqual('1234');
      expect(result?.version).toEqual('1.0.0');
    });
  });

  it('searchForReference not found', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.searchForReference('refSource2', 'refTarget2').then(result => {
      expect(result).toEqual(undefined);
    });
  });

  it('processBatchRequest error', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    const br = new BatchRequest();
    br.components.addUpdate({
      id: 'foo',
      ifVersionMatch: 'latest',
      body: {
        rootWorkspace: 'bar',
        name: 'biz',
        typeId: 'baz',
      },
    } as BatchUpdate);
    const r = await client.processBatchRequest(br);
    expect(r.counts.get(ArdoqComponentCreatedStatus.ERROR)).toEqual(1);
  });

  it('getComponentIdIfExists cached', async () => {
    cache.set(ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE, 'fooComponent', '1234');
    const client = new ArdoqClient(mockedAxios, cache);
    const r = await client.getComponentIdIfExists('fooComponent');
    expect(r).toEqual('1234');
  });

  it('getComponentIdIfExists unknown', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    const r = await client.getComponentIdIfExists('unknown');
    expect(r).toEqual(undefined);
  });

  it('getCreateOrUpdateReferenceModel undefined', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    const result = await client.getCreateOrUpdateReferenceModel(
      'refSource',
      'refTarget',
      ArdoqRelationship.HOSTS,
      '1.0.0'
    );

    expect(result).toEqual(undefined);
  });

  it('getCreateOrUpdateReferenceModel create', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    const result = await client.getCreateOrUpdateReferenceModel('refSource2', 'refTarget2', ArdoqRelationship.HOSTS);

    expect(result).toEqual({
      body: {
        source: 'refSource2',
        target: 'refTarget2',
        type: ArdoqRelationship.HOSTS,
        customFields: undefined,
      },
    });
  });

  it('getCreateOrUpdateReferenceModel update', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    const result = await client.getCreateOrUpdateReferenceModel(
      'refSource',
      'refTarget',
      ArdoqRelationship.MAINTAINS,
      '1.1.1'
    );

    expect(result).toEqual({
      id: '1234',
      ifVersionMatch: 'latest',
      body: {
        source: 'refSource',
        target: 'refTarget',
        type: ArdoqRelationship.MAINTAINS,
        customFields: {
          sf_version: '1.1.1',
        },
      },
    });
  });

  it('getCreateOrUpdateReferenceModel undefined error', async () => {
    const client = new ArdoqClient(mockedAxios, cache);
    const result = await client.getCreateOrUpdateReferenceModel(
      'refSource3',
      'refTarget3',
      ArdoqRelationship.MAINTAINS
    );

    expect(result).toEqual(undefined);
  });
});
