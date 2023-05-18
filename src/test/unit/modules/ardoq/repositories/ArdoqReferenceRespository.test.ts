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
              _id: 'c',
              customFields: {
                version: '1.0.0',
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
            _id: 'a',
            customFields: {
              version: '1.1.0',
            },
          },
          {
            _id: 'b',
            customFields: {
              version: '2.0.0',
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
    expect(result.length).toBe(3);
    expect(result[0].id).toEqual('a');
    expect(result[1].id).toEqual('b');
    expect(result[2].id).toEqual('c');
  });
});
