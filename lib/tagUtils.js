import _ from 'lodash';

const tagRegexp = /#([\w-]+)/g;

const normilizeTag = tag => _.trimStart(tag, '#').toLowerCase();
const getTags = str => str.match(tagRegexp) || [];
const replaceTagsWithTagLinks = (string, tags) => {
  if (!string) return string;
  return _.escape(string).replace(tagRegexp, (matchedTag) => {
    const tag = _.find(tags, ({ name }) => name === normilizeTag(matchedTag));
    return tag ? `<a href="${tag.id}">${matchedTag}</a>` : matchedTag;
  });
};

export {
  normilizeTag,
  getTags,
  replaceTagsWithTagLinks,
};
