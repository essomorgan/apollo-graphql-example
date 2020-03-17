const { gql } = require('apollo-server');

module.exports = gql`
    type Menu {
        id: ID
        i18n: String
        file: String
        children: [Menu]
    }

    input MenuInput {
        parent: ID
        i18n: String
        route: String
        priority: Int
        user: String
    }

    type MenuMutationResponse {
        success: Boolean!
        msg: String!
        menu: Menu
    }

    extend type Query {
        getMenus: [Menu]
    }

    extend type Mutation {
        createMenu(input: MenuInput): MenuMutationResponse
        updateMenu(id: ID!, input: MenuInput): MenuMutationResponse
        deleteMenu(id: ID!): MenuMutationResponse
    }
`;