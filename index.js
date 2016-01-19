// Static templates form a directory of markup

var fs = require('fs')
var path = require('path');
var pkg = require('./package')

var m = module.exports = {}

var builtinDefinitions = `// Include definitions for timber v${pkg.version}
var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '\`': '&#x60;'
    },
    regex = new RegExp(Object.keys(escapeMap).join('|'), 'g');

function escapeHtml(aString) {
    return (aString + '').replace(regex, function (ch) {
        return escapeMap[ch];
    });
}

function escapeText(t) {
   return (t + '').replace(/(")/g, '\\\\"');
}

function escapeJson(o) {
  return JSON.stringify(o, 0, 2);
}
`

// define escapeHtml and escapeText for this file
eval(builtinDefinitions)

var methods = {
  h: 'escapeHtml',
  t: 'escapeText',
  j: 'escapeJson',
  e: '',         // XXX raw
  '(': 'evaluate', // TODO Implement evaluate
  '.': 'NONE'      // Dont invoke a function
}

var methods1 = {
  h: {
    name:     'escapeHtml',
    call:          'apply',
    method:       ''
  },
  d: {
    name:     'defaultArg',
    argParse: 'apply',      // Parse the arguments to {d <args>} as an array, fit for apply
  }
};

function replaceVar(args, varName) {
  // console.warn('replaceVar', args, varName);
  if (args[0] === '(')
    args = '( ' + args.slice(1);
  var a = args.split(/\s+/g);
  if (!methods.hasOwnProperty(a[0]))
    throw new Error("No method '" + a[0] + "'");
  var keyLookup = a.slice(1).join(' ').trim();
  if (a[0] === 'e') {
    // keyLookup = keyLookup;
  } else if (/^\d+$/.test(keyLookup)) {
    keyLookup = varName + '[' + keyLookup + ']';
  } else if (/^\w+$/.test(keyLookup)) {
    keyLookup = varName + '.' + keyLookup;
  } else if (/^\.$/.test(keyLookup)) {
    keyLookup = varName;
  } else if (/\W/.test(keyLookup)) {
    keyLookup = varName + '["' + keyLookup + '"]';
  }
  return '" + ' + methods[a[0]] + '(' + keyLookup + ') + "';
}

