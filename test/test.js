
var should = require('should')
var streamChunk = require('../lib/chunked-stream')
var streamConvert = require('quiver-stream-convert')

describe('chunked stream test', function() {
  it('simple stream to chunked stream', function(callback) {
    var testBuffers = [
      'hello',
      'javascript definitely rocks'
    ]

    var testChunkedContent = '5\r\nhello\r\n' +
        '1b\r\njavascript definitely rocks\r\n' +
        '0\r\n\r\n'

    var readStream = streamConvert.buffersToStream(testBuffers)
    var chunkedStream = streamChunk.streamToChunkedStream(readStream)
    streamConvert.streamToText(chunkedStream, function(err, text) {
      if(err) throw err

      text.should.equal(testChunkedContent)
      callback()
    })
  })

  it('simple chunked stream to stream', function(callback) {
    var testBuffers = [
      '5',
      '\r\n',
      'hello',
      '\r\n',
      '1b',
      '\r\n',
      'javascript definitely rocks',
      '\r\n',
      '0',
      '\r\n',
      '\r\n'
    ]

    var testContent = 'hellojavascript definitely rocks'

    var chunkedStream = streamConvert.buffersToStream(testBuffers)
    var readStream = streamChunk.chunkedStreamToStream(chunkedStream)
    streamConvert.streamToText(readStream, function(err, text) {
      if(err) throw err

      text.should.equal(testContent)
      callback()
    })
  })

  it('complex chunked stream to stream', function(callback) {
    var testBuffers = [
      '5\r',
      '\nhello\r',
      '\n1',
      'b\r',
      '\njava',
      'script definitely ',
      'rocks\r\n0',
      '\r\n\r',
      '\n'
    ]

    var testContent = 'hellojavascript definitely rocks'

    var chunkedStream = streamConvert.buffersToStream(testBuffers)
    var readStream = streamChunk.chunkedStreamToStream(chunkedStream)
    streamConvert.streamToText(readStream, function(err, text) {
      if(err) throw err

      text.should.equal(testContent)
      callback()
    })
  })
})