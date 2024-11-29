import { describe, it, beforeEach, expect } from 'vitest';
import Mock from '@elastic/elasticsearch-mock';
import { Client } from '@elastic/elasticsearch';
import { ElasticService } from '../src/services/elastic.service';

describe('ElasticService', () => {
    let mock: Mock;
    let client: Client;
    let elasticService: ElasticService;

    beforeEach(() => {
        mock = new Mock();

        client = new Client({
            node: 'http://localhost:9200',
            //Connection: mock.getConnection(),
        });

        elasticService = ElasticService.getInstance();
        elasticService['elasticClient'] = client;

        mock.add(
            { method: 'GET', path: '/' },
            () => ({ status: 'ok' })
        );

        mock.add(
            { method: 'HEAD', path: '/existing-index' },
            () => ({ statusCode: 200 })
        );

        mock.add(
            {
                method: 'PUT',
                path: '/new-index',
                body: {
                    settings: { number_of_shards: 1, number_of_replicas: 0 },
                },
            },
            () => ({ acknowledged: true })
        );

        mock.add(
            { method: 'POST', path: '/test-index/_search' },
            () => ({
                hits: { hits: [{ _id: '1', _source: { name: 'Test' } }] },
            })
        );

        mock.add(
            { method: 'POST', path: '/test-index/_doc' },
            () => ({ _id: '1', result: 'created' })
        );

        mock.add(
            { method: 'HEAD', path: '/new-index' },
            () => ({ statusCode: 200 })
        );

        mock.add(
            { method: 'DELETE', path: '/new-index' },
            () => ({ statusCode: 200 })
        );

        mock.add(
            { method: 'HEAD', path: '/non-existing-index' },
            () => {
                throw { statusCode: 404 };
            }
        );
    });

    it('should verify connection successfully', async () => {
        const result = await elasticService['verifyConnection']();
        expect(result).toBe(true);
    });

    it('should create an index successfully', async () => {
        if(await ElasticService.checkIndexExists('new-index'))
            await ElasticService.deleteIndex('new-index');

        await ElasticService.createIndex('new-index', { number_of_shards: 1 });
        const result = await ElasticService.checkIndexExists('new-index');
        expect(result).toBe(true);
    });

    it('should check if an index exists', async () => {
        const exists = await ElasticService.checkIndexExists('new-index');
        expect(exists).toBe(true);

        const notExists = await ElasticService.checkIndexExists('non-existing-index');
        expect(notExists).toBe(false);

        await ElasticService.deleteIndex('new-index');
    });

    it('should insert a document into an index', async () => {
        const document = { id: 1, name: 'Test' };
        await ElasticService.insertDocument('test-index-insert', document);

        const searchResults = await ElasticService.searchDocuments('test-index-insert', {
            query: { match_all: {} },
        });

        expect(searchResults[0]._source).toEqual(document);
        await ElasticService.deleteIndex('test-index-insert');
    });

    it('should delete an index successfully', async () => {
        await ElasticService.deleteIndex('test-index');
        const exists = await ElasticService.checkIndexExists('test-index');
        expect(exists).toBe(false);
    });

    it('should perform a rollover successfully', async () => {
        await ElasticService.performRollover('alias-name', { max_docs: 1000 });
    });

    it('should update a document in an index', async () => {
        const document = { id: 1, name: 'Test' };
        const updatedDocument = { id: 1, name: 'Updated Test' };
        await ElasticService.deleteDocument('test-index', '1');
    
        mock.add(
            { method: 'POST', path: '/test-index/_update/1' },
            () => ({ result: 'updated' })
        );
    
        const result = await ElasticService.insertDocument('test-index', document);

        //@ts-ignore
        await ElasticService.updateDocument('test-index', result?._id, updatedDocument);

        const searchResults = await ElasticService.searchDocuments('test-index', {
            query: { match: { name: 'Updated Test' } },
        });

        expect(searchResults.length).greaterThanOrEqual(1);
    });

    it('should search for documents with specific criteria', async () => {
        const document1 = { id: 1, name: 'Test A' };
        const document2 = { id: 2, name: 'Test B' };
    
        await ElasticService.insertDocument('test-index', document1);
        await ElasticService.insertDocument('test-index', document2);
    
        const searchResults = await ElasticService.searchDocuments('test-index', {
            query: {
                function_score: {
                    query: { match: { name: 'Test A' } },
                    functions: [
                        {
                            script_score: {
                                script: {
                                    source: "doc['name.keyword'].value == params.query && _score >= params.min_score ? _score : 0",
                                    params: {
                                        query: 'Test A',
                                        min_score: 1,
                                    },
                                },
                            },
                        },
                    ],
                    score_mode: 'multiply',
                },
            },
        });

        const docs = searchResults.filter((doc) => doc._score >= 1);
    
        expect(docs.length).toBe(1);
        expect(docs[0]._source).toEqual(document1);
    });
})