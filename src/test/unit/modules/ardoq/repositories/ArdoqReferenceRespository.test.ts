import { jest } from '@jest/globals';
import { app } from '../../../../../main/app';
import { describe, expect, it } from '@jest/globals';
import axios from 'axios';
import { ArdoqWorkspace } from '../../../../../main/modules/ardoq/ArdoqWorkspace';

import { ArdoqReferenceRepository } from '../../../../../main/modules/ardoq/repositories/ArdoqReferenceRepository';
import { PropertiesVolume } from '../../../../../main/modules/properties-volume';

jest.mock('axios');
describe('ArdoqReferenceRespository', () => {
  new PropertiesVolume().enableFor(app);
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  // @ts-ignore
  mockedAxios.get.mockImplementation((url: string, config: object) => {
    if (url === '/next') {
      return Promise.resolve({
        status: 200,
        data: {
          values: [
            {
              _id: 'c3',
              target: 'c',
              customFields: {
                sf_version: '1.0.0',
                reference_target: 'cc',
              },
            },
          ],
        },
      });
    }

    return Promise.resolve({
      status: 200,
      data: {
        values: [
          {
            _id: 'a1',
            target: 'a',
            customFields: {
              sf_version: '1.1.0',
              reference_target: 'aa',
            },
          },
          {
            _id: 'b2',
            target: 'b',
            customFields: {
              sf_version: '2.0.0',
              reference_target: 'bb',
            },
          },
        ],
        _links: {
          next: {
            href: '/next',
          },
        },
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

  it('Processes paginated getAllReferences results', async () => {
    const repo = new ArdoqReferenceRepository(mockedAxios);
    const result = await repo.getAllReferences(
      'sourceComponentId',
      ArdoqWorkspace.ARDOQ_HMCTS_APPLICATIONS_WORKSPACE,
      ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE
    );
    expect(result.size).toBe(3);
    expect(result.get('a')?.id).toEqual('a1');
    expect(result.get('b')?.id).toEqual('b2');
    expect(result.get('c')?.id).toEqual('c3');
  });
});
