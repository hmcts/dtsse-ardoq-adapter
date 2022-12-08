import { ArdoqComponentCreatedResponse } from './ArdoqComponentCreatedResponse';
import { Dependency } from './Dependency';

import axios from 'axios';

export class ArdoqClient {
  constructor(private apiWorkspace: string, private cache: Map<string, string> = new Map<string, string>()) {}

  private cacheResult(d: Dependency) {
    this.cache.set(d.name, d.version);
  }

  private isCached(d: Dependency): boolean {
    return this.cache.get(d.name) === d.version;
  }

  private searchForComponent(dependencyFullName: string) {
    return axios.get('/api/component/search', {
      params: {
        workspace: this.apiWorkspace,
        name: dependencyFullName,
      },
      responseType: 'json',
    });
  }

  private createComponent(dependencyFullName: string) {
    return axios.post(
      '/api/component/search',
      {
        rootWorkspace: this.apiWorkspace,
        name: dependencyFullName,
      },
      {
        params: {
          workspace: this.apiWorkspace,
          name: dependencyFullName,
        },
        responseType: 'json',
      }
    );
  }

  async updateDep(d: Dependency): Promise<ArdoqComponentCreatedResponse> {
    if (this.isCached(d)) {
      return ArdoqComponentCreatedResponse.EXISTING;
    }

    const searchResponse = await this.searchForComponent(d.getFullName());
    if (searchResponse.status === 200) {
      // Can now create a relationship between the application and this object

      if (searchResponse.data !== '[]') {
        this.cacheResult(d);
        return ArdoqComponentCreatedResponse.EXISTING;
      }

      // create a new object
      const createResponse = await this.createComponent(d.getFullName());
      if (createResponse.status === 201) {
        // Can now create a relationship between the application and this object
        this.cacheResult(d);
        return ArdoqComponentCreatedResponse.CREATED;
      }
      return ArdoqComponentCreatedResponse.ERROR;
    }
    return ArdoqComponentCreatedResponse.ERROR;
  }
}
