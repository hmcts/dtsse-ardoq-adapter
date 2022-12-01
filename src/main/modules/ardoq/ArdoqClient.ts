import { ArdoqComponentCreatedResponse } from './ArdoqComponentCreatedResponse';
import { Dependency } from './Dependency';

import axios from 'axios';

export class ArdoqClient {
  apiKey: string;
  apiUrl: string;
  apiWorkspace: string;
  cache: Map<string, string> = new Map<string, string>();

  constructor(apiKey: string, apiUrl: string, apiWorkspace: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.apiWorkspace = apiWorkspace;
  }

  private cacheResult(d: Dependency) {
    this.cache.set(d.name, d.version);
  }

  private isCached(d: Dependency): boolean {
    return this.cache.get(d.name) === d.version;
  }

  private searchForComponent(dependencyFullName: string) {
    const url = this.apiUrl + '/api/component/search';
    return axios.get(url, {
      params: {
        workspace: this.apiWorkspace,
        name: dependencyFullName,
      },
      headers: {
        Authorization: 'Token token=' + this.apiKey,
      },
      responseType: 'json',
    });
  }

  private createComponent(dependencyFullName: string) {
    const url = this.apiUrl + '/api/component/search';
    return axios.post(
      url,
      {
        rootWorkspace: this.apiWorkspace,
        name: dependencyFullName,
      },
      {
        params: {
          workspace: this.apiWorkspace,
          name: dependencyFullName,
        },
        headers: {
          Authorization: 'Token token=' + this.apiKey,
        },
        responseType: 'json',
      }
    );
  }

  async updateDep(d: Dependency): Promise<ArdoqComponentCreatedResponse> {
    if (this.isCached(d)) {
      return ArdoqComponentCreatedResponse.EXISTING;
    }

    return this.searchForComponent(d.getFullName()).then(searchResponse => {
      if (searchResponse.status === 200) {
        // Can now create a relationship between the application and this object

        if (searchResponse.data !== '[]') {
          this.cacheResult(d);
          return ArdoqComponentCreatedResponse.EXISTING;
        }

        // create a new object
        return this.createComponent(d.getFullName()).then(createResponse => {
          if (createResponse.status === 201) {
            // Can now create a relationship between the application and this object
            // console.log('Created ${d.name} ${d.version} : ${createResponse.status}');
            this.cacheResult(d);
            return ArdoqComponentCreatedResponse.CREATED;
          } else {
            // console.log('Error Creating ${d.name} ${d.version} : ${createResponse.status}');
            return ArdoqComponentCreatedResponse.ERROR;
          }
        });
      } else {
        // console.log('Error Searching for ${d.name} ${d.version} : ${searchResponse.status}');
        return ArdoqComponentCreatedResponse.ERROR;
      }
    });
  }
}
