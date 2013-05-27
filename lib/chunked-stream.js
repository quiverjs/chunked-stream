
"use strict"

var chunkedToStream = require('./chunked-to-stream')
var streamToChunked = require('./stream-to-chunked')

module.exports = {
  streamToChunkedStream: streamToChunked.streamToChunkedStream,
  chunkedStreamToStream: chunkedToStream.chunkedStreamToStream
}