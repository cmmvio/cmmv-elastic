import { Module } from '@cmmv/core';
import { ElasticService } from "../services/elastic.service";

export const ElasticModule = new Module('elastic', {
    providers: [ElasticService]
});
