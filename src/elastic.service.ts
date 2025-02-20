import { Service, Singleton, Application, Config, Logger } from '@cmmv/core';

import { Client } from '@elastic/elasticsearch';

@Service()
export class ElasticService extends Singleton {
  public logger: Logger = new Logger('ElasticService');
  public elasticClient: Client;

  public static async loadConfig(application: Application): Promise<void> {
    const instance = ElasticService.getInstance();
    const config = Config.get<string>('elastic', {
      node: 'http://localhost:9200',
    });

    try {
      instance.elasticClient = new Client(config);
      const isConnected = await instance.verifyConnection();

      if (isConnected) {
        instance.logger.log('Elastic connected and verified!');
      } else {
        throw new Error('ElasticSearch server is not responding.');
      }
    } catch (err) {
      instance.logger.error(err.message);
      console.error(err);
    }
  }

  public static async createIndex(
    indexName: string,
    settings?: any,
    mappings?: any,
  ): Promise<any> {
    const instance = ElasticService.getInstance();

    try {
      const exists = await ElasticService.checkIndexExists(indexName);

      if (exists) {
        instance.logger.log(`Index "${indexName}" already exists.`);
        return false;
      }

      let body: any = {};

      if (settings != null) {
        body.settings = {
          ...settings,
          number_of_shards: settings?.number_of_shards || 1,
          number_of_replicas: settings?.number_of_replicas || 0,
        };
      }

      if (mappings != null) body.mappings = mappings;

      const result = await instance.elasticClient.indices.create({
        index: indexName,
        wait_for_active_shards: settings?.number_of_shards || 1,
        timeout: '5s',
        master_timeout: '5s',
        body,
      });

      const existsAlias = await ElasticService.checkAliasExists(indexName);

      if (existsAlias == false) await ElasticService.createAlias(indexName);

      return result;
    } catch (err) {
      instance.logger.error(
        `Error creating index "${indexName}": ${err.message}`,
      );
    }
  }

  public static async checkIndexExists(indexName: string): Promise<boolean> {
    const instance = ElasticService.getInstance();

    try {
      const result = await instance.elasticClient.indices.exists({
        index: indexName,
      });
      return result;
    } catch (err) {
      instance.logger.error(
        `Error checking index "${indexName}": ${err.message}`,
      );
      return false;
    }
  }

  public static async insertDocument(indexName: string, document: any) {
    const instance = ElasticService.getInstance();

    try {
      return await instance.elasticClient.index({
        index: indexName,
        refresh: 'wait_for',
        body: document,
      });
    } catch (err) {
      instance.logger.error(
        `Error inserting document into index "${indexName}": ${err.message}`,
      );
    }
  }

  public static async updateDocument(
    indexName: string,
    documentId: string,
    updateBody: any,
  ) {
    const instance = ElasticService.getInstance();

    try {
      return await instance.elasticClient.update({
        index: indexName,
        id: documentId,
        doc: updateBody,
      });
    } catch (err) {
      instance.logger.error(
        `Error updating document "${documentId}" in index "${indexName}": ${err.message}`,
      );
    }
  }

  public static async deleteDocument(indexName: string, documentId: string) {
    const instance = ElasticService.getInstance();

    try {
      return await instance.elasticClient.delete({
        index: indexName,
        id: documentId,
      });
    } catch (err) {
      instance.logger.error(
        `Error deleting document "${documentId}" in index "${indexName}": ${err.message}`,
      );
    }
  }

  public static async searchDocuments(
    indexName: string,
    query: any,
  ): Promise<any[]> {
    const instance = ElasticService.getInstance();

    try {
      const result = await instance.elasticClient.search({
        index: indexName,
        body: query,
      });

      return result.hits.hits;
    } catch (err) {
      instance.logger.error(
        `Error searching documents in index "${indexName}": ${err.message}`,
      );
      return [];
    }
  }

  public static async createAlias(indexName: string): Promise<void> {
    const instance = ElasticService.getInstance();

    try {
      const aliasExists = await ElasticService.checkAliasExists(indexName);

      if (aliasExists) {
        instance.logger.log(`Alias "${indexName}" already exists.`);
        return;
      }

      await instance.elasticClient.indices.updateAliases({
        body: {
          actions: [
            {
              add: {
                index: indexName,
                alias: indexName,
                is_write_index: true,
              },
            },
          ],
        },
      });
    } catch (err) {
      instance.logger.error(
        `Error creating alias "${indexName}": ${err.message}`,
      );
    }
  }

  public static async checkAliasExists(aliasName: string): Promise<boolean> {
    const instance = ElasticService.getInstance();

    try {
      return await instance.elasticClient.indices.existsAlias({
        name: aliasName,
      });
    } catch (err) {
      instance.logger.error(
        `Error checking alias "${aliasName}": ${err.message}`,
      );
      return false;
    }
  }

  public static async performRollover(
    aliasName: string,
    conditions: any,
  ): Promise<void> {
    const instance = ElasticService.getInstance();

    try {
      const response = await instance.elasticClient.indices.rollover({
        alias: aliasName,
        body: { conditions },
      });
    } catch (err) {
      instance.logger.error(
        `Error performing rollover for alias "${aliasName}": ${err.message}`,
      );
    }
  }

  public static async deleteIndex(indexName: string) {
    const instance = ElasticService.getInstance();

    try {
      return await instance.elasticClient.indices.delete({ index: indexName });
    } catch (err) {
      instance.logger.error(
        `Error deleting index "${indexName}": ${err.message}`,
      );
    }
  }

  //Utils
  private async verifyConnection(): Promise<boolean> {
    try {
      await this.elasticClient.ping();
      return true;
    } catch (err) {
      this.logger.error('ElasticSearch ping failed. Server might be down.');
      return false;
    }
  }
}
