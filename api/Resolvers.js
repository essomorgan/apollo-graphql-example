const { merge } = require('lodash');

const menu = require('./menu/MenuResolver');
const project = require('./case/CaseResolver');
const post = require('./article/ArticleResolver');

module.exports = merge(menu, project, post);