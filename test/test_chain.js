var chain = require("../lib/chain")
var is = require("assert")
exports.test = function(done) {
  
  chain([
    function(n) {
      setTimeout(function() { n(1)}, 4)
    },
    function(n) {
      setTimeout(function() { n(2)}, 4)
    },
    function(n) {
      setTimeout(function() { n(3)}, 4)
    },
    function(n) {
      setTimeout(function() { n(4) },  4)
    }
  ], function(results) {
    is.eql(results, [1,2,3,4])
    chain([
      function(n) {
        setTimeout(function() { n(1)}, 1)
      },
      function(n) {
        setTimeout(function() { n(2)}, 1)
      }
    ], function(results) {
      is.eql(results, [1,2])
      //console.log(typeof done)
      done()
    })
  })
  
}

exports.test2 = function(done) {
  chain([
    function(n) {
      setTimeout(function() { n(1)}, 4)
    },
    function(n) {
      setTimeout(function() { n(2)
      }, 4)
    },
    function(n) {
      setTimeout(function() { n( false)}, 4)
    },
    function(n) {
      setTimeout(function() { n(4) },  4)
    }
  ], function(results) {
    is.eql(results, [1,2]) 
    done()
  })
}