# dtsse-ardoq-adapter

Provides an integration to Ardoq in order to maintain the tech stack. The relationship for Ardoq components is like so:

```mermaid
erDiagram
    "VCS Platform" ||..|{ "Code Repositories" : hosts
    "HMCTS Application" ||..o{ "Code Repositories" : maintains
    "Software Dependency" }o..|{ "Code Repositories" : "depends upon version"
```

This application is a NodeJS application that runs in CFT and hosts an API that is called by
HMCTS applications to update Ardoq with its dependencies.

## Getting Started with Integration

In order to integrate with this application, you will need to request an API key from the DTSSE team who can be found
on the DTS slack in #rse-dev-tools.

### Supported Build Tools

You can send data to the dtsse-ardoq-adapter API however you feel is best for your needs. Below is a sample GitHub
action in case it is of use. The following sections of the supported build tools will describe how to get the correct
payload to submit to the different endpoints for your built tool.

```name: Maintain Ardoq Tech Stack
run-name: ${{ github.actor }} is testing out GitHub Actions 🚀
on:
  push:
    branches:
      - master
      - main
      - ardoq-integration
jobs:
  Maintain-Ardoq-Tech-Stack:
    runs-on: ubuntu-latest
    steps:
      - run: echo "🔎 The name of your branch is ${{ github.ref }} and your repository is ${{ github.repository }}."
      - uses: actions/checkout@v3
      - name: Set up JDK 11
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'adopt'
      - name: Dump dependencies
        run: ./gradlew -q dependencies > $PWD/deps.log
      - name: base64 encode
        run: cat $PWD/deps.log | base64 > $PWD/deps.log.base64
      - name: Send data to Ardoq adapter
        env:
          ARDOQ_ADAPTER_URL: ${{ secrets.ARDOQ_ADAPTER_URL }}
        run: |
          curl -d "@$PWD/deps.log.base64" $ARDOQ_ADAPTER_URL/api/gradle/send-letter-service -H 'Content-Type: text/plain' -H 'Authorization: Bearer ${{ secrets.ARDOQ_ADAPTER_KEY }}'
      - run: echo "🍏 This job's status is ${{ job.status }}."
```

### Gradle

`./gradlew -q dependencies > $PWD/deps.log` will provide the full output of the dependencies used but needs to be base64
encoded before sending to the API. The following command will do this for you:
`cat $PWD/deps.log | base64 > $PWD/deps.log.base64`
This data then needs posting to the `/api/gradle/<your repository name>` endpoint.

### Maven

For maven projects you can run `mvn dependency:tree > $PWD/deps.log`

This data then needs posting to the `/api/maven/<your repository name>` endpoint.

### Dotnet

`dotnet list package --format json` will output the json content you need to then post to `/api/dotnet/<your repository name>`.

### NPM

To integrate your project when using npm, you simply need to post the contexts of your package-lock.json file to
`/api/npm/<your repository name>`. This works for both version 1 and 2 of the npm lock file.

### Yarn

To integrate your project when using yarn, you simply need to post the contexts of your yarn.lock file to
`/api/yarn/<your repository name>`.

### PIP

To integrate your project when using pip, you simply need to post the contexts of your requirements.txt file to
`/api/pip/<your repository name>`.

## Maintaining this application

### Prerequisites

Running the application requires the following tools to be installed in your environment:

- [Node.js](https://nodejs.org/) v12.0.0 or later
- [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com)

### Running the application

Install dependencies by executing the following command:

```bash
$ yarn install
```

Bundle:

```bash
$ yarn webpack
```

Run:

```bash
$ yarn start
```

The applications's home page will be available at https://localhost:8506

### Running with Docker

Create docker image:

```bash
  docker-compose build
```

Run the application by executing the following command:

```bash
  docker-compose up
```

This will start the frontend container exposing the application's port
(set to `8506` in this template app).

In order to test if the application is up, you can visit https://localhost:8506 in your browser.
You should get a very basic home page (no styles, etc.).

## Developing

### Code style

We use [ESLint](https://github.com/typescript-eslint/typescript-eslint)
alongside [sass-lint](https://github.com/sasstools/sass-lint)

Running the linting with auto fix:

```bash
$ yarn lint --fix
```

### Running the tests

This template app uses [Jest](https://jestjs.io//) as the test engine. You can run unit tests by executing
the following command:

```bash
$ yarn test
```

Here's how to run functional tests (the template contains just one sample test):

```bash
$ yarn test:routes
```

Running accessibility tests:

```bash
$ yarn test:a11y
```

Make sure all the paths in your application are covered by accessibility tests (see [a11y.ts](src/test/a11y/a11y.ts)).

### Security

#### CSRF prevention

[Cross-Site Request Forgery](https://github.com/pillarjs/understanding-csrf) prevention has already been
set up in this template, at the application level. However, you need to make sure that CSRF token
is present in every HTML form that requires it. For that purpose you can use the `csrfProtection` macro,
included in this template app. Your njk file would look like this:

```
{% from "macros/csrf.njk" import csrfProtection %}
...
<form ...>
  ...
    {{ csrfProtection(csrfToken) }}
  ...
</form>
...
```

### Healthcheck

The application exposes a health endpoint (https://localhost:8506/health), created with the use of
[Nodejs Healthcheck](https://github.com/hmcts/nodejs-healthcheck) library. This endpoint is defined
in [health.ts](src/main/routes/health.ts) file. Make sure you adjust it correctly in your application.
In particular, remember to replace the sample check with checks specific to your frontend app,
e.g. the ones verifying the state of each service it depends on.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
