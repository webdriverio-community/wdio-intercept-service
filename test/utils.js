'use strict'

const http = require('http')

const selenium = require('selenium-standalone')
const nodeStatic = require('node-static')

let grid, staticServer

module.exports = {
  startStaticServer,
  stopStaticServer,
  startSelenium,
  stopSelenium,
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const file = new nodeStatic.Server('./test/site')
    const server = http
      .createServer((request, response) => {
        request
          .addListener('end', () => {
            file.serve(request, response)
          })
          .resume()
      })
      .listen(8080, err => {
        if (err) {
          return reject(err)
        }
        console.log('Started static server on port ' + 8080)
        staticServer = server
        resolve(server)
      })
  })
}

function startSelenium() {
  return new Promise((resolve, reject) => {
    selenium.start((err, sel) => {
      if (err) {
        return reject(err)
      }
      console.log('Started Selenium server')
      grid = sel
      resolve(sel)
    })
  })
}

function stopSelenium() {
  return new Promise((resolve, reject) => {
    grid.on('exit', () => {
      resolve(true)
    })
    grid.kill()
  })
}

function stopStaticServer() {
  return new Promise((resolve, reject) => {
    staticServer.close(() => {
      resolve(true)
    })
  })
}
