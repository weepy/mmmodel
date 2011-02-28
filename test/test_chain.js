var chain = require("../lib/utils").chain
var is = require("assert")

exports.test_sync = function(done) {
  chain([
    function() {
      return 1
    },
    function() {
      return 2
    }
  ], function(results) {
    is.eql(results, [1,2])
    done()
  })
}

exports.test_sync_with_ags = function(done) {
  chain([
    function(x) {
      return x+1
    },
    function(x) {
      return x+2
    }
  ], [1], function(results) {
    is.eql(results, [2,3])
    done()
  })
}


exports.test_async = function(done) {
  
  function add(a, b, cb) {
    cb(a+b)
  }
  add.async = true
  
  chain([
    add,
    add
  ], [2,3], function(results) {
    is.eql(results, [5,5])
    done()
  })
}

exports.test_mix = function(done) {
  
  function a_add(a, b, cb) {
    cb(a+b)
  }
  a_add.async = true
  
  function times(a, b) {
    return a*b
  }
  
  chain([
    a_add,
    times
  ], [2,3], function(results) {
    is.eql(results, [5,6])
    done()
  })
}



// exports.test = function(done) {
//   
//   chain([
//     function(n) {
//       setTimeout(function() { n(1)}, 4)
//     },
//     function(n) {
//       setTimeout(function() { n(2)}, 4)
//     },
//     function(n) {
//       setTimeout(function() { n(3)}, 4)
//     },
//     function(n) {
//       setTimeout(function() { n(4) },  4)
//     }
//   ], function(results) {
//     is.eql(results, [1,2,3,4])
//   })
//   
// }
// 
// exports.test2 = function(done) {
//   chain([
//     function(n) {
//       setTimeout(function() { n(1)}, 4)
//     },
//     function(n) {
//       setTimeout(function() { n(2)
//       }, 4)
//     },
//     function(n) {
//       setTimeout(function() { n( false)}, 4)
//     },
//     function(n) {
//       setTimeout(function() { n(4) },  4)
//     }
//   ], function(results) {
//     is.eql(results, [1,2]) 
//     done()
//   })
// }