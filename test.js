var path = require('path');
var test = require('tape');
var m = require('../index');

test('Compiling templates', function (t) {
  t.plan(1);

  var t0 = m.replaceParts("Hello {h you}", 'varName');
  console.warn(t0);
  var t1 = m.replaceParts("Hello {t you}", 'varName');
  console.warn(t1);
  var t2 = m.replaceParts("Hello {(you)}", 'varName');
  console.warn(t2);
  var t3 = m.replaceParts("Hello {h .}")
  console.warn('t3', t3);

  var tt = `
asas
:loop a
  aa
  bb {h hello} /bb
asas
end
`
console.warn('compiled', m.compile(tt));

  var t3 = `
<table class="{t className}">
<tr>
  <th>Time</th>
  <th>Status</th>
  <th>Sound</th>
</tr>
:loop
  <tr>
    <td>{h time}</td>
    <td>
      :if time > 11
         {h status}
         :if nested if
            Hello
         Back in time if
         That is
      :else
         {h status}
    </td>
    <td>{h sound}</td>
  </tr>
<tfoot>
</tfoot>
</table>
`;

var ast1 = m.parse(t3),
    js1  = m.stringify(ast1, 0),
    txt1 = m.replaceParts(js1, 'xx');

// pp(ast1);
console.log(txt1);
// pp(fin);

  var r1 = m.parse("Hello {h foo}");
  // t.equal(r1, []);
});


test.skip('compiling templates', function (t) {
    t.plan(3);
    var r1 = m.replaceParts('Hello "{{foo}}"');
    t.equal(r1, 'function noname($o) {\n return "Hello \\"" + htmlEscape($o.foo) + "\\"";\n}');
    var r2 = m.replaceParts('Hello "{{{foo}}}"');
    t.equal(r2, 'function noname($o) {\n return "Hello \\"" + $o.foo + "\\"";\n}');
});

test('read and eval dir', function (t) {
    t.plan(5);
    var templateDir = path.normalize(__dirname + '/../lib/templates');
    var r1 = m.compileDir(templateDir, 'var a =');
    t.ok(/escapeMap/.test(r1), 'escapeMap');
    t.ok(/htmlEscape/.test(r1), 'escapeMap');
    t.ok(/^\nvar escapeMap =/.test(r1), 'Foo = ' + r1.split(/\n/)[1]);
    var tpl = m.compileDir(templateDir, 'eval');
    t.ok(typeof tpl === 'object', 'an object');
    t.ok(typeof tpl.table === 'function', 'table is a function')
    console.warn(tpl);
    console.warn(tpl.ul([{value: 12}, {value: 100}]));
    // var htmlTable = tpl.table([
        // {name: 'foo', email: 'bar', last: 123123, msg: 'hi'}
    // ]);
}); 


var tpl1 = `
<p>Lines starting with a less than sign will be interpreted as html</p>
<span>Whereas</span>
<table>
for
    <tr><td>{{foo}}</td><td>{{{bar}}}</td></tr>
</table>
`;

var tpl2 = `
<h1>{{Hello}}</h1>
`;

var params1 = [
    {foo: '<foo>', bar: 'bar'},
    {foo: 12,      bar: 200},
];

var fun;
// console.log(fun = replaceParts('<tr><td>{{foo}}</td><td>{{{bar}}}</td><td>{{!1 +2}}</td></tr>'));
// console.log(fun = evalFun(fun));
// console.log(fun({foo: 'Nice "'}));

// console.log(fun = replaceParts('Hello """ {{foo}} world'));
// console.log(fun = evalFun(fun));
// console.log(fun({foo: 'Nice "'}));
