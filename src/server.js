const http = require('http')
const { URL } = require('url')
const Calculator = require('./calculator')

const PORT = process.env.PORT || 3000

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function sendJSON(res, statusCode, body) {
  res.writeHead(statusCode, CORS_HEADERS)
  res.end(body !== null ? JSON.stringify(body) : undefined)
}

function requestHandler(req, res) {
  // 1. Headers CORS sur toutes les réponses (via sendJSON)

  // 2. OPTIONS → 204 vide
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  // 3. Méthode ≠ GET → 405
  if (req.method !== 'GET') {
    res.writeHead(405, { ...CORS_HEADERS, Allow: 'GET, OPTIONS' })
    res.end(JSON.stringify({ error: 'Méthode non autorisée. Utiliser GET.' }))
    return
  }

  const parsedURL = new URL(req.url, 'http://127.0.0.1')

  // 4. Pathname ≠ /calculate → 404
  if (parsedURL.pathname !== '/calculate') {
    sendJSON(res, 404, { error: 'Route introuvable.' })
    return
  }

  const operation = parsedURL.searchParams.get('operation')
  const rawA = parsedURL.searchParams.get('a')
  const rawB = parsedURL.searchParams.get('b')

  // 5. Paramètres manquants → 400
  if (operation === null || rawA === null || rawB === null) {
    sendJSON(res, 400, { error: 'Paramètres attendus : operation, a, b' })
    return
  }

  // 6. Conversion en Number ; NaN → 400
  const a = Number(rawA)
  const b = Number(rawB)

  if (isNaN(a) || isNaN(b)) {
    sendJSON(res, 400, { error: 'Les paramètres a et b doivent être des nombres.' })
    return
  }

  const calc = new Calculator()

  // 7. Exécution via Calculator dans un try/catch
  let result
  try {
    switch (operation) {
      case 'add':
        result = calc.add(a, b)
        break
      case 'subtract':
        result = calc.subtract(a, b)
        break
      case 'multiply':
        result = calc.multiply(a, b)
        break
      case 'divide':
        result = calc.divide(a, b)
        break
      default:
        // 8. Opération inconnue → 400
        sendJSON(res, 400, { error: 'Opération inconnue. Utiliser : add, subtract, multiply, divide' })
        return
    }
  } catch (err) {
    sendJSON(res, 400, { error: err.message })
    return
  }

  // 9. Succès 200
  sendJSON(res, 200, { operation, a, b, result })
}

const server = http.createServer(requestHandler)

/* istanbul ignore next */
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`)
  })
}

module.exports = { requestHandler, server }
