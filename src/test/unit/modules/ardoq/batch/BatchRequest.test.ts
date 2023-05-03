/* eslint-disable jest/expect-expect */
import { describe, expect, test } from '@jest/globals';
import { ArdoqRelationship } from '../../../../../main/modules/ardoq/ArdoqRelationship';
import { BatchRequest } from '../../../../../main/modules/ardoq/batch/BatchRequest';
import { Component } from '../../../../../main/modules/ardoq/batch/Component';
import { Reference } from '../../../../../main/modules/ardoq/batch/Reference';

describe('Ardoq Batch Request', () => {
  test('that the json format is correct', async () => {
    const r = new BatchRequest();
    expect(r).toBeDefined();

    r.component.addCreate({ batchId: '1', body: new Component('componentWS1', 'componentName1', 'componentType') });
    r.component.addCreate({ batchId: '2', body: new Component('componentWS2', 'componentName2', 'componentType') });

    r.component.addUpdate({
      id: '3',
      ifVersionMatch: 1,
      body: new Component('componentWS3', 'componentName3', 'componentType'),
    });
    r.component.addUpdate({
      id: '4',
      ifVersionMatch: 1,
      body: new Component('componentWS4', 'componentName4', 'componentType'),
    });

    r.references.addCreate({
      batchId: '1',
      body: new Reference('referencesSource1', 'referencesTarget', ArdoqRelationship.HOSTS),
    });
    r.references.addCreate({
      batchId: '2',
      body: new Reference('referencesSource2', 'referencesTarget', ArdoqRelationship.DEPENDS_ON_VERSION, {
        version: '1.1.1',
      }),
    });

    r.references.addUpdate({
      id: '3',
      ifVersionMatch: 'latest',
      body: new Reference('referencesSource3', 'referencesTarget', ArdoqRelationship.HOSTS),
    });
    r.references.addUpdate({
      id: '4',
      ifVersionMatch: 'latest',
      body: new Reference('referencesSource4', 'referencesTarget', ArdoqRelationship.DEPENDS_ON_VERSION, {
        version: '2.2.2',
      }),
    });

    const json = JSON.stringify(r);
    expect(json).toEqual(
      '{"component":{"create":[{"batchId":"1","body":{"rootWorkspace":"componentWS1","name":"componentName1","typeId":"componentType"}},{"batchId":"2","body":{"rootWorkspace":"componentWS2","name":"componentName2","typeId":"componentType"}}],"update":[{"id":"3","ifVersionMatch":1,"body":{"rootWorkspace":"componentWS3","name":"componentName3","typeId":"componentType"}},{"id":"4","ifVersionMatch":1,"body":{"rootWorkspace":"componentWS4","name":"componentName4","typeId":"componentType"}}]},"references":{"create":[{"batchId":"1","body":{"source":"referencesSource1","target":"referencesTarget","type":28}},{"batchId":"2","body":{"source":"referencesSource2","target":"referencesTarget","type":3,"customFields":{"version":"1.1.1"}}}],"update":[{"id":"3","ifVersionMatch":"latest","body":{"source":"referencesSource3","target":"referencesTarget","type":28}},{"id":"4","ifVersionMatch":"latest","body":{"source":"referencesSource4","target":"referencesTarget","type":3,"customFields":{"version":"2.2.2"}}}]},"respondWithEntities":false}'
    );
  });
});
