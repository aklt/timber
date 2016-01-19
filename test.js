var tape = require('tape')
var spawn = require('tape-spawn')
var timber = require('./index')
var timberBin = __dirname + '/bin/timber'
var testDir = __dirname + '/test'

function testEval (method, input, expected) {
  expected = Array.isArray(expected) ? expected : [expected]
  input = JSON.stringify(input)
  tape('Method ' + method + ' with data ' + input + ' matches ' + expected, function (t) {
    var command = timberBin + ' ' + testDir + ' eval ' + method +
                  ' \'' + input + '\''
    // console.log(command)
    var st = spawn(t, command)
    expected.forEach(function (e) {
      st.stdout.match(e)
    })
    st.end()
  })
}

testEval('escape', {foo: 'FO&'}, [/FO&amp;/, /FO&/])
testEval('loopNumbers', {array1: [1, 2, 3]}, 
  [/^  number1/m, /^  number2/m, /^  number3/m])
testEval('loopObjects', {array1: [{a: 'aa'}, {a: 'bb'}]},
  [/^  aa/m, /^  bb/m])
