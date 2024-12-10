<p align="center">
  <a href="https://cmmv.io/" target="blank"><img src="https://raw.githubusercontent.com/andrehrferreira/docs.cmmv.io/main/public/assets/logo_CMMV2_icon.png" width="300" alt="CMMV Logo" /></a>
</p>
<p align="center">Contract-Model-Model-View (CMMV) <br/> Building scalable and modular applications using contracts.</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@cmmv/elastic"><img src="https://img.shields.io/npm/v/@cmmv/elastic.svg" alt="NPM Version" /></a>
    <a href="https://github.com/andrehrferreira/cmmv-server/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cmmv/elastic.svg" alt="Package License" /></a>
</p>

<p align="center">
  <a href="https://cmmv.io">Documentation</a> &bull;
  <a href="https://github.com/andrehrferreira/cmmv-elastic/issues">Report Issue</a>
</p>

## Description

The `@cmmv/elastic` module provides a seamless interface for integrating with Elasticsearch, enabling developers to manage indices, perform searches, and handle documents efficiently. Designed for scalability, the module integrates smoothly with the CMMV framework, supporting advanced Elasticsearch features while maintaining simplicity.

## Features

- **Index Management**: Create, delete, and check indices with ease.
- **Document Operations**: Insert, update, delete, and search documents.
- **Integration with CMMV Framework**: Built-in support for modular CMMV applications.
- **Dynamic Query Support**: Execute complex search queries with decorators and utility methods.
- **Decorator-Based API**: Simplified Elasticsearch interactions with intuitive decorators.

## Installation

Install the `@cmmv/elastic` package via npm:

```bash
$ pnpm add @cmmv/elastic
```

## Configuration

The ``@cmmv/elastic`` module requires Elasticsearch connection details, configurable through the ``.cmmv.config.js`` file:

[Elastic Documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-connecting.html)

```javascript
import * as fs from "node:fs";

module.exports = {
    env: process.env.NODE_ENV,

    elastic: {
        node: 'http://localhost:9200',
        //cloud: { id: '<cloud-id>' },
        /*tls: {
            ca: fs.readFileSync('./http_ca.crt'),
            rejectUnauthorized: false
        },
        auth: {
            bearer: process.env.ELASTIC_BEARER || "",
            apiKey: process.env.ELASTIC_APIKEY || "",
            username: process.env.ELASTIC_USERNAME || "",
            password: process.env.ELASTIC_PASSWORD || ""
        }*/
    }
};
```

## Setting Up the Application

In your ``index.ts``, include the ``ElasticModule`` and services required for your application:

```typescript
import { Application } from "@cmmv/core";
import { DefaultAdapter, DefaultHTTPModule } from "@cmmv/http";
import { ElasticModule, ElasticService } from "@cmmv/elastic";

Application.create({
    httpAdapter: DefaultAdapter,
    modules: [
        DefaultHTTPModule,
        ElasticModule,
    ],
    services: [ElasticService],
});
```

## Usage

### Creating an Index

Allows you to create a new Elasticsearch index with configurable settings like the number of shards and replicas. Use this to structure your data storage.


```typescript
await ElasticService.createIndex('my-index', {
    number_of_shards: 1,
    number_of_replicas: 0,
});
```

### Checking Index Existence

Verifies whether a specific index exists in Elasticsearch. Useful for conditional operations to avoid duplicate index creation.

```typescript
const exists = await ElasticService.checkIndexExists('my-index');
console.log(`Index exists: ${exists}`);
```

### Deleting an Index

Deletes an existing index from Elasticsearch. Use this to remove outdated or unnecessary indices.

```typescript
await ElasticService.deleteIndex('my-index');
```

### Inserting Documents

Adds a new document to a specified index. Ideal for storing and indexing structured data for retrieval and analysis.

```typescript
await ElasticService.insertDocument('my-index', { id: 1, name: 'Test Document' });
```

### Updating Documents

Updates an existing document in a specified index. Use this to modify stored data without creating duplicates.

```typescript
await ElasticService.updateDocument('my-index', 'document-id', { name: 'Updated Name' });
```

### Searching Documents

Performs a search query on a specified index. Use this to retrieve documents matching specific criteria.

```typescript
const results = await ElasticService.searchDocuments('my-index', {
    query: { match: { name: 'Test Document' } },
});
console.log(results);
```

### Alias Management

Creates or checks the existence of an alias for an index. Aliases are useful for abstracting access to indices, enabling flexible data management.

```typescript
await ElasticService.createAlias('my-index');
const aliasExists = await ElasticService.checkAliasExists('my-alias');
```

### Rollover Index

Performs a rollover operation on an alias, creating a new index when specified conditions are met (e.g., max documents). Useful for managing large-scale data storage.

```typescript
await ElasticService.performRollover('my-alias', { max_docs: 1000 });
```