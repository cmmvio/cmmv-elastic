import { Module } from '@cmmv/core';
import { ElasticService } from './elastic.service';

export const ElasticModule = new Module('elastic', {
  providers: [ElasticService],
});
