module.exports = (action, data) => {
    let temp = {};

    for (column in data) {
        if (column === 'user') {
            temp[`${action}_${column}`] = data[column];
        } else {
            temp[column] = data[column];
        }
    }
    
    return temp;
}