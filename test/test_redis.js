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

exports.test_add_edge = function(done) {
  
  Task.add_edge(1, "popular", function() {
    Task.add_edge(2, "popular", function() {
      Task.find_edges("popular").all(function(edges) {
        edges.should.eql([1,2])
        done()
      })
    })
  })
}

exports.test_count_add_edge = function(done) {
  
  Task.find_edges("popular").count(function(num) {
    num.should.eql(2)
    done()
  })
}

exports.test_remove_edge = function(done) {  
  Task.remove_edge(1, "popular", function(ok) {
    Task.find_edges("popular").all(function(edges) {
      edges.should.eql([2])
      done()
    })
  })
}


exports.test_add_edge_instance = function(done) {
  
  Task.create({user:"hello"}, function(task) {
    
    task.add_edge(1, "related_tasks", function() {
      task.add_edge(2, "related_tasks", function() {
        task.find_edges("related_tasks").all(function(edges) {
          edges.should.eql([1,2])
          done()
        })
      })
    })
    
  })
}

exports.test_edge_instantiation = function(done) {
  Task.find_edges("popular").load_as(Task).all(function(tasks) {
    tasks.length.should.eql(1)
    should.ok(tasks[0] instanceof Task)
    done()
  })
}

exports.add_scoring_Edges = function(done) {
  Task.add_edge(1,"best", 100)
  Task.add_edge(2,"best", 4)
  Task.add_edge(3,"best", 10)
  Task.add_edge(4,"best", 5)
  Task.add_edge(5,"best", 0, done)
}

exports.test_scoring = function(done) {
  Task.find_edges("best").range(3,7).count(function(num){
    num.should.eql(2)
  }) 
  
  Task.find_edges("best").range(3,100).all(function(tasks){
    tasks.should.eql([2,4,3,1])
  })

  Task.find_edges("best").range(100,3).all(function(tasks){
    tasks.should.eql([1,3,4,2])
  })
  
  Task.find_edges("best").range(3,100).load_as(Task).all(function(tasks){
    tasks.length.should.eql(4)
    tasks[0].id.should.eql(2)
    done()
  })  
}



exports.test_destroy = function(done) {
  Task.count(function(num) {
    num.should.eql(4)
    Task.find(1, function(p) {
      p.destroy(function() {
        Task.find(1, function(p) {
          is.ok(!p)
          Task.count(function(num) {
            num.should.eql(3)
            done()
          })
        })
      })
    })
  })
}

exports.test_destroy2 = function(done) {

  Task.count(function(num) {
    num.should.eql(3)
    Task.find(2, function(p) {
      p.destroy(function() {
        Task.find(2, function(p) {
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

exports.test_dirty = function(done) {
  task2 = new Task({user:"billy"})
  task2.user = "johnny" 
  task2.dirty().should.be.ok
  task2.dirty("user").should.be.ok
  task2.save(function() {
    task2.dirty().should.not.be.ok
    task2.dirty("user").should.not.be.ok
    done()
  })
}


exports.cleanup = function(done) {
  client.quit() 
  done()
}
