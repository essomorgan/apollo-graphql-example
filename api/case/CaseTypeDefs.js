const { gql } = require('apollo-server');
module.exports = gql`
    type Case {
        id: ID
        location: String
        name: String
        design: String
        build: String
        promo: String
        complete: String
        tel: String
        zone: String
        urbans: [Urban]
        rooms: [Room]
    }

    type Urban {
        id: ID
        name: String
        square: Float
        parking: Int
        underground: Int
        ground: Int
    }

    type Room {
        id: ID
        name: String
        count: Int
        min: Float
        max: Float
        privates: Int
        opens: Int
        baths: Int
        locations: [String]
    }

    input CaseInput {
        id: String
        name: String
        location: String
        design: String
        build: String
        promo: String
        complete: String
        tel: String
        zone: String
        urbans: [UrbanInput]
        rooms: [RoomInput]
        remove: RemoveInput
    }

    input UrbanInput {
        id: String
        name: String
        square: String
        parking: String
        underground: String
        ground: String
    }

    input RoomInput {
        id: String
        name: String
        count: String
        min: String
        max: String
        privates: String
        opens: String
        baths: String
        locations: [String]
    }

    input RemoveInput {
        rooms: [String]
        urbans: [String]
        mapping: [String]
    }

    type CaseMutationResponse {
        success: Boolean!
        msg: String!
        case: Case
    }

    extend type Query {
        getCases: [Case]
        getCase(id: ID!): Case
    }

    extend type Mutation {
        createOrUpdateCase(input: CaseInput): CaseMutationResponse
        updateCase(id: ID!, input: CaseInput): CaseMutationResponse
        disableCase(id: ID!): CaseMutationResponse
    }
`