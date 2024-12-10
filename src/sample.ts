import { Application } from "@cmmv/core";
import { DefaultAdapter, DefaultHTTPModule } from "@cmmv/http";

import { ElasticModule } from "./elastic.module";
import { ElasticService } from "./elastic.service";

Application.create({
    httpAdapter: DefaultAdapter,
    modules: [
        DefaultHTTPModule,
        ElasticModule
    ],
    services: [ElasticService],
});