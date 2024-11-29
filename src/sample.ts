import { Application } from "@cmmv/core";
import { DefaultAdapter, DefaultHTTPModule } from "@cmmv/http";

import { ElasticModule } from "./modules/elastic.module";
import { ElasticService } from "./services/elastic.service";

Application.create({
    httpAdapter: DefaultAdapter,
    modules: [
        DefaultHTTPModule,
        ElasticModule
    ],
    services: [ElasticService],
});