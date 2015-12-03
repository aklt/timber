var tape = require('tape')
var spawn = require('tape-spawn')
var timber = require('./index')
var timberBin = __dirname + '/bin/timber'
var testDir = __dirname + '/test'

function test (method, input, expected) {
  expected = Array.isArray(expected) ? expected : [expected]
  input = JSON.stringify(input)
  tape(method + ' ' + input + ' --> ' + expected, function (t) {
    var command = timberBin + ' ' + testDir + ' eval ' + method +
                  ' \'' + input + '\''
    console.log(command)
    var st = spawn(t, command)
    expected.forEach(function (e) {
      st.stdout.match(e)
    })
    st.end()
  })
}

test('keywords', {foo: 'bar'}, [/^{\n\s+"foo":/m, /bar\nbar/])
