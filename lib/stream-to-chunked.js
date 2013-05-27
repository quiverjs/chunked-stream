
"use strict"

var streamChannel = require('quiver-stream-channel')

var streamToChunkedStream = function(readStream, options) {
  options = options || { }
  var chunkHeadExtender = options.chunkHeadExtender
  var lastChunkExtender = options.lastChunkExtender
  var trailerExtender = options.trailerExtender

  var channel = streamChannel.createStreamChannel()
  var writeStream = channel.writeStream
  readStream.acquireOwnership({})

  var doPipe = function() {
    writeStream.prepareWrite(function(streamClosed) {
      if(streamClosed) return readStream.closeRead(streamClosed.err)

      readStream.read(function(streamClosed, data) {
        if(!streamClosed) {
          if(!(data instanceof Buffer)) data = new Buffer(data)
          var chunkSize = data.length
          var chunkHead = chunkSize.toString(16)

          if(chunkHeadExtender) chunkHead += chunkHeadExtender(data)

          chunkHead += '\r\n'

          writeStream.write(chunkHead)
          writeStream.write(data)
          writeStream.write('\r\n')
          doPipe()
        } else {
          var chunkHead = '0'
          if(lastChunkExtender) chunkHead += lastChunkExtender()
          chunkHead += '\r\n'

          if(trailerExtender) chunkHead += trailerExtender(streamClosed.err)
          chunkHead += '\r\n'
          writeStream.write(chunkHead)
          writeStream.closeWrite()
        }
      })
    })
  }
  doPipe()

  return channel.readStream
}

module.exports = {
  streamToChunkedStream: streamToChunkedStream
}