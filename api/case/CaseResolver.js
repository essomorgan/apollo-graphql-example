const { db } = require('../../database/postgres');
const dataMapping = require('../../components/DataMapping');
const tables = {
    case: {
        name: 'case_foundation',
        key: 'case_uuid'
    },
    urban: {
        name: 'case_location_foundation',
        key: 'location_uuid'
    },
    room: {
        name: 'case_room_foundation',
        key: 'room_uuid'
    },
    mapping: {
        name: 'location_room_setting'
    }
}

const oath_id = '*';

const isRowExist = async args => {
    let result = await db(oath_id)(args.table).select().where(args.filters);

    return result.length != 0;
}

const insertRow = async args => {
    let callback = await db(oath_id)(args.table).insert(dataMapping('create', args.data)).returning(args.return);
    let values = Object.values(callback);

    return values[0];
}

const updateRow = async args => {
    let callback = await db(oath_id)(args.table).update(dataMapping('update', args.data)).where(args.filters);

    return callback;
}

/* const upsertRow = async args => {
    let table = tables[args.type];
    let isOldId = args.id.length >= 40;

    let id = isOldId ? args.id.repleace('urban_', '') : args.id;

    if (isOldId) {
        await updateRow({
            table: table.name,
            data: args.data,
            filters: {
                [table.key]: id
            }
        });

        return true;
    } else {
        let urbanID = await insertRow({
            table: table.name,
            data: args.data,
            return: 'location_uuid'
        });

        locationIDs[args.data.id] = urbanID;
        return true;
    }
}

const upsertUrban = args => {
    upsertRow({
        type: 'urban',
        data: {

        }
    });
} */

const switchDataStatus = async args => {
    let callback = await db(oath_id)(args.table).update({ enable: args.enable, update_user: oath_id }).where(args.filters);

    return callback;
}

const disableGroupData = async args => {
    let table = tables[args.type];
    let filters = {
        [table.key]: args.data
    };
    await switchDataStatus({
        table: table.name,
        enable: false,
        filters: filters
    });

    await switchDataStatus({
        table: tables.mapping.name,
        enable: false,
        filters: filters
    });
}

