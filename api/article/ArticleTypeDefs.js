const { gql } = require('apollo-server');
module.exports = gql`
    type Category {
        id: ID,
        name: String
    }

    type Article {
        id: ID,
        title_text: String
        title_image: String
        body_text: String
        body_image: [String]
    }

    type Vision {
        id: ID,
        text: String
    }

    extend type Query {
        getPostTypes: [Category]
        getPosts(id: ID): [Article]
        getVision: Vision
    }
`;