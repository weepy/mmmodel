exports.core = require("./core")

exports.redis = function(type, properties) {
  return exports.core(type, properties, "redis")
}

exports.rest = function(type, properties) {
  return exports.core(type, properties, "rest")
}

exports.memory = function(type, properties) {
  return exports.core(type, properties, "memory")
}