module.exports = {
    Case: {
        urbans: (parent) => {
            return db(oath_id)(tables.urban.name)
                .column({ id: 'location_uuid' }, { name: 'location_name' }, { square: 'square' }, { parking: 'parking_spaces' }, { underground: 'underground_floor' }, { ground: 'ground_floor' })
                .select()
                .where({ parent_uuid: parent.id, enable: true });
        },
        rooms: (parent) => {
            return db(oath_id)(tables.room.name)
                .column({ id: 'room_uuid' }, { name: 'room_name' }, { count: 'count' }, { min: 'square_min' }, { max: 'square_max' }, { privates: 'private_room_count' }, { opens: 'open_room_count' }, { baths: 'bathroom_count' })
                .select()
                .where({ parent_uuid: parent.id, enable: true });
        }
    },
    Room: {
        locations: async (parent, args) => {
            let array = [];

            await db(oath_id)(`${tables.mapping.name} as set`)
                .column({ id: 'set.location_uuid' }, { name: 'urban.location_name' })
                .select()
                .leftJoin(`${tables.urban.name} as urban`, 'set.location_uuid', 'urban.location_uuid')
                .where({ 'set.room_uuid': parent.id, 'set.enable': true })
                .then(result => {
                    result.forEach(item => array.push(item.id));
                });

            return array;
        }
    },
    Query: {
        getCases: () => {
            let callback = db(oath_id)(tables.case.name)
                .column({ id: 'case_uuid' }, { name: 'title' })
                .select()
                .orderBy('name', 'asc');

            return callback;
        },
        getCase: (parent, { id }) => {
            let callback = db(oath_id)(tables.case.name)
                .column({ id: 'case_uuid' }, { name: 'title' }, { location: 'position' }, { zone: 'urban_zone' }, { design: 'design_entity' }, { build: 'build_entity' }, { promo: 'promotion_date' }, { complete: 'complete_date' }, { tel: 'tel' })
                .select()
                .where({ case_uuid: id, enable: true })
                .then(result => {
                    return result[0];
                });

            return callback;
        },
    },
    Mutation: {
        createOrUpdateCase: async (parent, { input }) => {
            let locationIDs = {};
            let caseExist = await isRowExist({
                table: tables.case.name,
                filters: {
                    title: input.name,
                    enable: true
                }
            });

            console.log(input);
            

            if (caseExist) {
                await updateRow({
                    table: tables.case.name,
                    data: {
                        type_uuid: '*',
                        title: input.name,
                        position: input.location,
                        design_entity: input.design,
                        build_entity: input.build,
                        promotion_date: input.promo,
                        complete_date: input.complete,
                        tel: input.tel,
                        urban_zone: input.zone,
                        user: oath_id
                    },
                    filters: {
                        [tables.case.key]: input.id
                    }
                });

                if (input.remove.urbans) {
                    input.remove.urbans.forEach(urban => {
                        disableGroupData({
                            type: 'urban',
                            data: urban
                        });
                    });
                }

                if (input.remove.rooms) {
                    input.remove.rooms.forEach(room => {
                        disableGroupData({
                            type: 'room',
                            data: room
                        });
                    });
                }

                if (input.remove.mapping) {
                    input.remove.mapping.forEach(async mapping => {
                        let array = mapping.split('_');
                        // array[1]: roomID, array[3]: urbanID
                        if (array[1].length === 40 && array[3].length === 40) {
                            await switchDataStatus({
                                table: tables.mapping.name,
                                enable: false,
                                filters: {
                                    [tables.room.key]: array[1],
                                    [tables.urban.key]: array[3]
                                }
                            });
                        }
                    });
                }

                if (input.urbans) {
                    await input.urbans.forEach(async urban => {
                        let isOldId = urban.id.length >= 40

                        let id = isOldId ? urban.id.replace('urban_', '') : urban.id;

                        if (isOldId) {
                            locationIDs[id] = id;                            
                            await updateRow({
                                table: tables.urban.name,
                                data: {
                                    parent_uuid: input.id,
                                    parking_spaces: parseInt(urban.parking),
                                    square: parseFloat(urban.square),
                                    ground_floor: parseInt(urban.ground),
                                    underground_floor: parseInt(urban.underground),
                                    location_name: urban.name,
                                    user: oath_id
                                },
                                filters: {
                                    [tables.urban.key]: id,
                                }
                            });
                        } else {
                            let urbanID = await insertRow({
                                table: tables.urban.name,
                                data: {
                                    parent_uuid: input.id,
                                    parking_spaces: parseInt(urban.parking),
                                    square: parseFloat(urban.square),
                                    ground_floor: parseInt(urban.ground),
                                    underground_floor: parseInt(urban.underground),
                                    location_name: urban.name,
                                    user: oath_id,
                                    enable: true
                                },
                                return: 'location_uuid'
                            });

                            locationIDs[id] = urbanID;
                        }
                    });
                }

                if (input.rooms) {
                    input.rooms.forEach(async room => {
                        let isOldId = room.id.length >= 40;

                        let id = isOldId ? room.id.replace('room_', '') : room.id;

                        if (isOldId) {
                            await updateRow({
                                table: tables.room.name,
                                data: {
                                    parent_uuid: input.id,
                                    room_name: room.name,
                                    count: parseInt(room.count),
                                    square_min: parseInt(room.min),
                                    square_max: parseInt(room.max),
                                    user: oath_id,
                                    private_room_count: parseInt(room.privates),
                                    open_room_count: parseInt(room.opens),
                                    bathroom_count: parseInt(room.baths),
                                    enable: true
                                },
                                filters: {
                                    [tables.room.key]: id
                                }
                            });

                            for (location of room.locations) {
                                let array = location.split('_');

                                if (array[1].length === 36) {
                                    await switchDataStatus({
                                        table: tables.mapping.name,
                                        enable: true,
                                        filters: {
                                            [tables.room.key]: id,
                                            [tables.urban.key]: array[1]
                                        }
                                    });
                                } else {
                                    await insertRow({
                                        table: tables.mapping.name,
                                        data: {
                                            location_uuid: locationIDs[array[1]],
                                            room_uuid: id,
                                            enable: true,
                                            user: oath_id
                                        },
                                        return: 'location_uuid'
                                    });
                                }
                            }
                        } else {
                            let roomID = await insertRow({
                                table: tables.room.name,
                                data: {
                                    parent_uuid: input.id,
                                    room_name: room.name,
                                    count: parseInt(room.count),
                                    square_min: parseInt(room.min),
                                    square_max: parseInt(room.max),
                                    user: oath_id,
                                    private_room_count: parseInt(room.privates),
                                    open_room_count: parseInt(room.opens),
                                    bathroom_count: parseInt(room.baths),
                                    enable: true
                                },
                                return: 'room_uuid'
                            });

                            for (location of room.locations) {
                                insertRow({
                                    table: tables.mapping.name,
                                    data: {
                                        location_uuid: locationIDs[location],
                                        room_uuid: roomID,
                                        enable: true,
                                        user: oath_id
                                    },
                                    return: 'location_uuid'
                                });
                            }
                        }
                    });
                }

                return {
                    success: true,
                    msg: 'update data success'
                }

            } else {
                let caseID = await insertRow({
                    table: tables.case.name,
                    data: {
                        type_uuid: '*',
                        title: input.name,
                        position: input.location,
                        design_entity: input.design,
                        build_entity: input.build,
                        promotion_date: input.promo,
                        complete_date: input.complete,
                        tel: input.tel,
                        urban_zone: input.zone,
                        user: oath_id,
                        enable: true
                    },
                    return: 'case_uuid'
                });

                if (input.urbans.length > 0) {
                    for (urban of input.urbans) {
                        let urbanData = {
                            parent_uuid: caseID,
                            parking_spaces: parseInt(urban.parking),
                            square: parseFloat(urban.square),
                            ground_floor: parseInt(urban.ground),
                            underground_floor: parseInt(urban.underground),
                            location_name: urban.name,
                            user: oath_id,
                            enable: true
                        };

                        let urbanID = await insertRow({
                            table: tables.urban.name,
                            data: urbanData,
                            return: 'location_uuid'
                        });

                        locationIDs[urban.id] = urbanID;
                    }
                }

                if (input.rooms.length > 0) {
                    for (room of input.rooms) {
                        let roomData = {
                            parent_uuid: caseID,
                            room_name: room.name,
                            count: parseInt(room.count),
                            square_min: parseInt(room.min),
                            square_max: parseInt(room.max),
                            user: oath_id,
                            private_room_count: parseInt(room.privates),
                            open_room_count: parseInt(room.opens),
                            bathroom_count: parseInt(room.baths),
                            enable: true
                        };

                        await insertRow({
                            table: tables.room.name,
                            data: roomData,
                            return: 'room_uuid'
                        });

                        for (location of room.locations) {
                            insertRow({
                                table: tables.mapping.name,
                                data: {
                                    location_uuid: locationIDs[location],
                                    room_uuid: roomID,
                                    enable: true,
                                    user: oath_id
                                },
                                return: 'location_uuid'
                            });
                        }
                    }
                }

                return {
                    success: true,
                    msg: 'insert data success'
                }
            }
        }
    }
}
