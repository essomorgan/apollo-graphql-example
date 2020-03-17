const { db } = require('../../database/postgres');
const dataMapping = require('../../components/DataMapping');
const tableName = 'menu_foundation';

const oath_id = '*';

module.exports = {
    Menu: {
        children: (parent, args) => {
            return db(oath_id)(tableName)
                .column({ id: 'menu_uuid' }, { i18n: 'i18n_code' }, { file: 'file_name' })
                .select()
                .where({ parent_uuid: parent.id })
                .orderBy('priority', 'asc');
        }
    },
    Query: {
        getMenus: () => {
            return db(oath_id)(tableName)
                .column({ id: 'menu_uuid' }, { i18n: 'i18n_code' }, { file: 'file_name' })
                .select()
                .where({ parent_uuid: null })
                .orderBy('priority', 'asc');
        }
    },
    Mutation: {
        createMenu: async (parent, { input }) => {
            let data = await db(oath_id)(tableName).select().where('i18n_code', input.i18n);

            if (data.length === 0) {
                let data = {
                    i18n_code: input.i18n,
                    file_name: input.route,
                    parent_uuid: input.parent,
                    priority: input.priority,
                    user: oath_id
                };
                let new_id = db(oath_id)(tableName).insert(dataMapping('create', data)).returning('menu_uuid');
                return {
                    success: true,
                    msg: 'insert data success',
                    menu: {
                        id: new_id,
                        parent: input.parent_uuid,
                        code: input.code,
                        route: input.route,
                        priority: input.priority
                    }
                }
            } else {
                return {
                    success: false,
                    msg: 'data exist',
                    menu: {
                        id: data[0].menu_uuid,
                        parent: data[0].parent_uuid,
                        code: data[0].code,
                        route: data[0].route,
                        priority: data[0].priority
                    }
                }
            }

        },
        updateMenu: (parent, args) => {
            return db(oath_id)(tableName)
                .where('menu_uuid', input.id)
                .update(argsBuilder(input))
        }
    }
}