
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

  it('combined chunk unchunk test', function(callback) {
    var unicodeBuffer = new Buffer('世界你好')

    var testBuffers = [
      'first ',
      'second ',
      unicodeBuffer.slice(0, 5),
      unicodeBuffer.slice(5, 12),
      ' third ',
      'fourth ',
      'fifth'
    ]

    var originalStream = streamConvert.buffersToStream(testBuffers)
    var chunkedStream = streamChunk.streamToChunkedStream(originalStream)
    var unchunkedStream = streamChunk.chunkedStreamToStream(chunkedStream)

    streamConvert.streamToText(unchunkedStream, function(err, text) {
      if(err) throw err

      text.should.equal('first second 世界你好 third fourth fifth')
      callback()
    })
  })
})