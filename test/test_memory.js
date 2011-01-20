var x = {},
    redis = require("redis"),
    client = redis.createClient(),
    is = require('assert'),
    should = require('should'),
    mmodel = require('../lib/index'),
    Puzzle = require("./lib/puzzle")
    
Puzzle.setStore("memory")    
Puzzle.client = client

var FEN = "K7/8/kpQQ4/8/8/8/8/8" 

client.on("error", function (err) {
    console.log("Redis connection error to " + client.host + ":" + client.port + " - " + err);
});

exports.zero_puzzles = function(done) {
  Puzzle.count(function(val) {
    val.should.equal(0)
    done()
  })
}
exports.unsaved_puzzle_has_no_id = function(done) {
  var p = new Puzzle()
  is.ok(!p.id)
  done()
}

exports.test_fen = function(done) {
  var p = new Puzzle({fen: "BADFEN#", user: "billy", num_moves: 1, solution: [[25, 15]]})  
  p.valid(function(ok) {
    is.ok(!ok)
    done()
  })
}

exports.save_valid_puzzle = function(done) {
  var p = new Puzzle({fen: FEN, user: "billy", num_moves: 1, solution: [[25, 15]]})
  is.ok(!p.saved, "not saved")
  p.save(function(ok) {
    if(!ok)
      console.log(p.errors)
    ok.should.be.true //(ok, "puzzle saved ok")
    is.ok(p.saved, "is saved")

    client.exists("Puzzle:1", function(err, data) {
      is.ok(!err)
      is.equal(data, 1)
    })
    
    Puzzle.count(function(num) {
      is.equal(num, 1, "puzzle count is 1")
      done()
    })
  })
}


exports.find_saved_puzzle = function(done) {
  Puzzle.find(1, function(u) {
    is.equal(u.id, 1, "id is correct")  
    
    client.get("Puzzles:n", function(err, data) {
      is.equal(data, "1", "count of puzzles is 1")
    })          
    
    Puzzle.count(function(num) {
      is.equal(num, 1, "puzzle count is 1")
      done()
    })
  })
}

// fails
exports.test_failed_create = function(done) {
  Puzzle.create({id: 21, fen: FEN, num_moves: 1, solution: [[25, 15]]}, function(p) {
    is.ok(!p.saved, "puzzle needs owner")
    //is.equal(p.id, 21, "id is 21")
    done()
  })
}

exports.test_create = function(done) {
  Puzzle.create({fen: FEN, user: "wibwob", num_moves: 1, solution: [[25, 15]]}, function(p) {
    is.ok(p.saved, "puzzle needs owner")
    p.id.should.equal(2)
  })
  
  Puzzle.create({fen: FEN, user: "wibwob", num_moves: 1, solution: [[25, 15]]}, function(p) {
    is.ok(p.saved, "puzzle needs owner")
    p.id.should.equal(3)
    done()
  })
}

exports.test_extra_data = function(done) {
  Puzzle.create({fen: FEN, user: "wibwob", description: "blah", failed: "haha", num_moves: 1, solution: [[25, 15]]}, function(p) {
    is.ok(p.title == null)
    is.ok(p.failed == null)
    is.ok(p.description == "blah")
    done()
  })
}

exports.test_solvable_puzzle = function(done) {

  Puzzle.create({fen: "K7/8/kpQQ4/8/8/8/8/8", user: "wibwob", description: "blah", num_moves: 1, solution: [[25, 15]]}, function(p) {
    is.ok(p.title == null)
    is.ok(p.failed == null)
    is.ok(p.description == "blah")
    done()
  })
}


exports.cleanup = function(done) {
  client.quit() 
  done()
}