function replaceParts(text, varName) {
  var parts = [], pos = 0;
  while (text && true) {
    pos = text.search(/\{([htej(])/);
      if (pos < 0) {
        if (text.length > 0)
          parts.push(escapeText(text));
        break;
      } else {
        parts.push(escapeText(text.slice(0, pos)));
        text = text.slice(pos + 1);
      pos = text.search(/\}/);
      if (pos < 0) {
        throw new Error("No ending '}' found");
      }
      var t1 = replaceVar(text.slice(0, pos), varName);
      parts.push(t1);
      text = text.slice(pos + 1);
    }
  }
  return '"' + parts.join('') + '";';
}

// Get nested blocks prefixed with keywords
//
// Task: Parse a nested text into scopes
//
//
//     :loop
//       hello
//     end this
//       :loop
//         this
//
function parse(text) {
  var result = [{cmd: 'function', indent: -1}],
  scope  = result,
  scopes = [scope],
  re = /^([ ]*)(\S.*)$/mg,
  m;

  while ((m = re.exec(text)) !== null) {
    var indent = m[1].length;

    if (scope[0].indent >= indent) {
      for (var i = scopes.length - 1; i >= 0; i -= 1) {
        if (scopes[i][0].indent < indent) {
          scope = scopes[i];
          break;
        }
      }
    }

    var n = /^:(\S+)\s*(.*)$/.exec(m[2]);
    if (n) {
      scopes.push(scope);
      scope.push([{cmd: n[1], args: n[2], indent: indent}]);
      scope = scope[scope.length - 1];
    } else {
      if (scope.length >= 1)
        scope.push(m[0] + '\\n');
      else
        scope.push(m[2]);
      }
  }
  return result;
}

function spaces(n) {
  var result = '';
  while (n > 0) {
    result += ' ';
    n -= 1;
  }
  return result;
}

var JSspecial = {"\"": "\\\"", "\\": "\\\\", "\f": "\\f", "\b": "\\b",
"\n": "\\n", "\t": "\\t", "\r": "\\r", "\v": "\\v"};
function escapeJs(text) {
  return String(text).replace(/[\"\\\f\b\n\t\r\v]/g, function(ch) {return JSspecial[ch];});
}

var varCount = -1;
function getVarName() {
  varCount += 1;
  return 'v' + varCount;
}

function cmdHeader(head, indent) {
  var indent1 = spaces(indent), indent2 = spaces(indent + 2);
  switch(head.cmd) {
  case 'if':
    return ['o', indent1 + 'if (' + head.args + ') {\n' + indent2 +
      'result += '];
  case 'else':
    return ['o', indent1 + 'else {\n' + indent2 + 'result += '  ];
  case 'elsif':
    return ['o', indent1 + 'else if (' + head.args + ') {\n' + indent2 + 'result += '];
  case 'loop':
    var itName = getVarName(),
    varName = getVarName(),
    array = head.args || 'o';

    return [varName, indent1 +
      'for (var ' + itName + ' = 0; ' +
        itName    + ' < ' + array + '.length; ' + itName + ' += 1) {\n' +
          indent2   + 'var ' + varName + ' = ' + 
          array + '[' + itName + '];\n' +
    indent2   + 'result += '];
  case 'each':
    var itName = getVarName(),
        varName = getVarName();
    array = head.args || 'o';

    return [varName, indent1 +
      'for (var ' + itName + ' in ' + array + ') {\n' +
        indent2   + 'var ' + varName + ' = ' + array + '[' + 
                                              itName +'];\n' +
        indent2   + 'result += '];

  case 'function':
    return ['o', 'function (o) {\n' + indent2 + 'var result = '];
  }
}

function stringify(ast) {
  return _stringify(ast, 0);
}

function _stringify(ast, indent) {
    var result   = [],
        head     = ast[0],
        cmd      = cmdHeader(ast[0], indent), varName  = cmd[0],
        cmdText  = cmd[1],
        hadArray = false,
        header   = '',
        indent2  = spaces(indent + 2),
        functionTextBlockCount = 0 ;

    result.push(cmdText);
    var index = 1, decls = [''], obj;

    var collect = (afterArray) => {
      if (head.cmd === 'function' || head.cmd === 'loop' || head.cmd === 'if') {
        result[result.length - 1] += 
        indent2 + (functionTextBlockCount === 0 ? '' : 'result += ') + 
        replaceParts(decls.join(''), varName); 
        functionTextBlockCount += 1;
      } else {
        result[result.length - 1] += replaceParts(decls.join(''), varName); 
      }
      decls = [''];
    };

    while (index < ast.length) {
      obj = ast[index];
      if ('string' === typeof obj) {
        decls.push(obj);
      } else {
        if (Array.isArray(obj)) {
          if (decls.length > 0)
            collect(true);
          result.push(_stringify(obj, indent + 2));
        }
      }
      index += 1;
    }
    if (decls.length > 0)
      collect();

    switch(head.cmd) {
    case 'if': case 'elseif': case 'else': case 'loop': case 'each':
      result.push(spaces(indent) + '}\n');
      break;
    case 'function':
      result.push('return result; }\n');
      break;
    }
    return result.join('\n');
}

function noext(file) {
  return file.replace(/^([^\.]+)(?:\.\w{1,4})$/, '$1');
}

function requireFromString(src, filename) {
  var Module = module.constructor;
  var m = new Module();
  m._compile(src, filename);
  return m.exports;
}

function evalFun(fun) {
  return new Function(builtinDefinitions + 'return ' + fun + ';')();
}

function compileDir(dirname, context, template, data) {
  if (dirname === 'builtin')
    return builtinDefinitions;

  // TODO Handle symlinks
  var stat = fs.statSync(dirname);
  var files;
  if (stat.isDirectory()) {
    files = fs.readdirSync(dirname).filter(function (file) {
      return !/^\./.test(file);
    }).map(function (file) {
      return dirname + '/' + file;
    });
  } else if (stat.isFile()) {
    files = [dirname];
  } else {
    throw new Error('TODO stat.is...');
  }

  var blurb = '// Timber templates v' + pkg.version + ' compiled ' +
                                 (new Date()).toISOString() + '\n',
      result = [ ];
  files.forEach(function (filePath) {
    var fileName = path.basename(filePath);
    var functionName = noext(fileName);
    var fileText = fs.readFileSync(filePath).toString();
    var templateResult = compileText(fileText, functionName);
    result.push(`  ${functionName}: ${templateResult}`);
  });
  var isContext = context || '';
  if (isContext === 'eval') context = 'module.exports';
  result = context + ' = {\n' + result.join(',\n') + '\n};';
  if (isContext === 'eval') {
    result = builtinDefinitions + result;
    result = requireFromString(result);
    if (!template)            
      return result;
    if (!data)
      return blurb + result[template].toString();
    if (fs.existsSync(data))
      data = fs.readFileSync(data).toString();
    try {
      data = evalFun(data);
    } catch (e) {
      throw new Error("Error evaluating " + data + ":" + e.message);
    }
    return result[template](data);
  }
  // var myself, method;
  // if (template) {
      // myself = requireFromString(result);
      // // console.warn('Myself', myself);
      // method = myself[template];
      // if (!method) {
          // method = function (o, i) {
              // console.warn('Error:" No such method', template);
          // };;
      // }
  // }
  // if (myself && data) {
      // if (!Array.isArray(data)) data = [data];
      // return method.apply(myself, data);
  // }
  return blurb + result;
}

function requireDir(dirname) {
  return compileDir(dirname, 'eval')
}

function compileText(text) {
  var ast = parse(text);
  return stringify(ast);
}

m.replaceParts = replaceParts;
m.parse        = parse;
m.stringify    = stringify;
m.compileText  = compileText;
m.compileDir   = compileDir;
m.requireDir   = requireDir;
