const { db } = require('../../database/postgres');
const tables = {
    type: {
        name: 'article_type_foundation',
        key: 'type_uuid`'
    },
    article: {
        name: 'article_foundation',
        key: 'article_uuid'
    }
};

const oath_id = '***';

module.exports = {
    Query: {
        getPostTypes: () => {
            let callback = db(oath_id)(tables.type.name)
                .column({id: 'type_uuid'}, {name: 'i18n_code'})
                .select()
                .orderBy('name', 'asc');

            return callback;
        },
        getPosts: (parent, { id }) => {
            let callback = db(oath_id)(tables.article.name)
            .select()
            .where({type_uuid: id})
            .orderBy('update_time', 'desc');

            return callback;
        },
        getVision: () => {
            let callback = db(oath_id)(tables.article.name)
            .select()
            .where({type_uuid: 'df9ce6f0-09d4-453d-8414-fa2f34b3242c'});

            return callback;
        }
    }
}