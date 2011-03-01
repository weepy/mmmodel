var x = {},
    redis = require("redis"),
    client = redis.createClient(),
    is = require('assert'),
    should = require('should')
    Task = require("./lib/task")
    
Task.setStore("redis")
Task.client = client


client.on("error", function (err) {
    console.log("Redis connection error to " + client.host + ":" + client.port + " - " + err);
});



exports.zero_tasks = function(done) {
  
  client.select(15)
  client.FLUSHDB(function() {
    Task.count(function(val) {
      val.should.equal(0)
      done()
    })
  })
}


exports.save_valid_task = function(done) {
  var t = new Task({user: "billy"})

  t.save(function(ok) {

    if(!ok) console.log(t.errors)
    ok.should.be.true //(ok, "task saved ok")
    is.ok(t.id, "is saved")

    client.exists("Task:1", function(err, data) {
      is.ok(!err)
      is.equal(data, 1)
    })


    Task.count(function(num) {
      is.equal(num, 1)
      done()
    })

  })
}

exports.find_saved_task = function(done) {
  Task.find(1, function(u) {
    is.equal(u.id, 1, "id is correct")  

    Task.count(function(num) {
      is.equal(num, 1, "task count is 1")
      done()
    })
  })
}

exports.find_saved_non_existing_task = function(done) {
  Task.find(1234, function(u) {
    is.equal(u, null)  
    done()
  })
}


// exports.test_failed_create = function(done) {
//   Task.create({id: 21,user:"jonah"}, function(p) {
//     is.ok(p.errors.length > 0, "can't have id")
//     done()
//   })
// }

exports.test_find_fail = function(done) {
  Task.find(211, function(p) {
    should.ok(p == null)
    done()
  })
}

exports.test_create = function(done) {
  Task.create({user: "wibwob"}, function(p) {
    is.ok(p.errors.length == 0)

    p.id.should.equal(2)

    Task.find(2, function(p2) {
      p.toJSON().should.eql(p2.toJSON())
      
      Task.all(function(tasks) {
        // console.log(tasks, "tasks")
        tasks.length.should.eql(2)
        done()
      })
            
      // console.log(p2, p)
      // Task.all(function(tasks) {        
      //         console.log(tasks, tasks.length)
      //         done()
      //       })

    })
  })
  
}


exports.test_all = function(done) {
  Task.count(function(num) {
    num.should.eql(2)
    done()
  })
}

exports.test_create2 = function(done) {
  
  Task.create({user: "wibwob2"}, function(x) {
    is.ok(x.errors.length == 0, "task needs owner")
    x.id.should.equal(3)
    
    Task.count(function(num) {
      num.should.eql(3)
    })
    
    Task.all(function(tasks) {
      tasks.length.should.eql(3)
      done()
    })
  
  })
  
}



exports.test_extra_data = function(done) {
  var p = new Task({user: "wibwob", description: "blah", failed: "haha", num_moves: 1, solution: [[25, 15]]})  
  is.ok(p.solution === undefined)
  is.ok(p.failed === undefined)
  done()
}


exports.test_all2 = function(done) {    
  Task.all(function(tasks) {
    tasks.length.should.eql(3)
    done()
  })
}

exports.test_destroy = function(done) {
  Task.count(function(num) {
    num.should.eql(3)
    Task.find(1, function(p) {
      p.destroy(function() {
        Task.find(1, function(p) {
          is.ok(!p)
          Task.count(function(num) {
            num.should.eql(2)
            done()
          })
        })
      })
    })
  })
}

exports.test_destroy2 = function(done) {

  Task.count(function(num) {
    num.should.eql(2)
    Task.find(2, function(p) {
      p.destroy(function() {
        Task.find(2, function(p) {
          is.ok(!p)
          Task.count(function(num) {
            num.should.eql(1)
            done()
          })
        })
      })
    })
  })
}


exports.cleanup = function(done) {
  client.quit() 
  done()
}
