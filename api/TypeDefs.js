const { gql } = require('apollo-server');
const menu = require('./menu/MenuTypeDefs');
const project = require('./case/CaseTypeDefs');
const post = require('./article/ArticleTypeDefs');

const temp = gql`
    type Query {
        _empty: String
    }

    type Mutation {
        _empty: String
    }
`

const combinedArray = [temp, menu, project, post];

module.exports = combinedArray;