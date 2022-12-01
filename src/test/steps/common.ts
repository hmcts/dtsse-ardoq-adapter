import fs from 'fs';

import { config as testConfig } from '../config';

const { I } = inject();

export const iAmOnPage = (text: string): void => {
  const url = new URL(text, testConfig.TEST_URL);
  if (!url.searchParams.has('lng')) {
    url.searchParams.set('lng', 'en');
  }
  I.amOnPage(url.toString());
};
export const loadedFile = (path: string): string => {
  return fs.readFileSync(path, 'utf8');
};

export const sourceRepo = (repo: string): string => {
  return repo;
};

export const postToArdoq = (url: string): string => {
  return url;
};

Given('I go to {string}', iAmOnPage);

Given("A payload of '{string}'", loadedFile);

Given('My repo {string}', sourceRepo);

When("I POST to '{string}'", postToArdoq);

Then('the page URL should be {string}', (url: string) => {
  I.waitInUrl(url);
});

Then('the page should include {string}', (text: string) => {
  I.waitForText(text);
});
