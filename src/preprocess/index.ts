import { createFilter } from 'rollup-pluginutils';

const getMarkup = (template) => {
  const openTag = '<template>';
  const start = template.indexOf(openTag);
  const closeTag = '</template>';
  const end = template.indexOf('</template>');

  return template.substring(start + openTag.length, end).trim();
}

const capitalize = (str) => {
  return typeof str === 'string' ? str.replace(/^\w/, c => c.toUpperCase()) : '';
};

const getCode = (template, id, tagName) => {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;
  const start = template.indexOf(openTag);
  const end = template.indexOf(closeTag);

  let code = template.substring(start + openTag.length, end).trim();

  const fileName = id.replace(/^.*[\\\/]/, '').replace(/\.crassula/, '');

  
  code = code
      .substring(0, code.length - 2)
      .trim()
      .concat(',')
      .concat(`\n\ttagName: '${fileName}-component',`)
      .concat(`\n\ttemplate: \`${getMarkup(template)}\`,`)
      .concat(`\n})`)
  
  return code;
}


export default function crassulaPreprocess(opts) {
  if ( opts === void 0 ) opts = {};

  if (!opts.include) {
    opts.include = '**/*.crassula'
  }

  var filter = createFilter(opts.include, opts.exclude);

  return {
    name: 'crassula',

    transform: function transform(template, id) {
      
      if (filter(id)) {
        var x = {
          code: getCode(template, id, 'script'),
          map: { mappings: '' }
        };

        return x;
      }
    }
  };
}

