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