
"use strict"

var error = require('quiver-error').error
var streamChannel = require('quiver-stream-channel')
var headExtractor = require('quiver-stream-head-extractor')
var pushbackStream = require('quiver-stream-pushback').pushbackStream

var pipeChunk = function(pipeSize, readStream, writeStream, callback) {
  var totalSize = 0

  var doPipe = function() {
    writeStream.prepareWrite(function(streamClosed) {
      if(streamClosed) {
        readStream.closeRead(streamClosed.err)
        return callback(error(400, 'write stream ended prematurely'))
      }

      readStream.read(function(streamClosed, data) {
        if(streamClosed) return callback(error(400, 'chunked stream ended prematurely'))

        if(!data instanceof Buffer) data = new Buffer(data)

        totalSize += data.length
        if(totalSize == pipeSize) {
          writeStream.write(data)
          callback(null, readStream)
        } else if(totalSize > pipeSize) {
          var overflowSize = totalSize - pipeSize
          var passSize = data.length - overflowSize
          var passBuffer = data.slice(0, passSize)
          var restBuffer = data.slice(passSize)

          writeStream.write(passBuffer)

          callback(null, pushbackStream(readStream, [restBuffer]))
        } else {
          writeStream.write(data)
          doPipe()
        }
      })
    })
  }
  doPipe()
}

var extractTrailingHeaders = function(headers, readStream, callback) {
  headExtractor.extractAsciiStreamHead({separator: '\r\n'}, readStream,
    function(err, chunkHead, restStream) {
      if(err) return callback(err)

      if(chunkHead.length == 0) return callback(null, headers)

      headers.push(chunkHead)
      extractTrailingHeaders(headers, restStream, callback)
    })
}

var chunkedStreamToStream = function(chunkedStream, options) {
  var channel = streamChannel.createStreamChannel()
  var writeStream = channel.writeStream

  var extractOptions = {separator: '\r\n'}

  var readNextChunk = function(chunkedStream) {
    headExtractor.extractAsciiStreamHead(extractOptions, chunkedStream,
      function(err, chunkHead, restStream) {
        if(err) return writeStream.closeWrite(err)

        var chunkSizeText = chunkHead
        var extensionIndex = chunkHead.indexOf(';')
        if(extensionIndex != -1) {
          chunkSizeText = chunkHead.slice(0, extensionIndex)
        }

        if(chunkSizeText.length == 0 || /[^0-9a-fA-F]/.test(chunkSizeText)) {
          return writeStream.closeWrite(error(400, 'malformed chunked stream'))
        }

        var chunkSize = parseInt(chunkSizeText, 16)
        if(chunkSize == 0) {
          extractTrailingHeaders([], restStream, function(err, trailingHeaders) {
            if(err) return writeStream.closeWrite(err)

            // TODO: process tailing headers

            writeStream.closeWrite()
            restStream.closeRead()
          })

        } else {
          pipeChunk(chunkSize, restStream, writeStream, function(err, chunkedStream) {
            if(err) return writeStream.closeWrite(err)

            // extract the trailing CRLF after the chunk body
            headExtractor.extractAsciiStreamHead(extractOptions, chunkedStream,
              function(err, chunkHead, restStream) {
                if(err) return writeStream.closeWrite(err)
                if(chunkHead != '') return writeStream.closeWrite(
                  error(400, 'chunk body bigger than specified in chunk header'))

                readNextChunk(restStream)
              })
          })
        }
      })
  }
  readNextChunk(chunkedStream)

  return channel.readStream
}

module.exports = {
  chunkedStreamToStream: chunkedStreamToStream
}