var x = {},
    assert = require('assert'),
    is = require('should'),
    mmodel = require('../lib/index'),
    Puzzle = require("./lib/puzzle"),
    FEN = "K7/8/kpQQ4/8/8/8/8/8" 

Puzzle.setStore("memory")
var p, o

exports.jsonify = function(done) {
  o = {fen: "BADFEN#", user: "billy", num_moves: 1, solution: [[25, 15]]}
  p = new Puzzle(o)
  var json = p.toJSON()
  var data = JSON.parse(json)
  assert.eql(data, {"user":"billy","fen":"BADFEN#","solution":[[25,15]],"num_moves":1})
  assert.eql(o, data)
  done()
}