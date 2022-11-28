import { Application } from 'express';

import { GradleParser } from '../modules/ardoq/GradleParser';

export default function (app: Application): void {
  app.post('/gradle/:repo', (req, res) => {
    console.log('Repo: ' + req.params.repo);

    const deps = GradleParser.fromDepString(req.body);
    console.log('Deps: ' + deps.size);
    // deps.forEach(d => {
    //   // update logic
    //   console.log(d);
    // });

    res.statusCode = 201;
    res.contentType('text/plain');
    res.send('');
  });
}
